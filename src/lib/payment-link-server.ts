import type { PaymentLink } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findConfirmedTossPayment, tossPaymentState, type TossPaymentConfirmResult } from "@/lib/toss";
import { notifyPaymentLinkPaid } from "@/lib/notify";
import { PAYMENT_LINK_RECHECK_AFTER_MS } from "@/lib/payment-links";

type Paid = NonNullable<TossPaymentConfirmResult["paymentData"]>;

/** Records the confirmed charge on the link (only for the key that claimed it) and tells admissions once. */
export async function markPaymentLinkPaid(link: PaymentLink, payment: Paid): Promise<PaymentLink> {
  const paidAt = payment.approvedAt ? new Date(payment.approvedAt) : new Date();
  const updated = await prisma.paymentLink.updateMany({
    where: { id: link.id, paymentKey: payment.paymentKey, status: { not: "PAID" } },
    data: { status: "PAID", method: payment.method?.slice(0, 40) ?? null, receiptUrl: payment.receiptUrl?.slice(0, 500) ?? null, paidAt },
  });
  if (updated.count > 0) await notifyPaymentLinkPaid({ studentName: link.studentName, amount: link.amount, orderId: payment.orderId, method: payment.method, receiptUrl: payment.receiptUrl });
  return (await prisma.paymentLink.findUniqueOrThrow({ where: { id: link.id } }));
}

/** Puts a link claimed by `paymentKey` back to OPEN: that key was refused or ended at Toss, so no charge exists for it. */
export async function releasePaymentLink(link: PaymentLink, paymentKey: string): Promise<void> {
  await prisma.paymentLink.updateMany({ where: { id: link.id, paymentKey, status: "PROCESSING" }, data: { status: "OPEN", paymentKey: null, orderId: null, paymentKeyAt: null } });
}

/**
 * A link left in PROCESSING (the payer closed the tab during confirmation, or Toss did not answer) is settled from
 * Toss's record of its payment key: approved is recorded, ended is released, anything else stays and admissions hears.
 */
export async function settleStuckPaymentLink(link: PaymentLink): Promise<PaymentLink> {
  if (link.status !== "PROCESSING" || !link.paymentKey || !link.orderId) return link;
  if (link.paymentKeyAt && Date.now() - link.paymentKeyAt.getTime() < PAYMENT_LINK_RECHECK_AFTER_MS) return link;
  const found = await findConfirmedTossPayment(link.paymentKey, link.orderId, link.amount, link.currency);
  if (found.success && found.paymentData) return markPaymentLinkPaid(link, found.paymentData);
  const state = await tossPaymentState(link.paymentKey, link.orderId, link.amount, link.currency);
  if (state === "dead") {
    await releasePaymentLink(link, link.paymentKey);
    return (await prisma.paymentLink.findUniqueOrThrow({ where: { id: link.id } }));
  }
  // Still open or unknown at Toss: the link stays locked. Admissions was mailed when the confirmation got no answer.
  return link;
}
