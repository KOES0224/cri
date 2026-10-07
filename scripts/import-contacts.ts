/**
 * Imports enrolled customers from the consolidated workbook (sheet "전체 고객 리스트", one row per
 * person × cohort) into the Contact / ContactProgram tables.
 *
 *   npx tsx scripts/import-contacts.ts ~/Downloads/CRI_등록고객_리스트_2025Summer-2026Summer.xlsx            preview, no writes
 *   npx tsx scripts/import-contacts.ts <workbook.xlsx> --apply                                                write
 *
 * Re-running is safe: contacts are matched by student email and cohort rows by (contact, cohort).
 * Manual edits (level, year, notes, household, opt-out) are never overwritten; empty fields are filled in.
 * Uses DATABASE_URL from .env, i.e. the live database. The workbook holds personal data: keep it out of git.
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import { channelOf, cohortKeyOf, fullName, inferLevel, parseGradYear, phoneKey, reviewReasons, splitEmails, validEmail } from "../src/lib/contacts";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const file = args.find(a => !a.startsWith("--"))?.replace(/^~(?=\/)/, homedir());
if (!file) { console.error("Usage: npx tsx scripts/import-contacts.ts <workbook.xlsx> [--apply]"); process.exit(1); }

const SHEET = "전체 고객 리스트";
type Row = Record<string, string>;
const wb = XLSX.read(readFileSync(file), { type: "buffer" });
const ws = wb.Sheets[SHEET];
if (!ws) { console.error(`Sheet "${SHEET}" not found. Sheets: ${wb.SheetNames.join(", ")}`); process.exit(1); }
const rows = XLSX.utils.sheet_to_json<Row>(ws, { defval: "", raw: false }).map(r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim(), String(v ?? "").trim()])));

const col = (r: Row, ...names: string[]) => { for (const n of names) if (r[n]) return r[n]; return ""; };
const parseDate = (v: string) => { const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00+09:00`) : null; };

type Person = { email: string; firstName: string; lastName: string; gender: string | null; phone: string | null; parentName: string | null; parentEmail: string | null; parentPhone: string | null; school: string | null; gradYear: number | null; level: "SCHOOL" | "UNIVERSITY" | null; levelConfident: boolean; channel: string; agencyRaw: string | null; howLearned: string | null; reasons: string[]; programs: { cohortKey: string; cohortLabel: string; professor: string | null; status: string; agencyRaw: string | null; appliedAt: Date | null; paymentNote: string | null; adminNote: string | null; areaOfInterest: string | null; topic: string | null; resumeUrl: string | null }[] };

const people = new Map<string, Person>();
const skipped: string[] = [];
for (const r of rows) {
  const emails = splitEmails(col(r, "학생 이메일"));
  const email = emails.primary ?? col(r, "학생 이메일").toLowerCase();
  const cohortLabel = col(r, "기수");
  const cohortKey = cohortKeyOf(cohortLabel);
  if (!validEmail(email)) { skipped.push(`${col(r, "학생 이름")} (${cohortLabel}): invalid email "${email}"`); continue; }
  if (!cohortKey) { skipped.push(`${col(r, "학생 이름")}: unknown cohort "${cohortLabel}"`); continue; }
  const firstName = col(r, "이름(First)") || col(r, "학생 이름").split(" ").slice(0, -1).join(" ");
  const lastName = col(r, "성(Last)") || col(r, "학생 이름").split(" ").slice(-1).join(" ");
  const status = col(r, "상태");
  const notes = [col(r, "운영 메모"), status && status !== "등록" ? `Status at import: ${status}` : "", emails.others.length ? `Other email on file: ${emails.others.join(", ")}` : "", col(r, "재등록/형제 메모")].filter(Boolean).join("\n");
  const program = {
    cohortKey, cohortLabel, professor: col(r, "배정 교수(원문)", "배정 교수") || null,
    status: /NOT PAID|미납/i.test(status) ? "UNPAID" : "ENROLLED",
    agencyRaw: col(r, "유입 에이전시(원문)") || null, appliedAt: parseDate(col(r, "지원일")),
    paymentNote: col(r, "결제·납부 메모") || null, adminNote: notes || null,
    areaOfInterest: col(r, "관심 분야") || null, topic: col(r, "연구 주제") || null, resumeUrl: col(r, "이력서 URL") || null,
  };
  const existing = people.get(email);
  if (existing) { existing.programs.push(program); continue; }
  const school = col(r, "학교") || null;
  const inferred = inferLevel(school);
  const gradYear = parseGradYear(col(r, "졸업예정"));
  const person: Person = {
    email, firstName, lastName, gender: col(r, "성별") || null, phone: col(r, "학생 연락처") || null,
    parentName: fullName(col(r, "보호자 이름(First)"), col(r, "보호자 성(Last)")) || col(r, "보호자 이름") || null,
    parentEmail: splitEmails(col(r, "보호자 이메일")).primary, parentPhone: col(r, "보호자 연락처") || null,
    school, gradYear, level: inferred.confident ? inferred.level : null, levelConfident: inferred.confident,
    channel: channelOf(col(r, "유입 에이전시(원문)")), agencyRaw: col(r, "유입 에이전시(원문)") || null, howLearned: col(r, "알게 된 경로") || null,
    reasons: [], programs: [program],
  };
  person.reasons = reviewReasons({ school, studentLevel: person.level, gradYear, levelConfident: inferred.confident, email });
  people.set(email, person);
}

console.log(`Rows: ${rows.length} · people: ${people.size} · skipped rows: ${skipped.length}`);
for (const s of skipped) console.log(`  skipped: ${s}`);
const flagged = [...people.values()].filter(p => p.reasons.length);
console.log(`Needs review: ${flagged.length}`);
for (const p of flagged) console.log(`  ${fullName(p.firstName, p.lastName)} · ${p.school ?? "-"} · ${p.gradYear ?? "-"} → ${p.reasons.join("; ")}`);
const repeats = [...people.values()].filter(p => p.programs.length > 1);
console.log(`Repeat customers: ${repeats.map(p => `${fullName(p.firstName, p.lastName)} (${p.programs.map(x => x.cohortKey).join(", ")})`).join("; ") || "none"}`);

if (!apply) { console.log("\nPreview only. Add --apply to write."); process.exit(0); }

const prisma = new PrismaClient();
async function main() {
  let created = 0, updated = 0, programRows = 0;
  for (const p of people.values()) {
    const base = { gender: p.gender, phone: p.phone, parentName: p.parentName, parentEmail: p.parentEmail, parentPhone: p.parentPhone, parentPhoneKey: phoneKey(p.parentPhone), school: p.school, channel: p.channel, agencyRaw: p.agencyRaw, howLearned: p.howLearned };
    const current = await prisma.contact.findUnique({ where: { email: p.email } });
    let contactId: string;
    if (!current) {
      const row = await prisma.contact.create({ data: { email: p.email, firstName: p.firstName, lastName: p.lastName, ...base, studentLevel: p.level, gradYear: p.gradYear, levelSource: p.level ? "INFERRED" : "IMPORT", reviewNeeded: p.reasons.length > 0, reviewReason: p.reasons.join("; ") || null } });
      contactId = row.id; created++;
    } else {
      // Fill blanks only; never touch manual decisions.
      const fill: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(base)) if (v && !(current as Record<string, unknown>)[k]) fill[k] = v;
      if (!current.studentLevel && p.level && current.levelSource !== "MANUAL") { fill.studentLevel = p.level; fill.levelSource = "INFERRED"; }
      if (!current.gradYear && p.gradYear && current.levelSource !== "MANUAL") fill.gradYear = p.gradYear;
      if (Object.keys(fill).length) await prisma.contact.update({ where: { id: current.id }, data: fill });
      contactId = current.id; updated++;
    }
    for (const pr of p.programs) {
      await prisma.contactProgram.upsert({
        where: { contactId_cohortKey: { contactId, cohortKey: pr.cohortKey } },
        create: { contactId, ...pr },
        update: { professor: pr.professor ?? undefined, status: pr.status, agencyRaw: pr.agencyRaw ?? undefined, appliedAt: pr.appliedAt ?? undefined, paymentNote: pr.paymentNote ?? undefined, areaOfInterest: pr.areaOfInterest ?? undefined, topic: pr.topic ?? undefined, resumeUrl: pr.resumeUrl ?? undefined },
      });
      programRows++;
    }
  }
  console.log(`\nDone. Contacts created ${created}, existing ${updated}; program rows written ${programRows}.`);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
