import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { validPaymentLinkToken } from "@/lib/payment-links";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "결제 실패 | CRI", robots: { index: false, follow: false } };

/** Toss sends the payer here when the window was closed or the card was refused before approval: nothing was charged. */
export default async function PaymentLinkFailPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ code?: string; message?: string }> }) {
  const { token } = await params;
  if (!validPaymentLinkToken(token)) notFound();
  const { code, message } = await searchParams;
  const cancelled = code === "PAY_PROCESS_CANCELED" || code === "USER_CANCEL";
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 pb-20 pt-32">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black">{cancelled ? "결제를 취소하셨습니다" : "결제가 완료되지 않았습니다"}</h1>
        <p className="mt-3 text-sm text-slate-600">{cancelled ? "청구된 금액은 없습니다." : `${(message || "결제가 승인되지 않았습니다.").slice(0, 200)} 청구된 금액은 없습니다.`}</p>
        {code && !cancelled && <p className="mt-1 font-mono text-xs text-slate-400">{code.slice(0, 60)}</p>}
        <div className="mt-8 flex flex-col gap-2">
          <Link href={`/pay/${token}`} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">다시 시도하기</Link>
          <Link href="/contact" className="text-sm text-slate-600 underline">문의하기</Link>
        </div>
      </div>
    </div>
  );
}
