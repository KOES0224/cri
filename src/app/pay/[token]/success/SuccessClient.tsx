"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { confirmPaymentLink, type PaymentLinkResult } from "@/app/actions/paymentLinks";
import { formatWon } from "@/lib/payment-links";

function Content({ token }: { token: string }) {
  const params = useSearchParams();
  const started = useRef(false);
  const [result, setResult] = useState<PaymentLinkResult | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const paymentKey = params.get("paymentKey"), orderId = params.get("orderId"), amount = Number(params.get("amount"));
    if (!paymentKey || !orderId || !amount) { void Promise.resolve().then(() => setResult({ ok: false, error: "결제 정보가 없습니다. 결제 링크를 다시 열어 확인해 주세요.", retry: false })); return; }
    // The provider's payment key leaves the address bar before anything else reads the URL.
    try { const clean = new URL(window.location.href); for (const k of ["paymentKey", "amount", "paymentType"]) clean.searchParams.delete(k); window.history.replaceState(null, "", clean.toString()); } catch {}
    confirmPaymentLink({ token, paymentKey, orderId, amount })
      .then(setResult)
      .catch(() => setResult({ ok: false, error: "결제를 확인하지 못했습니다. 다시 결제하지 마시고 잠시 후 결제 링크를 다시 열어 확인해 주세요.", retry: false }));
  }, [params, token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 pb-20 pt-32">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        {!result ? (
          <><Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" /><h1 className="mt-4 text-xl font-black">결제를 확인하고 있습니다</h1><p className="mt-2 text-sm text-slate-500">창을 닫지 말고 잠시 기다려 주세요.</p></>
        ) : !result.ok ? (
          <><AlertCircle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-4 text-xl font-black">결제가 완료되지 않았습니다</h1><p className="mt-2 text-sm text-slate-600">{result.error}</p></>
        ) : (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <h1 className="mt-4 text-2xl font-black">결제가 완료되었습니다</h1>
            <dl className="mt-6 space-y-2 rounded-xl bg-slate-50 p-4 text-left text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">학생</dt><dd className="font-semibold">{result.studentName}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">결제 금액</dt><dd className="font-semibold tabular-nums">{formatWon(result.amount)}</dd></div>
              {result.method && <div className="flex justify-between gap-4"><dt className="text-slate-500">결제 수단</dt><dd>{result.method}</dd></div>}
              {result.paidAt && <div className="flex justify-between gap-4"><dt className="text-slate-500">승인 시각</dt><dd>{new Date(result.paidAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}</dd></div>}
              <div className="flex justify-between gap-4"><dt className="text-slate-500">주문번호</dt><dd className="break-all font-mono text-xs text-slate-800">{result.orderId}</dd></div>
            </dl>
            {result.receiptUrl && <a href={result.receiptUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-blue-700 underline">영수증 보기</a>}
          </>
        )}
        {result && (
          <div className="mt-8 flex flex-col gap-2">
            {(!result.ok && result.retry) && <Link href={`/pay/${token}`} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">다시 시도하기</Link>}
            {(!result.ok && !result.retry) && <Link href={`/pay/${token}`} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">결제 링크로 돌아가기</Link>}
            <Link href="/contact" className="text-sm text-slate-600 underline">문의하기</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SuccessClient({ token }: { token: string }) {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}><Content token={token} /></Suspense>;
}
