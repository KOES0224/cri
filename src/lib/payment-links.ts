/**
 * Payment links: a page at /pay/<token> that whoever holds the link can pay without an account. Pure helpers, shared
 * by the admin form, the public page and the confirm action (also used in the browser, so no server imports here).
 *
 * Rules:
 * - Won only. The link goes through the won merchant id (payment UI `NEXT_PUBLIC_TOSS_WIDGET_VARIANT_KEY_KRW`), the
 *   one proven live; Korean-issued cards are refused on the dollar one.
 * - One link takes one payment. The confirm action claims the link with the payment key before asking Toss to confirm,
 *   so a second payer (or a second tab) is refused before any charge exists.
 * - The token is the only secret: 24 random characters, unguessable, never derived from the student's name.
 * - Virtual accounts are refused before the Toss window opens: they finish later by bank deposit, which needs a webhook
 *   this site does not have.
 */

export const PAYMENT_LINK_MIN_AMOUNT = 1000;
export const PAYMENT_LINK_MAX_AMOUNT = 100_000_000;
export const PAYMENT_LINK_ORDER_PREFIX = "CRI_PAY_";

const TOKEN_ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A fresh link token: 24 characters from a 56-letter alphabet (about 139 bits). */
export function newPaymentLinkToken(): string {
  const values = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(values, (value) => TOKEN_ALPHABET[value % TOKEN_ALPHABET.length]).join("");
}

/** True for something that could be one of our tokens; anything else is a 404 without a database read. */
export function validPaymentLinkToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9]{24}$/.test(token);
}

/** A new order id for one payment attempt: `CRI_PAY_<32 hex>` (Toss allows 6 to 64 of [A-Za-z0-9_-]). */
export function newPaymentLinkOrderId(): string {
  return `${PAYMENT_LINK_ORDER_PREFIX}${crypto.randomUUID().replaceAll("-", "")}`;
}

export function validPaymentLinkOrderId(orderId: unknown): orderId is string {
  return typeof orderId === "string" && /^CRI_PAY_[0-9a-f]{32}$/.test(orderId);
}

/** Parses an admin-typed won amount ("11,475,750", "11475750원"); null unless it is a whole number in range. */
export function parseWonAmount(input: string): number | null {
  const digits = input.replace(/[\s,원₩]/g, "");
  if (!/^\d{1,9}$/.test(digits)) return null;
  const amount = Number(digits);
  return amount >= PAYMENT_LINK_MIN_AMOUNT && amount <= PAYMENT_LINK_MAX_AMOUNT ? amount : null;
}

export function formatWon(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

/** The order name shown in the Toss window, on the card statement detail and on the receipt. */
export function paymentLinkOrderName(studentName: string, purpose: string): string {
  const what = purpose.trim() || "CRI 프로그램 비용";
  return `${what} (학생: ${studentName.trim()})`.slice(0, 100);
}

/** Minutes after which a link stuck in PROCESSING is re-checked with Toss on the next page view. */
export const PAYMENT_LINK_RECHECK_AFTER_MS = 2 * 60 * 1000;
