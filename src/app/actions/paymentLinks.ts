"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { allowRequest } from "@/lib/request-limit";
import { confirmTossPayment, findConfirmedTossPayment, tossPaymentState } from "@/lib/toss";
import { notifyPaymentLinkCheck } from "@/lib/notify";
import { markPaymentLinkPaid, releasePaymentLink } from "@/lib/payment-link-server";
import { newPaymentLinkToken, parseWonAmount, paymentLinkOrderName, validPaymentLinkOrderId, validPaymentLinkToken } from "@/lib/payment-links";

function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export type PaymentLinkFormState = { error?: string; created?: { token: string; studentName: string; amount: number } };

/** Admin: a new won payment link for one student. The payer's name is not needed; the Toss window asks for nothing more than the card. */
export async function createPaymentLink(form: FormData): Promise<PaymentLinkFormState> {
  let admin;
  try { admin = await requireAdmin(); } catch { return { error: "관리자만 만들 수 있습니다." }; }
  const studentName = field(form, "studentName").slice(0, 40);
  const amount = parseWonAmount(field(form, "amount"));
  const purpose = field(form, "purpose").slice(0, 60);
  const note = field(form, "note").slice(0, 500) || null;
  if (!studentName) return { error: "학생 이름을 입력해 주세요." };
  if (amount === null) return { error: "금액은 1,000원 이상 1억 원 이하의 정수로 입력해 주세요." };
  try {
    const link = await prisma.paymentLink.create({ data: { token: newPaymentLinkToken(), studentName, amount, currency: "KRW", orderName: paymentLinkOrderName(studentName, purpose), note, createdBy: admin.id } });
    revalidatePath("/dashboard/payment-links");
    return { created: { token: link.token, studentName, amount } };
  } catch { return { error: "저장하지 못했습니다. 다시 시도해 주세요." }; }
}

/** Admin: switch a link off (its page then shows "not available") or on again. A paid link stays paid either way. */
export async function setPaymentLinkActive(form: FormData): Promise<void> {
  await requireAdmin();
  const id = field(form, "id");
  if (!id) return;
  await prisma.paymentLink.updateMany({ where: { id }, data: { active: field(form, "active") === "true" } });
  revalidatePath("/dashboard/payment-links");
}

export type PaymentLinkResult =
  | { ok: true; studentName: string; orderName: string; amount: number; orderId: string; method: string | null; paidAt: string | null; receiptUrl: string | null }
  | { ok: false; error: string; retry: boolean };

/**
 * Public, no sign-in: confirms the payment the Toss window just authenticated for this link. The link is claimed with
 * the payment key before Toss is asked to confirm, so only one payment can ever be charged for a link; any other key
 * is refused here, before a charge exists.
 */
export async function confirmPaymentLink(input: { token: string; paymentKey: string; orderId: string; amount: number }): Promise<PaymentLinkResult> {
  const { token, paymentKey, orderId, amount } = input ?? ({} as never);
  if (!validPaymentLinkToken(token) || typeof paymentKey !== "string" || !paymentKey || paymentKey.length > 200 || !validPaymentLinkOrderId(orderId)) return { ok: false, error: "결제 정보가 올바르지 않습니다.", retry: false };
  if (!(await allowRequest("payment-link-confirm", token, 30, 600))) return { ok: false, error: "잠시 후 다시 시도해 주세요.", retry: false };
  let link = await prisma.paymentLink.findUnique({ where: { token } });
  if (!link) return { ok: false, error: "결제 링크를 찾을 수 없습니다.", retry: false };
  const paid = (l: typeof link & object): PaymentLinkResult => ({ ok: true, studentName: l.studentName, orderName: l.orderName, amount: l.amount, orderId: l.orderId ?? orderId, method: l.method, paidAt: l.paidAt?.toISOString() ?? null, receiptUrl: l.receiptUrl });

  if (link.status === "PAID") {
    if (link.paymentKey === paymentKey) return paid(link);
    return { ok: false, error: "이 링크는 이미 결제가 완료되었습니다. 방금 결제는 승인하지 않았으므로 청구되지 않습니다.", retry: false };
  }
  if (!link.active) return { ok: false, error: "이 결제 링크는 더 이상 사용할 수 없습니다. 방금 결제는 승인하지 않았으므로 청구되지 않습니다.", retry: false };
  if (Number(amount) !== link.amount) return { ok: false, error: "결제 금액이 안내된 금액과 다릅니다. 방금 결제는 승인하지 않았으므로 청구되지 않습니다.", retry: true };

  // Claim the link for this key. Only an open link, or one this same key already claimed (a reload), can be claimed.
  const claimed = await prisma.paymentLink.updateMany({
    where: { id: link.id, OR: [{ status: "OPEN" }, { status: "PROCESSING", paymentKey }] },
    data: { status: "PROCESSING", paymentKey, orderId, paymentKeyAt: new Date() },
  }).catch(() => ({ count: 0 }));
  if (claimed.count === 0) return { ok: false, error: "이 링크로 다른 결제가 진행 중입니다. 방금 결제는 승인하지 않았으므로 청구되지 않습니다. 몇 분 뒤 링크를 다시 열어 확인해 주세요.", retry: false };
  link = await prisma.paymentLink.findUniqueOrThrow({ where: { id: link.id } });

  const confirmed = await confirmTossPayment(paymentKey, orderId, link.amount, link.currency);
  if (confirmed.success && confirmed.paymentData) return paid(await markPaymentLinkPaid(link, confirmed.paymentData));

  // Toss may have approved it after all (a repeated confirm, a late answer): its record of this key decides.
  const found = await findConfirmedTossPayment(paymentKey, orderId, link.amount, link.currency);
  if (found.success && found.paymentData) return paid(await markPaymentLinkPaid(link, found.paymentData));
  const state = await tossPaymentState(paymentKey, orderId, link.amount, link.currency);
  if (confirmed.providerCode || state === "dead") {
    // Toss refused this payment (card declined, limit exceeded…): nothing was charged and the link opens again.
    await releasePaymentLink(link, paymentKey);
    return { ok: false, error: `결제가 승인되지 않았습니다.${confirmed.providerMessage ? ` (${confirmed.providerMessage})` : ""} 청구된 금액은 없으며, 다른 카드로 다시 시도하실 수 있습니다.`, retry: true };
  }
  await notifyPaymentLinkCheck({ studentName: link.studentName, orderId, situation: `Toss did not answer the confirmation (state: ${state}).` });
  return { ok: false, error: "결제 승인 결과를 아직 받지 못했습니다. 다시 결제하지 마시고 잠시 후 이 링크를 다시 열어 확인해 주세요. 담당자에게도 자동으로 알림이 갔습니다.", retry: false };
}
