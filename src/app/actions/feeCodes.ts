"use server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { canApply } from "@/lib/applicant";
import { allowRequest } from "@/lib/request-limit";
import { APPLICATION_CHARGE } from "@/lib/application-fee";
import { feeCodeProblem, feeWithCode, normalizeFeeCode } from "@/lib/fee-code";

/**
 * What a referral code would do for the signed-in applicant: the fee they would pay with it. Nothing is reserved here;
 * the code is checked again, and counted, when the application is recorded. `code` names a key in t.apply.errors.
 */
export async function checkFeeCode(input: string): Promise<{ ok: true; code: string; feeAmount: number } | { ok: false; code: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !canApply(session.user.role)) return { ok: false, code: "applySignIn" };
  // A handful of tries is plenty for someone who was given a code; it is not enough to guess one.
  if (!await allowRequest("fee-code", session.user.id, 10, 600)) return { ok: false, code: "feeCodeRate" };
  const code = normalizeFeeCode(input);
  if (!code) return { ok: false, code: "feeCodeInvalid" };
  try {
    const row = await prisma.feeCode.findUnique({ where: { code } });
    const problem = feeCodeProblem(row);
    // "Switched off" reads the same as "no such code": an applicant has no use for the difference.
    if (problem || !row) return { ok: false, code: problem === "expired" ? "feeCodeExpired" : problem === "usedUp" ? "feeCodeUsedUp" : "feeCodeInvalid" };
    return { ok: true, code: row.code, feeAmount: feeWithCode(row, APPLICATION_CHARGE.amount) };
  } catch {
    return { ok: false, code: "feeCodeInvalid" };
  }
}

function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export type FeeCodeFormState = { error?: string; created?: string };

/**
 * Admin: add a referral code. `feeAmount` is what the applicant pays in whole US dollars; 0 waives the fee. Shaped for
 * useActionState: the result is shown under the form instead of throwing.
 */
export async function createFeeCode(_previous: FeeCodeFormState, form: FormData): Promise<FeeCodeFormState> {
  try { await requireAdmin(); } catch { return { error: "Administrator access required." }; }
  const code = normalizeFeeCode(field(form, "code"));
  const partner = field(form, "partner").slice(0, 120);
  const feeAmount = Number(field(form, "feeAmount") || "0");
  const maxUsesText = field(form, "maxUses");
  const maxUses = maxUsesText ? Number(maxUsesText) : null;
  const expiresText = field(form, "expiresAt");
  // The date field is a calendar day in Korea; the code stays valid through the end of that day.
  const expiresAt = /^\d{4}-\d{2}-\d{2}$/.test(expiresText) ? new Date(`${expiresText}T23:59:59+09:00`) : null;
  const note = field(form, "note").slice(0, 500) || null;
  if (!code) return { error: "The code must be 4 to 32 letters, digits or hyphens, and may not start or end with a hyphen." };
  if (!partner) return { error: "Say who the code is for." };
  if (!Number.isInteger(feeAmount) || feeAmount < 0 || feeAmount >= APPLICATION_CHARGE.amount) return { error: `The fee with the code must be a whole number from 0 to ${APPLICATION_CHARGE.amount - 1}. 0 waives the fee.` };
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > 100000)) return { error: "The number of uses must be a whole number of 1 or more, or left empty for no limit." };
  if (expiresText && (!expiresAt || Number.isNaN(expiresAt.getTime()))) return { error: "The last valid day is not a valid date." };
  try {
    if (await prisma.feeCode.findUnique({ where: { code }, select: { id: true } })) return { error: `The code ${code} already exists.` };
    await prisma.feeCode.create({ data: { code, partner, feeAmount, maxUses, expiresAt, note } });
  } catch { return { error: "The code could not be saved. Please try again." }; }
  revalidatePath("/dashboard/fee-codes");
  return { created: code };
}

/** Admin: switch a code on or off. A code that is off cannot be applied; applications already recorded keep it. */
export async function setFeeCodeActive(form: FormData): Promise<void> {
  await requireAdmin();
  const id = field(form, "id");
  if (!id) return;
  await prisma.feeCode.updateMany({ where: { id }, data: { active: field(form, "active") === "true" } });
  revalidatePath("/dashboard/fee-codes");
}
