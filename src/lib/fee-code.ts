/**
 * Referral codes: a code CRI gives to an agency or school. An applicant who enters it at the payment step pays a
 * reduced application fee, or none at all. Pure rules, shared by the form, the server actions and the admin page;
 * the rows live in the FeeCode table.
 */
export type FeeCodeRow = { code: string; feeAmount: number; maxUses: number | null; usedCount: number; expiresAt: Date | null; active: boolean };
export type FeeCodeProblem = "invalid" | "inactive" | "expired" | "usedUp";

/** Codes are letters, digits and hyphens, 4 to 32 characters, compared in upper case. Returns null for anything else. */
export function normalizeFeeCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const code = input.trim().toUpperCase();
  return /^[A-Z0-9][A-Z0-9-]{2,30}[A-Z0-9]$/.test(code) ? code : null;
}

/** Why a code cannot be used right now, or null when it can. A missing row reads as `invalid`. */
export function feeCodeProblem(row: FeeCodeRow | null | undefined, now: Date = new Date()): FeeCodeProblem | null {
  if (!row) return "invalid";
  if (!row.active) return "inactive";
  if (row.expiresAt && row.expiresAt <= now) return "expired";
  if (row.maxUses !== null && row.usedCount >= row.maxUses) return "usedUp";
  return null;
}

/** What the applicant pays with this code: never negative, never more than the normal fee. 0 means the fee is waived. */
export function feeWithCode(row: Pick<FeeCodeRow, "feeAmount">, normalFee: number): number {
  if (!Number.isInteger(row.feeAmount)) return normalFee;
  return Math.min(Math.max(row.feeAmount, 0), normalFee);
}

/** Admin-facing description of what a code does, e.g. "Fee waived" or "$20 USD (normally $50 USD)". */
export function feeCodeEffect(row: Pick<FeeCodeRow, "feeAmount">, normalFee: number): string {
  const due = feeWithCode(row, normalFee);
  return due === 0 ? "Fee waived" : due >= normalFee ? `No discount ($${normalFee} USD)` : `$${due} USD (normally $${normalFee} USD)`;
}

/** The calendar day in Korea (yyyy-mm-dd) that a moment falls on. Korea has no daylight saving: always UTC+9. */
export function koreanDay(date: Date): string {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * The last second of a calendar day in Korea: what the admin's "last valid day" means. Null when the text is not a real
 * day (JavaScript would roll 2027-02-30 over into March).
 */
export function endOfKoreanDay(day: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const date = new Date(`${day}T23:59:59+09:00`);
  return Number.isNaN(date.getTime()) || koreanDay(date) !== day ? null : date;
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "");

/**
 * The limits an admin may set on a code, from form text: how many times it can be used and its last valid day in Korea.
 * Empty text means "no limit". A last valid day that has already passed is refused: switching a code off is how it is
 * stopped. Returns the values to store, or what is wrong.
 */
export function feeCodeLimits(input: { maxUses?: unknown; lastValidDay?: unknown }, now: Date = new Date()): { maxUses: number | null; expiresAt: Date | null } | { error: string } {
  const usesText = text(input.maxUses), dayText = text(input.lastValidDay);
  const maxUses = usesText ? Number(usesText) : null;
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 100000)) return { error: "The number of uses must be a whole number of 1 or more, or left empty for no limit." };
  const expiresAt = dayText ? endOfKoreanDay(dayText) : null;
  if (dayText && !expiresAt) return { error: "The last valid day is not a valid date." };
  if (expiresAt && expiresAt <= now) return { error: "The last valid day has already passed. Choose today or a later day, or leave it empty." };
  return { maxUses, expiresAt };
}

export type NewFeeCode = { code: string; partner: string; feeAmount: number; maxUses: number | null; expiresAt: Date | null; note: string | null };

/**
 * Checks a new code the way the admin form does (also used by scripts/referral-codes.ts). `kind` says whether the fee
 * is waived or reduced; for a reduced fee `feeAmount` is what the applicant pays, in whole US dollars below the normal
 * fee. The choice decides, not a stray amount: a waiver is always 0.
 */
export function newFeeCode(input: { code?: unknown; partner?: unknown; kind?: unknown; feeAmount?: unknown; maxUses?: unknown; lastValidDay?: unknown; note?: unknown }, normalFee: number, now: Date = new Date()): { data: NewFeeCode } | { error: string } {
  const kind = text(input.kind);
  if (kind !== "waive" && kind !== "reduce") return { error: "Choose whether the fee is waived or reduced." };
  const feeAmount = kind === "waive" ? 0 : Number(text(input.feeAmount) || "NaN");
  if (kind === "reduce" && !(Number.isInteger(feeAmount) && feeAmount >= 1 && feeAmount < normalFee)) return { error: `A reduced fee must be a whole number from 1 to ${normalFee - 1}.` };
  const code = normalizeFeeCode(text(input.code));
  if (!code) return { error: "The code must be 4 to 32 letters, digits or hyphens, and may not start or end with a hyphen." };
  const partner = text(input.partner).slice(0, 120);
  if (!partner) return { error: "Say who the code is for." };
  const limits = feeCodeLimits(input, now);
  if ("error" in limits) return limits;
  return { data: { code, partner, feeAmount, ...limits, note: text(input.note).slice(0, 500) || null } };
}
