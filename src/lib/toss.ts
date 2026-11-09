/**
 * Toss Payments Server-Side Verification Utility. Charges are in the application-fee currency (USD); anything else is rejected.
 */
import { APPLICATION_CHARGE } from "./application-fee";

export interface TossPaymentConfirmResult {
  success: boolean;
  error?: string;
  /** Toss's own error code and message when it rejected the confirmation (e.g. INVALID_API_KEY). Not secret; for logs and the review account. */
  providerCode?: string;
  providerMessage?: string;
  paymentData?: {
    paymentKey: string;
    orderId: string;
    orderName: string;
    status: string;
    totalAmount: number;
    currency: string;
    method: string;
    card?: {
      issuerCode?: string;
      acquirerCode?: string;
      number?: string;
      installmentPlanMonths?: number;
      approveNo?: string;
      cardType?: string;
      ownerType?: string;
    };
    receiptUrl?: string;
    requestedAt?: string;
    approvedAt?: string;
  };
}

export async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number,
  currency: string = APPLICATION_CHARGE.currency,
  options: { recoveryDelayMs?: number } = {}
): Promise<TossPaymentConfirmResult> {
  const secretKey = process.env.TOSS_SECRET_KEY;

  if (!secretKey) {
    return {
      success: false,
      error: "Online payment is unavailable. Contact admissions before paying.",
    };
  }

  try {
    const basicToken = Buffer.from(`${secretKey}:`).toString("base64");

    const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicToken}`,
        "Content-Type": "application/json",
        // One key per payment attempt: the application order id is reused when a visitor pays again after a failed
        // attempt, and a key shared across attempts would make Toss replay the first attempt's answer.
        "Idempotency-Key": paymentKey.slice(0, 300),
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
      signal: AbortSignal.timeout(30000), // card networks, overseas ones especially, can take well over 10s to answer
    });

    const data = await response.json();

    if (!response.ok) {
      // Toss's code and message say why (wrong key set, card declined, terminal not registered…); neither is secret.
      const providerCode = typeof data?.code === "string" ? data.code.slice(0, 80) : undefined;
      const providerMessage = typeof data?.message === "string" ? data.message.slice(0, 300) : undefined;
      console.error("Toss Payments confirmation failed", response.status, providerCode, providerMessage);
      return {
        success: false,
        error: "Payment could not be confirmed. Contact support if your account shows a charge.",
        providerCode,
        providerMessage,
      };
    }

    if (data.status !== "DONE") {
      console.error("Toss Payments confirmation returned a non-final status", data.status);
      return {
        success: false,
        error: "The payment has not completed. Check your payment provider before retrying.",
        providerCode: typeof data.status === "string" ? `STATUS_${data.status}` : undefined,
      };
    }

    // Verify amount to prevent frontend tampering
    if (Number(data.totalAmount) !== Number(amount) || data.currency !== currency || data.orderId !== orderId) {
      return {
        success: false,
        error: "Payment details could not be verified. Contact support with your order reference.",
      };
    }

    return {
      success: true,
      paymentData: {
        paymentKey: data.paymentKey,
        orderId: data.orderId,
        orderName: data.orderName,
        status: data.status,
        totalAmount: data.totalAmount,
        currency: data.currency,
        method: data.method,
        card: data.card,
        receiptUrl: data.receipt?.url,
        requestedAt: data.requestedAt,
        approvedAt: data.approvedAt,
      },
    };
  } catch {
    console.error("Payment provider confirmation unavailable.");
    // The approval may still complete at the provider after our request gave up. Ask about this payment a few times
    // before telling the payer it failed, so a charge that went through is recorded instead of reported as an error.
    const delay = options.recoveryDelayMs ?? 3000;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
      const recovered = await findConfirmedTossPayment(paymentKey, orderId, amount, currency);
      if (recovered.success) return recovered;
    }
    return {
      success: false,
      error: "Payment verification is unavailable. If a charge appears, contact support before trying again.",
    };
  }
}

/**
 * Where a payment stands at the provider, by its key: `paid` (approved for exactly this order, amount and currency),
 * `dead` (ended without a standing charge: refused, expired or fully cancelled), `open` (authenticated or in progress,
 * not settled yet), `unknown` (partially cancelled, mismatched, or the provider could not be asked). A failed lookup is
 * never `dead`. Read-only; allowed for payment-widget secret keys.
 */
export async function tossPaymentState(paymentKey: string, orderId: string, amount: number, currency: string = APPLICATION_CHARGE.currency): Promise<"paid" | "dead" | "open" | "unknown"> {
  if (!process.env.TOSS_SECRET_KEY) return "unknown";
  try {
    const response = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString("base64")}` },
      cache: "no-store", signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return "unknown";
    const data = await response.json();
    if (data?.orderId !== orderId) return "unknown";
    if (data.status === "DONE") return Number(data.totalAmount) === Number(amount) && data.currency === currency ? "paid" : "unknown";
    if (["ABORTED", "EXPIRED", "CANCELED"].includes(data.status)) return "dead";
    if (["READY", "IN_PROGRESS", "WAITING_FOR_DEPOSIT"].includes(data.status)) return "open";
    return "unknown";
  } catch { return "unknown"; }
}

/**
 * Read-only reconciliation: finds an already-approved charge for this payment key (after a timeout, a database failure
 * or a repeated request). Looks the payment up by its key, which the payment-widget secret key is allowed to do; the
 * order-id lookup is reserved for the per-merchant-id keys and does not work here.
 */
export async function findConfirmedTossPayment(paymentKey: string, orderId: string, amount: number, currency: string = APPLICATION_CHARGE.currency): Promise<TossPaymentConfirmResult> {
  if (!process.env.TOSS_SECRET_KEY) return { success: false };
  try {
    const response = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64')}` },
      cache: 'no-store', signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return { success: false };
    const data = await response.json();
    if (data.status !== 'DONE' || data.orderId !== orderId || Number(data.totalAmount) !== Number(amount) || data.currency !== currency) return { success: false };
    return {success: true, paymentData: {...data, receiptUrl: data.receipt?.url}};
  } catch { return {success: false}; }
}
