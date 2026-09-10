/**
 * Toss Payments Server-Side Verification Utility
 */

export interface TossPaymentConfirmResult {
  success: boolean;
  error?: string;
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
  amount: number
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
        "Idempotency-Key": orderId,
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Toss Payments confirmation failed", response.status);
      return {
        success: false,
        error: "Payment could not be confirmed. Contact support if your account shows a charge.",
      };
    }

    if (data.status !== "DONE") {
      return {
        success: false,
        error: "The payment has not completed. Check your payment provider before retrying.",
      };
    }

    // Verify amount to prevent frontend tampering
    if (Number(data.totalAmount) !== Number(amount) || data.currency !== "KRW" || data.orderId !== orderId) {
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
    return {
      success: false,
      error: "Payment verification is unavailable. If a charge appears, contact support before trying again.",
    };
  }
}

/** Read-only reconciliation: recovers a confirmed charge after a database/network failure. */
export async function findConfirmedTossPayment(orderId: string, amount: number): Promise<TossPaymentConfirmResult> {
  if (!process.env.TOSS_SECRET_KEY) return { success: false };
  try {
    const response = await fetch(`https://api.tosspayments.com/v1/payments/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64')}` },
      cache: 'no-store', signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return { success: false };
    const data = await response.json();
    if (data.status !== 'DONE' || data.orderId !== orderId || data.totalAmount !== amount || data.currency !== 'KRW') return { success: false };
    return {success: true, paymentData: {...data, receiptUrl: data.receipt?.url}};
  } catch { return {success: false}; }
}
