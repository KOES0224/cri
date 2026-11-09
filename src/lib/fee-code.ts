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
