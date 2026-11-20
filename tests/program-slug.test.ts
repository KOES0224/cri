import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { firstFreeSlug, isValidSlug, normalizeSlug, programPath, programRef, slugFromTitle } from "../src/lib/program-slug";
import { CURRENT_REF_HEADER, missingPageRewrite } from "../src/lib/missing-page";

test("slugs are lowercase words joined by single hyphens", () => {
  assert.equal(normalizeSlug("  UPenn International Law "), "upenn-international-law");
  assert.equal(normalizeSlug("Research & Development"), "research-and-development");
  assert.equal(normalizeSlug("Students' Café — 2026!"), "students-cafe-2026");
  assert.equal(normalizeSlug("1-on-1 Advanced Research Program"), "1-on-1-advanced-research-program");
  assert.equal(normalizeSlug("겨울 온라인 리서치"), "");
});

test("the live program titles get short, readable slugs", () => {
  const expected: Record<string, string> = {
    "Foundations of Experimental Design": "foundations-of-experimental-design",
    "Advanced Research in Biomedical Engineering": "advanced-research-in-biomedical-engineering",
    "Frontiers in Biochemistry": "frontiers-in-biochemistry",
    "UChicago Computer Science": "uchicago-computer-science",
    "Columbia Applied Mathematics": "columbia-applied-mathematics",
    "Columbia Applied Physics": "columbia-applied-physics",
    "MIT Business": "mit-business",
    "UChicago Economy": "uchicago-economy",
    "Cambridge Finance": "cambridge-finance",
    "UPenn International Law": "upenn-international-law",
    "Oxford Education": "oxford-education",
    "Oxford Psychology": "oxford-psychology",
    "USC Film": "usc-film",
    "Quantitative Analysis of Biochemistry": "quantitative-analysis-of-biochemistry",
    // A subtitle after the colon and a leading article are left out.
    "The Secrets of Immortality: Stem Cells, Gene Networks, and the Science of Regeneration": "secrets-of-immortality",
    "Climate Geopolitics: The Green Race, Energy Security, and Great Power Competition": "climate-geopolitics",
    "The Architecture of Choice: Behavioral Economics, Cognitive Bias, and Nudge Theory": "architecture-of-choice",
  };
  for (const [title, slug] of Object.entries(expected)) assert.equal(slugFromTitle(title), slug, title);
});

test("awkward titles: long ones are cut at a word, unusable ones give no slug", () => {
  const long = slugFromTitle("An Unusually Long Program Title That Keeps Going Well Past Any Sensible Length For An Address");
  assert.equal(long, "unusually-long-program-title-that-keeps-going-well-past-any");
  assert.ok(long.length <= 60);
  // A main title too short to stand alone falls back to the whole title.
  assert.equal(slugFromTitle("AI: Ethics and Society"), "ai-ethics-and-society");
  // The article goes only when what is left can stand as a slug.
  assert.equal(slugFromTitle("The Brain"), "brain");
  assert.equal(slugFromTitle("The AI"), "the-ai");
  assert.equal(slugFromTitle("겨울 온라인 리서치"), "");
  assert.equal(slugFromTitle("!!"), "");
});

test("typed slugs are refused when malformed or shaped like a database id", () => {
  for (const slug of ["oxford-psychology", "usc-film", "1-on-1", "abc"]) assert.equal(isValidSlug(slug), true, slug);
  for (const slug of ["", "ab", "Oxford", "oxford--psychology", "-oxford", "oxford-", "oxford psychology", "a".repeat(81), "cmn71d2q700099nq8f02evjeb"]) {
    assert.equal(isValidSlug(slug), false, slug);
  }
});

test("a taken slug gets -2, -3…", () => {
  const taken = new Set(["mit-business", "mit-business-2"]);
  assert.equal(firstFreeSlug("usc-film", (s) => taken.has(s)), "usc-film");
  assert.equal(firstFreeSlug("mit-business", (s) => taken.has(s)), "mit-business-3");
  const base = "a".repeat(80);
  assert.equal(firstFreeSlug(base, (s) => s === base).length, 80);
});

test("program addresses use the slug when there is one, the id otherwise", () => {
  const withSlug = { id: "cmn71d2sl000b9nq8hpcpenv8", slug: "oxford-psychology", category: "Seoul Research Program" };
  assert.equal(programRef(withSlug), "oxford-psychology");
  assert.equal(programPath(withSlug), "/research/program/oxford-psychology");
  assert.equal(programPath({ ...withSlug, slug: null }), "/research/program/cmn71d2sl000b9nq8hpcpenv8");
  assert.equal(programPath({ id: "abc", slug: "policy-internship", category: "Internship" }), "/intern/policy-internship");
});

/** Runs the proxy helper with /api/public/exists answering `status` and, optionally, the current slug. */
async function visit(url: string, pathname: string, status: number, currentRef?: string) {
  const realFetch = globalThis.fetch;
  const asked: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    asked.push(String(input));
    return new Response(null, { status, headers: currentRef ? { [CURRENT_REF_HEADER]: currentRef } : {} });
  }) as typeof fetch;
  try {
    return { response: await missingPageRewrite(new NextRequest(url), pathname), asked };
  } finally {
    globalThis.fetch = realFetch;
  }
}

test("an old program address gets a permanent redirect that keeps the language and the ad tracking parameters", async () => {
  const id = "cmn71d2sl000b9nq8hpcpenv8";
  const english = await visit(`https://criglobal.org/research/program/${id}?utm_source=meta&fbclid=AbC`, `/research/program/${id}`, 204, "oxford-psychology");
  assert.equal(english.response?.status, 308);
  assert.equal(english.response?.headers.get("location"), "https://criglobal.org/research/program/oxford-psychology?utm_source=meta&fbclid=AbC");
  // Browsers must not remember the redirect: renaming a program back would otherwise loop for them.
  assert.equal(english.response?.headers.get("cache-control"), "no-store");
  assert.match(english.asked[0], /\/api\/public\/exists\?kind=program&id=cmn71d2sl000b9nq8hpcpenv8$/);

  const korean = await visit(`https://criglobal.org/ko/research/program/${id}?n_media=1`, `/research/program/${id}`, 204, "oxford-psychology");
  assert.equal(korean.response?.status, 308);
  assert.equal(korean.response?.headers.get("location"), "https://criglobal.org/ko/research/program/oxford-psychology?n_media=1");

  const internship = await visit("https://criglobal.org/intern/old-name", "/intern/old-name", 204, "policy-internship");
  assert.equal(internship.response?.headers.get("location"), "https://criglobal.org/intern/policy-internship");
});

test("the current address renders, an unknown one is a 404, and other pages are not looked up", async () => {
  const current = await visit("https://criglobal.org/research/program/oxford-psychology", "/research/program/oxford-psychology", 204);
  assert.equal(current.response, null);
  // A header that only repeats the address asked for must not loop.
  const same = await visit("https://criglobal.org/research/program/oxford-psychology", "/research/program/oxford-psychology", 204, "oxford-psychology");
  assert.equal(same.response, null);

  const missing = await visit("https://criglobal.org/research/program/nope", "/research/program/nope", 404);
  assert.equal(missing.response?.headers.get("x-middleware-rewrite"), "https://criglobal.org/_not-found-content");

  const hub = await visit("https://criglobal.org/research/winter", "/research/winter", 204, "oxford-psychology");
  assert.equal(hub.response, null);
  assert.equal(hub.asked.length, 0);
});
