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
  const secretKey = process.env.TOSS_SECRET_KEY || "test_sk_Z1aOwRO7hkNOa42Nl4e8y3yAqnz2";

  if (!secretKey) {
    return {
      success: false,
      error: "TOSS_SECRET_KEY is not configured on the server.",
    };
  }

  try {
    const basicToken = Buffer.from(`${secretKey}:`).toString("base64");

    const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicToken}`,
        "Content-Type": "application/json",
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
      console.error("Toss Payments confirm error response:", data);
      return {
        success: false,
        error: data.message || `Payment confirmation failed (code: ${data.code || response.status})`,
      };
    }

    if (data.status !== "DONE") {
      return {
        success: false,
        error: `Payment status is not DONE (current: ${data.status})`,
      };
    }

    // Verify amount to prevent frontend tampering
    if (Number(data.totalAmount) !== Number(amount)) {
      return {
        success: false,
        error: `Amount mismatch: expected ${amount}, received ${data.totalAmount}`,
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
        currency: data.currency || "USD",
        method: data.method,
        card: data.card,
        receiptUrl: data.receipt?.url,
        requestedAt: data.requestedAt,
        approvedAt: data.approvedAt,
      },
    };
  } catch (err: any) {
    console.error("Failed to connect to Toss Payments confirm API:", err);
    return {
      success: false,
      error: err.message || "Network error while verifying payment with Toss Payments.",
    };
  }
}
