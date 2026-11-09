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
 * the code is checked again, and counted, when the application is recorded. `code` names a key in t.apply.errors,
 * except `feeCodeRetry`: the check itself failed and says nothing about the code.
 *
 * `restore` is the form re-checking a code it already applied in this tab (on every page load): it has its own,
 * roomier budget, so reloads and returns from a declined payment never use up the tries for typing a code.
 */
export async function checkFeeCode(input: string, restore = false): Promise<{ ok: true; code: string; feeAmount: number } | { ok: false; code: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !canApply(session.user.role)) return { ok: false, code: "applySignIn" };
  try {
    // A handful of tries is plenty for someone who was given a code; it is not enough to guess one.
    const allowed = restore === true ? await allowRequest("fee-code-restore", session.user.id, 40, 600) : await allowRequest("fee-code", session.user.id, 10, 600);
    if (!allowed) return { ok: false, code: "feeCodeRate" };
    const code = normalizeFeeCode(input);
    if (!code) return { ok: false, code: "feeCodeInvalid" };
    const row = await prisma.feeCode.findUnique({ where: { code } });
    const problem = feeCodeProblem(row);
    // "Switched off" reads the same as "no such code": an applicant has no use for the difference.
    if (problem || !row) return { ok: false, code: problem === "expired" ? "feeCodeExpired" : problem === "usedUp" ? "feeCodeUsedUp" : "feeCodeInvalid" };
    return { ok: true, code: row.code, feeAmount: feeWithCode(row, APPLICATION_CHARGE.amount) };
  } catch {
    return { ok: false, code: "feeCodeRetry" };
  }
}

function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export type FeeCodeFormState = { error?: string; created?: string };

/**
 * Admin: add a referral code. `kind` says whether the fee is waived or reduced; for a reduced fee `feeAmount` is what
 * the applicant pays in whole US dollars. The result is shown under the form instead of throwing.
 */
export async function createFeeCode(form: FormData): Promise<FeeCodeFormState> {
  try { await requireAdmin(); } catch { return { error: "Administrator access required." }; }
  const code = normalizeFeeCode(field(form, "code"));
  const partner = field(form, "partner").slice(0, 120);
  // The choice decides, not whichever amount field happened to be on screen: a waiver is always 0.
  const kind = field(form, "kind");
  if (kind !== "waive" && kind !== "reduce") return { error: "Choose whether the fee is waived or reduced." };
  const feeAmount = kind === "waive" ? 0 : Number(field(form, "feeAmount") || "NaN");
  if (kind === "reduce" && !(Number.isInteger(feeAmount) && feeAmount >= 1)) return { error: `A reduced fee must be a whole number from 1 to ${APPLICATION_CHARGE.amount - 1}.` };
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
