/**
 * Locale-aware wrappers around src/lib/program-policy.ts for public pages.
 * program-policy.ts keeps returning English facts (used by inventory scripts and admin); this module
 * substitutes dictionary strings for other locales without changing the underlying rules.
 */
import { DEFAULT_LOCALE, getDictionary, type Locale } from "@/i18n/config";
import { admissionState, programDate, programFacts, seoulDay, type ProgramKind, type ProgramLike } from "@/lib/program-policy";

export type LocalizedProgramFacts = ReturnType<typeof programFacts>;

/** Same shape as programFacts(); English is returned unchanged. */
export function programFactsLocalized(program: ProgramLike, locale: Locale): LocalizedProgramFacts {
  const facts = programFacts(program);
  if (locale === DEFAULT_LOCALE) return facts;
  const f = getDictionary(locale).facts;
  const kind = facts.kind;
  const summer = kind === "seoul" || kind === "global";
  return {
    ...facts,
    name: kind === "other" ? facts.name : f.names[kind],
    format: summer ? f.format.inPerson : kind === "winter" ? f.format.online : kind === "individual" ? f.format.individual : program.locationFormat || f.format.contact,
    professorHours: summer ? f.professorHours.summer : kind === "winter" ? f.professorHours.winter : kind === "individual" ? f.professorHours.individual : facts.professorHours,
    taHours: summer ? f.taHours.summer : kind === "winter" ? f.taHours.winter : kind === "individual" ? f.taHours.individual : facts.taHours,
    audience: summer ? f.audience.summer : kind === "winter" ? f.audience.winter : f.audience.individual,
    duration: kind === "individual" ? f.duration.individual : f.duration.cohort,
  };
}

/** Program season name for a card that already carries an English name (kind "other" keeps the stored category). */
export function programNameLocalized(kind: ProgramKind, fallback: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE || kind === "other") return fallback;
  return getDictionary(locale).facts.names[kind];
}

/** Delivery format for a card that already carries an English format string. */
export function programFormatLocalized(kind: ProgramKind, fallback: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE || kind === "other") return fallback;
  const f = getDictionary(locale).facts.format;
  return kind === "winter" ? f.online : kind === "individual" ? f.individual : f.inPerson;
}

export function admissionLabelLocalized(program: ProgramLike, locale: Locale, now?: Date): string {
  const state = admissionState(program, now);
  const labels = getDictionary(locale).facts.admission;
  return state === "OPEN" ? labels.open : state === "ENDED" ? labels.ended : labels.closed;
}

function seoulParts(value: Date | string): { year: number; month: number; day: number } | null {
  const day = seoulDay(value);
  if (!day) return null;
  const [y, m, d] = day.split("-").map(Number);
  return { year: y, month: m, day: d };
}

/** Single date in Seoul time. English keeps programDate(); Korean renders "2026년 12월 19일". */
export function formatProgramDate(value: Date | string, locale: Locale): string {
  if (locale === "ko") {
    const parts = seoulParts(value);
    if (parts) return `${parts.year}년 ${parts.month}월 ${parts.day}일`;
  }
  return programDate(value);
}

/**
 * Inclusive date range in Seoul time. English: "Dec 19, 2026 – Dec 30, 2026".
 * Korean drops the repeated year: "2026년 12월 19일 – 12월 30일".
 */
export function formatProgramDateRange(start: Date | string, end: Date | string | null | undefined, locale: Locale): string {
  const first = formatProgramDate(start, locale);
  if (!end) return first;
  if (locale === "ko") {
    const a = seoulParts(start);
    const b = seoulParts(end);
    if (a && b && a.year === b.year) return `${first} – ${b.month}월 ${b.day}일`;
  }
  return `${first} – ${formatProgramDate(end, locale)}`;
}
