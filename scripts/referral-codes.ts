/**
 * Referral codes from the command line: list them, or create several at once from a JSON file. The same rules as the
 * admin form (src/lib/fee-code.ts); the admin page /dashboard/fee-codes remains the place to edit or switch them off.
 *
 *   npx tsx scripts/referral-codes.ts                                     list every code with its use
 *   npx tsx scripts/referral-codes.ts --file ~/cri-codes.json             preview what would be created, no writes
 *   npx tsx scripts/referral-codes.ts --file ~/cri-codes.json --apply     create them
 *
 * Keep the file OUTSIDE this repository (the repository is public; partner names and codes are not). The script
 * refuses a file inside it.
 *
 * The file is a list. Only these keys are read, and any other key is refused so a typo cannot turn into a different
 * code: `code`, `partner`, `feeAmount`, `maxUses`, `lastValidDay`, `note`. `feeAmount` is what the applicant pays in
 * whole US dollars: 0 or left out waives the fee. `maxUses`, `lastValidDay` (a day in Korea, yyyy-mm-dd) and `note` are
 * optional.
 *
 *   [
 *     { "code": "ABC-7KQ2", "partner": "ABC Education" },
 *     { "code": "SCHOOL-20", "partner": "Seoul Example School", "feeAmount": 20, "maxUses": 30, "lastValidDay": "2027-02-28", "note": "Winter 2026" }
 *   ]
 *
 * Nothing is changed when any entry is wrong or a code already exists: fix the file and run it again.
 * Uses DATABASE_URL from .env, i.e. the live database.
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { relative, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { APPLICATION_CHARGE } from "../src/lib/application-fee";
import { feeCodeEffect, feeCodeProblem, koreanDay, newFeeCode, type NewFeeCode } from "../src/lib/fee-code";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const fileIndex = args.indexOf("--file");
const file = fileIndex >= 0 ? args[fileIndex + 1]?.replace(/^~(?=\/)/, homedir()) : undefined;
const KEYS = ["code", "partner", "feeAmount", "maxUses", "lastValidDay", "note"];

const describe = (row: { code: string; partner: string; feeAmount: number; maxUses: number | null; expiresAt: Date | null }) =>
  `${row.code.padEnd(20)} ${feeCodeEffect(row, APPLICATION_CHARGE.amount).padEnd(28)} uses ${row.maxUses ?? "no limit"} · last day ${row.expiresAt ? koreanDay(row.expiresAt) : "none"} · ${row.partner}`;

async function list() {
  const codes = await prisma.feeCode.findMany({ orderBy: { createdAt: "asc" } });
  if (!codes.length) { console.log("No referral codes yet."); return; }
  const now = new Date();
  for (const row of codes) console.log(`${describe(row)} · used ${row.usedCount} · ${feeCodeProblem(row, now) ?? "active"}`);
}

/** One entry of the file as the admin form would receive it, or what is wrong with it. */
function entryInput(entry: unknown): { input: Record<string, unknown> } | { error: string } {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) return { error: "must be an object like { \"code\": …, \"partner\": … }." };
  const input = entry as Record<string, unknown>;
  const unknown = Object.keys(input).filter((key) => !KEYS.includes(key));
  if (unknown.length) return { error: `unknown key ${unknown.map((key) => `"${key}"`).join(", ")}. Allowed: ${KEYS.join(", ")}.` };
  for (const key of KEYS) {
    const value = input[key];
    if (value !== undefined && value !== null && typeof value !== "string" && typeof value !== "number") return { error: `"${key}" must be text or a number.` };
  }
  const amountText = input.feeAmount === undefined || input.feeAmount === null ? "" : String(input.feeAmount).trim();
  const amount = amountText === "" ? 0 : Number(amountText);
  return { input: { ...input, kind: amount === 0 ? "waive" : "reduce", feeAmount: amount } };
}

async function create(path: string) {
  if (!relative(process.cwd(), resolve(path)).startsWith("..")) throw new Error("Keep the file outside the repository (e.g. ~/cri-codes.json): the repository is public, partner names and codes are not.");
  let entries: unknown;
  try { entries = JSON.parse(readFileSync(path, "utf8").replace(/^﻿/, "")); } catch (error) { throw new Error(`Could not read ${path}: ${error instanceof Error ? error.message : error}`); }
  if (!Array.isArray(entries) || !entries.length) throw new Error("The file must be a non-empty list of codes.");
  const rows: NewFeeCode[] = [];
  const problems: string[] = [];
  entries.forEach((entry, index) => {
    const label = `Entry ${index + 1}${entry && typeof entry === "object" && "code" in entry ? ` (${String((entry as { code: unknown }).code)})` : ""}`;
    const prepared = entryInput(entry);
    if ("error" in prepared) { problems.push(`${label}: ${prepared.error}`); return; }
    const checked = newFeeCode(prepared.input, APPLICATION_CHARGE.amount);
    if ("error" in checked) problems.push(`${label}: ${checked.error}`);
    else if (rows.some((row) => row.code === checked.data.code)) problems.push(`${label}: the code ${checked.data.code} appears twice in the file.`);
    else rows.push(checked.data);
  });
  const existing = await prisma.feeCode.findMany({ where: { code: { in: rows.map((row) => row.code) } }, select: { code: true } });
  for (const row of existing) problems.push(`The code ${row.code} already exists.`);
  if (problems.length) { for (const problem of problems) console.error(problem); throw new Error("Nothing was created."); }
  for (const row of rows) console.log(`${apply ? "Creating" : "Would create"}  ${describe(row)}`);
  const waiving = rows.filter((row) => row.feeAmount === 0).length;
  const summary = `${rows.length} code${rows.length === 1 ? "" : "s"}: ${waiving} waive the fee, ${rows.length - waiving} reduce it`;
  if (!apply) { console.log(`\nPreview only (${summary}). Add --apply to create them.`); return; }
  await prisma.$transaction(rows.map((data) => prisma.feeCode.create({ data })));
  console.log(`\nCreated ${summary}. They can be used as soon as the application fee is on.`);
}

(file ? create(file) : fileIndex >= 0 ? Promise.reject(new Error("--file needs a path.")) : list())
  .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
