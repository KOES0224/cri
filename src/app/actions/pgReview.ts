"use server";
import { PG_REVIEW_PRODUCT, pgReviewViewer } from "@/lib/pg-review";
import { confirmTossPayment } from "@/lib/toss";

/** Confirms the sample won payment with Toss. No application, email or analytics event is created. */
export async function confirmReviewPayment({ paymentKey, orderId, amount }: { paymentKey: string; orderId: string; amount: number }) {
  if (!(await pgReviewViewer())) return { error: "이 페이지는 결제 심사 계정으로 로그인해야 사용할 수 있습니다." };
  if (typeof paymentKey !== "string" || paymentKey.length > 500 || typeof orderId !== "string" || !/^CRI_REVIEW_[A-Za-z0-9-]{8,64}$/.test(orderId)) return { error: "결제 정보가 올바르지 않습니다." };
  if (amount !== PG_REVIEW_PRODUCT.amount) return { error: "결제 금액이 상품 금액과 다릅니다." };
  const confirmed = await confirmTossPayment(paymentKey, orderId, amount, PG_REVIEW_PRODUCT.currency);
  if (!confirmed.success || !confirmed.paymentData) return { error: "토스페이먼츠에서 결제 승인을 확인하지 못했습니다. 카드에 결제 내역이 있다면 support@cri.kr로 알려 주세요." };
  const p = confirmed.paymentData;
  return { success: true as const, orderId: p.orderId, amount: p.totalAmount, currency: p.currency, method: p.method, approvedAt: p.approvedAt, receiptUrl: p.receiptUrl };
}
