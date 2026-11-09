/**
 * Sample products for checking the payment gateway end to end: a won one (the registration review) and a US-dollar
 * one (the overseas merchant id). Pure data, shared by the pages, the browser widget and the confirm action.
 */
export const PG_REVIEW_PRODUCT = {
  name: "CRI 지원서 심사 서비스",
  orderName: "CRI 지원서 심사 서비스 (심사용)",
  amount: 10000,
  currency: "KRW",
  label: "₩10,000",
} as const;

/** One dollar: enough to prove the overseas path with a real card, small enough to cancel without a second thought. */
export const PG_REVIEW_PRODUCT_USD = {
  name: "CRI application review service (USD test)",
  orderName: "CRI application review service (test)",
  amount: 1,
  currency: "USD",
  label: "$1.00 USD",
} as const;

export type ReviewProductKey = "krw" | "usd";
export const PG_REVIEW_PRODUCTS = { krw: PG_REVIEW_PRODUCT, usd: PG_REVIEW_PRODUCT_USD } as const;

/** Order ids carry the product: `CRI_REVIEW_<uuid>` is the won one, `CRI_REVIEWUSD_<uuid>` the US-dollar one. */
export const REVIEW_ORDER_PREFIX = { krw: "CRI_REVIEW_", usd: "CRI_REVIEWUSD_" } as const;

/** Which sample product an order id belongs to; null for anything that is not one of ours. */
export function reviewProductForOrder(orderId: unknown): ReviewProductKey | null {
  if (typeof orderId !== "string") return null;
  if (/^CRI_REVIEWUSD_[A-Za-z0-9-]{8,48}$/.test(orderId)) return "usd";
  if (/^CRI_REVIEW_[A-Za-z0-9-]{8,48}$/.test(orderId)) return "krw";
  return null;
}
