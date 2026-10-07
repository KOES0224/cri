/**
 * Customer directory rules shared by the admin page, the import script, the CSV export and the
 * Resend audience sync. Pure functions only; Prisma lives in contact-query.ts.
 *
 * A segment is derived from studentLevel + gradYear against the current calendar year, so it stays
 * correct as years pass. "Graduating this year" means gradYear === current year.
 */
export type StudentLevel = "SCHOOL" | "UNIVERSITY";

export const SEGMENTS = [
  { key: "HS_CURRENT", label: "High school · enrolled", ko: "고등 재학" },
  { key: "HS_GRADUATING", label: "High school · graduating this year", ko: "고3 · 올해 졸업" },
  { key: "HS_ALUMNI", label: "Finished high school · likely in university", ko: "고교 졸업 · 대학 재학 추정" },
  { key: "UNI_CURRENT", label: "University · enrolled", ko: "대학 재학" },
  { key: "UNI_GRADUATING", label: "University · graduating this year", ko: "대학 · 올해 졸업" },
  { key: "UNI_ALUMNI", label: "University graduate", ko: "대학 졸업" },
  { key: "UNKNOWN", label: "Level or year unknown", ko: "미확인" },
] as const;
export type SegmentKey = (typeof SEGMENTS)[number]["key"];
export const SEGMENT_KEYS = SEGMENTS.map(s => s.key) as SegmentKey[];
export function segmentLabel(key: string) { return SEGMENTS.find(s => s.key === key)?.label ?? key; }

export function segmentOf(level: string | null | undefined, gradYear: number | null | undefined, now: Date = new Date()): SegmentKey {
  if ((level !== "SCHOOL" && level !== "UNIVERSITY") || !gradYear) return "UNKNOWN";
  const year = now.getFullYear();
  if (level === "SCHOOL") return gradYear > year ? "HS_CURRENT" : gradYear === year ? "HS_GRADUATING" : "HS_ALUMNI";
  return gradYear > year ? "UNI_CURRENT" : gradYear === year ? "UNI_GRADUATING" : "UNI_ALUMNI";
}

export const COHORTS: Record<string, string> = {
  "2026S": "2026 Summer (Seoul)",
  "2025W": "2025 Winter (Online)",
  "2025S": "2025 Summer (Seoul)",
};
export function cohortKeyOf(label: string) {
  const hit = Object.entries(COHORTS).find(([, l]) => l === label.trim());
  return hit?.[0] ?? null;
}

export function parseGradYear(value: unknown): number | null {
  const n = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isInteger(n) && n >= 2000 && n <= 2045 ? n : null;
}

/** Known school names and abbreviations that the generic patterns would miss or misread. */
const SCHOOL_NAMES = /\b(kis|nlcs|yiss|spps|bcc|sis|sfs|apis|chadwick|deerfield|andover|harrow|blair academy|westminster school|culver|mercersburg|choate|loyola|dulwich college|malvern college|eton college|kmla|graded school|the harker school|governor's academy|thornton academy|st\.? stephen|episcopal|webb schools|village school|fay school|wilbraham|northfield mount hermon|palo alto high|leigh high|glenbrook|palos verdes|orange county school of the arts|british school jakarta|international school|cornerstone|gangnam international scholars|ilead)\b/i;
const SCHOOL_NAMES_KO = /(서울과학고|고등학교|중학교|국제학교|아카데미)/;
const UNIVERSITY_NAMES = /\b(rhode island school of design|risd|suny|soongsil|chung-ang|binghamton|rochester|arizona state|uc san diego|ucsd|wisconsin-milwaukee|caltech|mit|kaist|postech)\b/i;
const UNIVERSITY_NAMES_KO = /(대학교|대학)/;

/** Guess SCHOOL/UNIVERSITY from a school name. `confident` is false when the name is ambiguous or unknown. */
export function inferLevel(school: string | null | undefined): { level: StudentLevel | null; confident: boolean; reason: string } {
  const s = (school ?? "").trim();
  if (!s) return { level: null, confident: false, reason: "No school recorded" };
  const l = s.toLowerCase();
  if (UNIVERSITY_NAMES.test(l) || UNIVERSITY_NAMES_KO.test(s) || /universit|\buniv\b|institute of technology|polytechnic/.test(l)) return { level: "UNIVERSITY", confident: true, reason: "University in school name" };
  if (SCHOOL_NAMES.test(l) || SCHOOL_NAMES_KO.test(s) || /high ?school|academy|preparatory|\bprep\b|secondary|gymnasium|collegiate|middle school|\bschool\b/.test(l)) return { level: "SCHOOL", confident: true, reason: "School in school name" };
  if (/\bcollege\b/.test(l)) return { level: null, confident: false, reason: `"College" is ambiguous: ${s}` };
  return { level: null, confident: false, reason: `Unrecognised school name: ${s}` };
}

/** Normalise the free-text agency column into a stable channel name. */
export function channelOf(agencyRaw: string | null | undefined): string {
  const a = (agencyRaw ?? "").trim();
  const l = a.toLowerCase();
  if (!a) return "Direct";
  if (l.startsWith("lourus") || ["안남경", "안태용", "우해영", "이은택", "이혜준"].includes(a)) return "Lourus";
  if (l.startsWith("am")) return "AM";
  if (l.includes("supia") || a.includes("수피아")) return "Supia";
  if (l.includes("primestone") || a.includes("프라임스톤")) return "Primestone";
  if (l.includes("pre-meeting") || l.includes("premeeting")) return "Direct (pre-meeting)";
  if (a.includes("세미나")) return "Direct (seminar)";
  if (l.includes("cherry") || a.includes("소윤이") || a.includes("소개")) return "Referral";
  if (a.includes("비전아이비")) return "Vision Ivy";
  if (a.includes("크림슨")) return "Crimson / Log&Coding";
  if (l === "sa") return "Seoul Academy";
  return a;
}

export function phoneKey(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits.slice(-9);
}

export function fullName(first: string | null | undefined, last: string | null | undefined) {
  return `${first ?? ""} ${last ?? ""}`.replace(/\s+/g, " ").trim();
}

/** First valid address out of a cell that may hold several ("a@x.com, b@y.com"), plus the rest. */
export function splitEmails(value: string | null | undefined): { primary: string | null; others: string[] } {
  const parts = (value ?? "").toLowerCase().split(/[\s,;/]+/).filter(validEmail);
  return { primary: parts[0] ?? null, others: parts.slice(1) };
}

export function validEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

/** Reasons a record needs a human look before it is used for segmentation. Empty when it is fine. */
export function reviewReasons(input: { school?: string | null; studentLevel?: string | null; gradYear?: number | null; levelConfident?: boolean; email?: string | null }, now: Date = new Date()): string[] {
  const reasons: string[] = [];
  if (!input.studentLevel) reasons.push(input.levelConfident === false ? inferLevel(input.school).reason : "Academic level missing");
  if (!input.gradYear) reasons.push("Graduation year missing or not a year");
  else {
    const gap = input.gradYear - now.getFullYear();
    if (input.studentLevel === "SCHOOL" && gap > 6) reasons.push(`Graduation year ${input.gradYear} is far away for a school student`);
    if (gap < -8) reasons.push(`Graduation year ${input.gradYear} is long past`);
  }
  if (input.email && !validEmail(input.email)) reasons.push("Email address looks invalid");
  return reasons;
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const cell = (v: string | number | null | undefined) => { const s = v == null ? "" : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return "﻿" + rows.map(r => r.map(cell).join(",")).join("\r\n") + "\r\n";
}
