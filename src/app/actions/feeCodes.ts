"use server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { canApply } from "@/lib/applicant";
import { allowRequest } from "@/lib/request-limit";
import { APPLICATION_CHARGE } from "@/lib/application-fee";
import { applicationFeeFor } from "@/lib/payment-review";
import { feeCodeLimits, feeCodeProblem, feeWithCode, newFeeCode, normalizeFeeCode } from "@/lib/fee-code";

/**
 * What a referral code would do for the signed-in applicant: the fee they would pay with it. Nothing is reserved here;
 * the code is checked again, and counted, when the application is recorded. `code` names a key in t.apply.errors,
 * except `feeCodeRetry`: the check itself failed and says nothing about the code.
 *
 * `restore` is the form re-checking a code it already applied in this tab (on every page load): a code that still
 * works is answered from a roomier budget, so reloads and returns from a declined payment never use up the tries for
 * typing a code. A lookup that fails always counts as a typed try, whoever sent it, so the roomier budget cannot be
 * used to guess codes.
 */
export async function checkFeeCode(input: string, restore = false): Promise<{ ok: true; code: string; feeAmount: number } | { ok: false; code: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !canApply(session.user.role)) return { ok: false, code: "applySignIn" };
  try {
    // Codes are only asked for while this account goes through the paid checkout; otherwise nothing is looked up.
    if (!(await applicationFeeFor(session.user.id)).feeEnabled) return { ok: false, code: "feeCodeInvalid" };
    // A handful of tries is plenty for someone who was given a code; it is not enough to guess one.
    const allowed = restore === true ? await allowRequest("fee-code-restore", session.user.id, 40, 600) : await allowRequest("fee-code", session.user.id, 10, 600);
    if (!allowed) return { ok: false, code: "feeCodeRate" };
    const code = normalizeFeeCode(input);
    const row = code ? await prisma.feeCode.findUnique({ where: { code } }) : null;
    const problem = feeCodeProblem(row);
    if (problem || !row) {
      if (restore === true && !await allowRequest("fee-code", session.user.id, 10, 600)) return { ok: false, code: "feeCodeRate" };
      // "Switched off" reads the same as "no such code": an applicant has no use for the difference.
      return { ok: false, code: problem === "expired" ? "feeCodeExpired" : problem === "usedUp" ? "feeCodeUsedUp" : "feeCodeInvalid" };
    }
    return { ok: true, code: row.code, feeAmount: feeWithCode(row, APPLICATION_CHARGE.amount) };
  } catch {
    return { ok: false, code: "feeCodeRetry" };
  }
}

function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export type FeeCodeFormState = { error?: string; created?: string; saved?: boolean };

/**
 * Admin: add a referral code. `kind` says whether the fee is waived or reduced; for a reduced fee `feeAmount` is what
 * the applicant pays in whole US dollars. The result is shown under the form instead of throwing.
 */
export async function createFeeCode(form: FormData): Promise<FeeCodeFormState> {
  try { await requireAdmin(); } catch { return { error: "Administrator access required." }; }
  const checked = newFeeCode({ code: field(form, "code"), partner: field(form, "partner"), kind: field(form, "kind"), feeAmount: field(form, "feeAmount"), maxUses: field(form, "maxUses"), lastValidDay: field(form, "expiresAt"), note: field(form, "note") }, APPLICATION_CHARGE.amount);
  if ("error" in checked) return { error: checked.error };
  try {
    if (await prisma.feeCode.findUnique({ where: { code: checked.data.code }, select: { id: true } })) return { error: `The code ${checked.data.code} already exists.` };
    await prisma.feeCode.create({ data: checked.data });
  } catch { return { error: "The code could not be saved. Please try again." }; }
  revalidatePath("/dashboard/fee-codes");
  return { created: checked.data.code };
}

/**
 * Admin: change who a code is for, its note, how many times it may be used and its last valid day. The code text and
 * what the applicant pays stay as created, so applications already recorded with the code keep their meaning.
 */
export async function updateFeeCode(form: FormData): Promise<FeeCodeFormState> {
  try { await requireAdmin(); } catch { return { error: "Administrator access required." }; }
  const id = field(form, "id");
  const partner = field(form, "partner").slice(0, 120);
  if (!id) return { error: "The code could not be found. Reload the page." };
  if (!partner) return { error: "Say who the code is for." };
  const limits = feeCodeLimits({ maxUses: field(form, "maxUses"), lastValidDay: field(form, "expiresAt") });
  if ("error" in limits) return { error: limits.error };
  try {
    const changed = await prisma.feeCode.updateMany({ where: { id }, data: { partner, note: field(form, "note").slice(0, 500) || null, ...limits } });
    if (changed.count !== 1) return { error: "The code could not be found. Reload the page." };
  } catch { return { error: "The change could not be saved. Please try again." }; }
  revalidatePath("/dashboard/fee-codes");
  return { saved: true };
}

/** Admin: switch a code on or off. A code that is off cannot be applied; applications already recorded keep it. */
export async function setFeeCodeActive(form: FormData): Promise<void> {
  await requireAdmin();
  const id = field(form, "id");
  if (!id) return;
  await prisma.feeCode.updateMany({ where: { id }, data: { active: field(form, "active") === "true" } });
  revalidatePath("/dashboard/fee-codes");
}
