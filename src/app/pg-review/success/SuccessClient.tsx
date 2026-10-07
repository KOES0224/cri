"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { confirmReviewPayment } from "@/app/actions/pgReview";

function Content() {
  const params = useSearchParams();
  const started = useRef(false);
  const [state, setState] = useState<{ loading: boolean; error?: string; result?: { orderId: string; amount: number; currency: string; method: string; approvedAt?: string; receiptUrl?: string } }>({ loading: true });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const paymentKey = params.get("paymentKey"), orderId = params.get("orderId"), amount = Number(params.get("amount"));
    if (!paymentKey || !orderId || !amount) { void Promise.resolve().then(() => setState({ loading: false, error: "결제 정보가 없습니다." })); return; }
    // The provider's payment key leaves the address bar before anything else reads the URL.
    try { const clean = new URL(window.location.href); for (const k of ["paymentKey", "amount", "paymentType"]) clean.searchParams.delete(k); window.history.replaceState(null, "", clean.toString()); } catch {}
    confirmReviewPayment({ paymentKey, orderId, amount })
      .then((res) => setState("error" in res && res.error ? { loading: false, error: res.error } : { loading: false, result: res as never }))
      .catch(() => setState({ loading: false, error: "결제를 확인하지 못했습니다." }));
  }, [params]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 pb-20 pt-32">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        {state.loading ? (
          <><Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" /><h1 className="mt-4 text-xl font-black">결제를 확인하고 있습니다</h1></>
        ) : state.error ? (
          <><AlertCircle className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-4 text-xl font-black">결제를 확인하지 못했습니다</h1><p className="mt-2 text-sm text-slate-600">{state.error}</p></>
        ) : (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <h1 className="mt-4 text-2xl font-black">결제가 완료되었습니다</h1>
            <dl className="mt-6 space-y-2 rounded-xl bg-slate-50 p-4 text-left text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">주문번호</dt><dd className="break-all font-mono text-xs text-slate-800">{state.result!.orderId}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">결제 금액</dt><dd className="font-semibold">{state.result!.amount.toLocaleString()} {state.result!.currency}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">결제 수단</dt><dd className="font-semibold">{state.result!.method}</dd></div>
              {state.result!.approvedAt && <div className="flex justify-between"><dt className="text-slate-500">승인 시각</dt><dd>{new Date(state.result!.approvedAt).toLocaleString("ko-KR")}</dd></div>}
            </dl>
            {state.result!.receiptUrl && <a href={state.result!.receiptUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-blue-700 underline">영수증 보기</a>}
          </>
        )}
        <div className="mt-8 flex flex-col gap-2">
          <Link href="/pg-review" className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">상품 페이지로</Link>
          <Link href="/refunds" className="text-sm text-slate-600 underline">취소 및 환불 규정</Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessClient() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}><Content /></Suspense>;
}
