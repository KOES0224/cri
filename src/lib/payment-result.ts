import type { MetaCustomData } from "@/lib/meta/config";

/** What the payer keeps: the fields a receipt needs, as the payment provider reported them. */
export type PaymentReceipt = { amount: number; currency: string; method?: string; approvedAt?: string; email?: string };

/** A paid order that is recorded as an application. `created` is true only on the call that recorded it. */
export type PaidOrderResult = {
  success: true; applicationId: string; receiptUrl?: string; eventId: string; review: boolean; created: boolean; programTitle?: string;
  tracking?: MetaCustomData; submit?: { tracking?: MetaCustomData; eventId: string }; receipt?: PaymentReceipt;
};

/** `code` names a key in t.apply.errors; `providerReason` is only ever set for the payment-review account. */
export type PaymentFailure = { success?: false; error: string; code: string; providerReason?: string };

export type PaymentResult = PaidOrderResult | PaymentFailure;
