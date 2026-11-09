"use server";
import { PG_REVIEW_PRODUCTS, pgReviewViewer, reviewProductForOrder } from "@/lib/pg-review";
import { confirmTossPayment } from "@/lib/toss";

/** Confirms a sample payment (won or US dollars, told apart by the order id) with Toss. No application, email or analytics event is created. */
export async function confirmReviewPayment({ paymentKey, orderId, amount }: { paymentKey: string; orderId: string; amount: number }) {
  if (!(await pgReviewViewer())) return { error: "이 페이지는 결제 심사 계정으로 로그인해야 사용할 수 있습니다." };
  const key = reviewProductForOrder(orderId);
  if (typeof paymentKey !== "string" || !paymentKey || paymentKey.length > 500 || !key) return { error: "결제 정보가 올바르지 않습니다." };
  const product = PG_REVIEW_PRODUCTS[key];
  if (amount !== product.amount) return { error: "결제 금액이 상품 금액과 다릅니다." };
  const confirmed = await confirmTossPayment(paymentKey, orderId, product.amount, product.currency);
  if (!confirmed.success || !confirmed.paymentData) {
    // This page is only for the review account and admins, so Toss's own reason is shown to make a failed test self-explanatory.
    const reason = confirmed.providerCode ? ` (토스페이먼츠 응답: ${confirmed.providerCode}${confirmed.providerMessage ? ` · ${confirmed.providerMessage}` : ""})` : "";
    return { error: `토스페이먼츠에서 결제 승인을 확인하지 못했습니다.${reason} 카드에 결제 내역이 있다면 support@cri.kr로 알려 주세요.` };
  }
  const p = confirmed.paymentData;
  return { success: true as const, orderId: p.orderId, amount: p.totalAmount, currency: p.currency, method: p.method, approvedAt: p.approvedAt, receiptUrl: p.receiptUrl };
}
