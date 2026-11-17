import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { validPaymentLinkToken } from "@/lib/payment-links";
import SuccessClient from "./SuccessClient";

export const dynamic = "force-dynamic";
/** The confirm call may wait up to 30 seconds for a card network, then look the payment up again. */
export const maxDuration = 90;
export const metadata: Metadata = { title: "결제 확인 | CRI", robots: { index: false, follow: false } };

export default async function PaymentLinkSuccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!validPaymentLinkToken(token)) notFound();
  return <SuccessClient token={token} />;
}
