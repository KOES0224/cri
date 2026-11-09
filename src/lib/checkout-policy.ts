/**
 * Rules for an applicant's checkout row (one per account and program) when they press Pay again or reopen the form.
 *
 * The safety argument rests on two facts:
 *  - A charge only happens when our server asks the provider to confirm a payment, and the payment key is stored on the
 *    row immediately before that request (first key wins). A row created by this code (`keyTracked`) that has no
 *    payment key therefore has no charge behind it and is replaced with a fresh order whenever Pay is pressed.
 *  - A row with a payment key is judged only by the provider's own record of that payment: `paid` is recorded as an
 *    application instead of being charged again, `dead` (refused, expired, fully cancelled) may be replaced, and
 *    anything else is left alone until it settles or admissions reconciles it.
 * Rows from before the key was stored (`keyTracked` false) cannot be proven chargeless: they keep the old behaviour.
 */
export type PaymentState = "paid" | "dead" | "open" | "unknown";
export type CheckoutRow = { id: string; status: string; paymentKey: string | null; keyTracked: boolean; amount: number; currency: string; expiresAt: Date };
export type CheckoutStep = "create" | "reuse" | "replace" | "recover" | "review" | "completed";

export function nextCheckoutStep(
  row: CheckoutRow | null,
  context: {
    /** The form being paid for equals the one stored on the row. */
    unchanged: boolean;
    charge: { amount: number; currency: string };
    now: Date;
    /** Provider state of the row's payment key, with the row id and key it was read for; null when none was read. */
    keyState: { id: string; paymentKey: string; state: PaymentState } | null;
  },
): CheckoutStep {
  if (!row) return "create";
  if (row.status !== "PENDING") return "completed";
  if (!row.paymentKey) {
    // A fresh order id for every attempt: nothing was charged, and the provider never sees an order id twice.
    if (row.keyTracked) return "replace";
    const current = row.amount === context.charge.amount && row.currency === context.charge.currency;
    return current && context.unchanged && row.expiresAt > context.now ? "reuse" : "review";
  }
  // The state must have been read for exactly this row and key; a row that changed in between is not touched.
  const known = context.keyState && context.keyState.id === row.id && context.keyState.paymentKey === row.paymentKey ? context.keyState.state : "unknown";
  return known === "paid" ? "recover" : known === "dead" ? "replace" : "review";
}

/**
 * Whether the application form is locked while a checkout row exists: a payment that reached the provider and is not
 * settled yet, or a row from before keys were stored. A tracked row without a key leaves the form editable.
 */
export function checkoutLocksForm(row: Pick<CheckoutRow, "status" | "paymentKey" | "keyTracked"> | null | undefined): boolean {
  return Boolean(row && row.status === "PENDING" && (row.paymentKey || !row.keyTracked));
}

/** The provider says it has no such payment (unknown key, or the ten-minute confirm window passed): nothing was charged. */
export function confirmSaysNoPayment(providerCode: string | undefined): boolean {
  return providerCode === "NOT_FOUND_PAYMENT" || providerCode === "NOT_FOUND_PAYMENT_SESSION";
}

/**
 * Provider answers to a confirm request that do not mean "this attempt failed and nothing was charged": the payment or
 * the order was already processed, the first request is still running, or the provider itself failed. Everything else
 * with a provider code is a refusal of this attempt (and is still double-checked against the provider's record).
 */
export function confirmRefusalIsFinal(providerCode: string | undefined): boolean {
  return Boolean(providerCode) && !["ALREADY_PROCESSED_PAYMENT", "DUPLICATED_ORDER_ID", "IDEMPOTENT_REQUEST_PROCESSING", "PROVIDER_ERROR", "FAILED_INTERNAL_SYSTEM_PROCESSING", "FAILED_PAYMENT_INTERNAL_SYSTEM_PROCESSING", "UNKNOWN_PAYMENT_ERROR"].includes(providerCode!);
}

/** How long a payment may stay unsettled at the provider before admissions is asked to look (the provider expires open payments within 30 minutes). */
export const SETTLE_GRACE_MS = 40 * 60 * 1000;
