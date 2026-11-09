/**
 * Referral codes from the command line: list them, or create several at once from a JSON file. The same rules as the
 * admin form (src/lib/fee-code.ts); the admin page /dashboard/fee-codes remains the place to edit or switch them off.
 *
 *   npx tsx scripts/referral-codes.ts                               list every code with its use
 *   npx tsx scripts/referral-codes.ts --file codes.json             preview what would be created, no writes
 *   npx tsx scripts/referral-codes.ts --file codes.json --apply     create them
 *
 * The file is a list. `feeAmount` is what the applicant pays in whole US dollars: 0 or left out waives the fee.
 * `maxUses`, `lastValidDay` (a day in Korea, yyyy-mm-dd) and `note` are optional.
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
import { PrismaClient } from "@prisma/client";
import { APPLICATION_CHARGE } from "../src/lib/application-fee";
import { feeCodeEffect, feeCodeProblem, koreanDay, newFeeCode, type NewFeeCode } from "../src/lib/fee-code";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const fileIndex = args.indexOf("--file");
const file = fileIndex >= 0 ? args[fileIndex + 1]?.replace(/^~(?=\/)/, homedir()) : undefined;

const describe = (row: { code: string; partner: string; feeAmount: number; maxUses: number | null; expiresAt: Date | null }) =>
  `${row.code.padEnd(20)} ${feeCodeEffect(row, APPLICATION_CHARGE.amount).padEnd(28)} uses ${row.maxUses ?? "no limit"} · last day ${row.expiresAt ? koreanDay(row.expiresAt) : "none"} · ${row.partner}`;

async function list() {
  const codes = await prisma.feeCode.findMany({ orderBy: { createdAt: "asc" } });
  if (!codes.length) { console.log("No referral codes yet."); return; }
  const now = new Date();
  for (const row of codes) console.log(`${describe(row)} · used ${row.usedCount} · ${feeCodeProblem(row, now) ?? "active"}`);
}

async function create(path: string) {
  let entries: unknown;
  try { entries = JSON.parse(readFileSync(path, "utf8")); } catch (error) { throw new Error(`Could not read ${path}: ${error instanceof Error ? error.message : error}`); }
  if (!Array.isArray(entries) || !entries.length) throw new Error("The file must be a non-empty list of codes.");
  const rows: NewFeeCode[] = [];
  const problems: string[] = [];
  entries.forEach((entry, index) => {
    const input = (entry && typeof entry === "object" ? entry : {}) as Record<string, unknown>;
    const amount = input.feeAmount === undefined || input.feeAmount === null || input.feeAmount === "" ? 0 : Number(input.feeAmount);
    const checked = newFeeCode({ ...input, kind: amount === 0 ? "waive" : "reduce", feeAmount: amount }, APPLICATION_CHARGE.amount);
    if ("error" in checked) problems.push(`Entry ${index + 1} (${String(input.code ?? "no code")}): ${checked.error}`);
    else if (rows.some((row) => row.code === checked.data.code)) problems.push(`Entry ${index + 1}: the code ${checked.data.code} appears twice in the file.`);
    else rows.push(checked.data);
  });
  const existing = await prisma.feeCode.findMany({ where: { code: { in: rows.map((row) => row.code) } }, select: { code: true } });
  for (const row of existing) problems.push(`The code ${row.code} already exists.`);
  if (problems.length) { for (const problem of problems) console.error(problem); throw new Error("Nothing was created."); }
  for (const row of rows) console.log(`${apply ? "Creating" : "Would create"}  ${describe(row)}`);
  if (!apply) { console.log(`\nPreview only. Add --apply to create ${rows.length} code${rows.length === 1 ? "" : "s"}.`); return; }
  await prisma.$transaction(rows.map((data) => prisma.feeCode.create({ data })));
  console.log(`\nCreated ${rows.length} code${rows.length === 1 ? "" : "s"}. They can be used as soon as the application fee is on.`);
}

(file ? create(file) : fileIndex >= 0 ? Promise.reject(new Error("--file needs a path.")) : list())
  .catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
