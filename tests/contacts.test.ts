import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { channelOf, inferLevel, parseGradYear, phoneKey, reviewReasons, segmentOf, toCsv } from "../src/lib/contacts";
import { verifySvixSignature } from "../src/lib/svix";

const in2026 = new Date("2026-10-07T00:00:00Z");

test("segments follow level and graduation year against the current year", () => {
  assert.equal(segmentOf("SCHOOL", 2028, in2026), "HS_CURRENT");
  assert.equal(segmentOf("SCHOOL", 2026, in2026), "HS_GRADUATING");
  assert.equal(segmentOf("SCHOOL", 2025, in2026), "HS_ALUMNI");
  assert.equal(segmentOf("UNIVERSITY", 2029, in2026), "UNI_CURRENT");
  assert.equal(segmentOf("UNIVERSITY", 2026, in2026), "UNI_GRADUATING");
  assert.equal(segmentOf("UNIVERSITY", 2024, in2026), "UNI_ALUMNI");
  assert.equal(segmentOf(null, 2027, in2026), "UNKNOWN");
  assert.equal(segmentOf("SCHOOL", null, in2026), "UNKNOWN");
});

test("school names are classified, ambiguous ones are flagged", () => {
  assert.deepEqual([inferLevel("Chadwick International School").level, inferLevel("Chadwick International School").confident], ["SCHOOL", true]);
  assert.equal(inferLevel("Dulwich College Seoul").level, "SCHOOL");
  assert.equal(inferLevel("North London Collegiate School Jeju").level, "SCHOOL");
  assert.equal(inferLevel("University of California, San Diego").level, "UNIVERSITY");
  assert.equal(inferLevel("Soongsil Univ.").level, "UNIVERSITY");
  assert.equal(inferLevel("Rhode Island School of Design").level, "UNIVERSITY");
  assert.equal(inferLevel("SUNY Binghamton (Binghamton University)").level, "UNIVERSITY");
  assert.equal(inferLevel("서울과학고등학교").level, "SCHOOL");
  assert.equal(inferLevel("whiterubi1").confident, false);
  assert.equal(inferLevel("Some College").confident, false);
  assert.equal(inferLevel("").confident, false);
});

test("review reasons catch missing or implausible data", () => {
  assert.deepEqual(reviewReasons({ studentLevel: "SCHOOL", gradYear: 2028 }, in2026), []);
  assert.ok(reviewReasons({ studentLevel: null, gradYear: 2028, school: "whiterubi1", levelConfident: false }, in2026)[0].includes("Unrecognised"));
  assert.ok(reviewReasons({ studentLevel: "SCHOOL", gradYear: null }, in2026).some(r => r.includes("Graduation year")));
  assert.ok(reviewReasons({ studentLevel: "SCHOOL", gradYear: 2040 }, in2026).some(r => r.includes("far away")));
});

test("agency text collapses into channels; helpers normalise years and phones", () => {
  assert.equal(channelOf("Lourus(안남경)"), "Lourus");
  assert.equal(channelOf("안태용"), "Lourus");
  assert.equal(channelOf("AM (former student)"), "AM");
  assert.equal(channelOf("Stanley Prep/수피아"), "Supia");
  assert.equal(channelOf("Pre-meeting"), "Direct (pre-meeting)");
  assert.equal(channelOf(""), "Direct");
  assert.equal(channelOf("GATE"), "GATE");
  assert.equal(parseGradYear("2027"), 2027);
  assert.equal(parseGradYear("Other years as applicable"), null);
  assert.equal(phoneKey("+1 (951) 972 - 7087 & Jennifer Kim"), "519727087");
  assert.equal(phoneKey("010-9885-8078"), "109885­8078".replace(/\D/g, "").slice(-9));
  assert.equal(phoneKey("123"), null);
});

test("csv quotes commas, quotes and newlines and starts with a BOM", () => {
  const csv = toCsv([["a", "b,c"], ['say "hi"', "line1\nline2"]]);
  assert.ok(csv.startsWith("﻿"));
  assert.ok(csv.includes('"b,c"') && csv.includes('"say ""hi"""') && csv.includes('"line1\nline2"'));
});

test("svix signatures verify only with the right secret, body and a fresh timestamp", () => {
  const secret = "whsec_" + Buffer.from("test-secret-key-0123456789").toString("base64");
  const body = JSON.stringify({ type: "contact.updated", data: { email: "a@b.co", unsubscribed: true } });
  const now = 1_790_000_000_000;
  const timestamp = String(Math.floor(now / 1000));
  const sig = createHmac("sha256", Buffer.from("test-secret-key-0123456789")).update(`msg_1.${timestamp}.${body}`).digest("base64");
  const headers = { id: "msg_1", timestamp, signature: `v1,${sig}` };
  assert.equal(verifySvixSignature(secret, headers, body, now), true);
  assert.equal(verifySvixSignature(secret, headers, body + " ", now), false);
  assert.equal(verifySvixSignature("whsec_" + Buffer.from("other").toString("base64"), headers, body, now), false);
  assert.equal(verifySvixSignature(secret, headers, body, now + 10 * 60 * 1000), false);
  assert.equal(verifySvixSignature(secret, { ...headers, signature: `v0,${sig} v1,${sig}` }, body, now), true);
});
