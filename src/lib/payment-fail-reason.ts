/**
 * What a failure code from the payment provider's window means for the payer, and whether admissions should hear about
 * it. The provider's own text is never shown to the payer: it may be in Korean, and a lost, stolen or flagged card is
 * reported as a plain decline.
 */
export type PaymentFailReason = "canceled" | "notApproved" | "currency" | "limit" | "details" | "declined" | "generic";

/** The code as it may be shown and logged: letters, digits and underscores only. */
export function sanitizeFailCode(value: unknown): string {
  return typeof value === "string" ? value.replace(/[^A-Z0-9_]/gi, "").slice(0, 60) : "";
}

/**
 * Only the payer's own cancel reads as "you canceled". PAY_PROCESS_ABORTED is the provider's general "this payment
 * failed in the window" (a failed bank verification, a refusal), so it gets the try-another-card wording.
 */
export function paymentFailReason(code: string): PaymentFailReason {
  if (!code || /^(PAY_PROCESS_CANCELED|USER_CANCEL|PAYMENT_CANCELLED)$/i.test(code)) return "canceled";
  if (/ABORTED/i.test(code)) return "notApproved";
  if (/NOT_SUPPORTED/i.test(code)) return "currency";
  if (/REJECT_CARD_PAYMENT|EXCEED/i.test(code)) return "limit";
  if (/INVALID_CARD_NUMBER|INVALID_CARD_EXPIRATION|INVALID_CARD_IDENTITY|INVALID_PASSWORD/i.test(code)) return "details";
  if (/REJECT|INVALID_CARD|INVALID_STOPPED|RESTRICTED|LOST|FDS/i.test(code)) return "declined";
  return "generic";
}

/**
 * Failures that are neither the payer's choice nor their card: the payment window itself did not work (the provider
 * stopped payments for the merchant, as with its numeric code 2003, the currency is not supported, or the code is one
 * we do not know). Retrying will not help the payer, so admissions is told.
 */
export function failureNeedsReport(code: string): boolean {
  const reason = paymentFailReason(code);
  return Boolean(code) && (reason === "generic" || reason === "currency");
}
