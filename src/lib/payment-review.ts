import { prisma } from "@/lib/prisma";
import { APPLICATION_FEE_ENABLED } from "@/lib/application-fee";

/**
 * Accounts flagged with `paymentReviewer` (set only by scripts/payment-review-account.ts, never through the site)
 * let the payment gateway's reviewers walk the paid checkout while applications are free for everyone else.
 * Any lookup failure counts as "not a reviewer", so real applicants always keep the site-wide setting.
 */
export async function isPaymentReviewer(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { paymentReviewer: true } });
    return Boolean(user?.paymentReviewer);
  } catch {
    return false;
  }
}

/** Whether this account's application goes through the paid checkout. */
export async function applicationFeeFor(userId: string | null | undefined): Promise<{ feeEnabled: boolean; reviewer: boolean }> {
  const reviewer = await isPaymentReviewer(userId);
  return { feeEnabled: APPLICATION_FEE_ENABLED || reviewer, reviewer };
}
