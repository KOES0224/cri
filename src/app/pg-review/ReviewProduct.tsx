"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PG_REVIEW_PRODUCT } from "@/lib/pg-review";

type Widgets = Awaited<ReturnType<Awaited<ReturnType<typeof import("@tosspayments/tosspayments-sdk")["loadTossPayments"]>>["widgets"]>>;

/** Toss payment widget in won for the sample product; the success page confirms the charge server-side. */
export default function ReviewProduct({ viewer, paymentAvailable, variantKey }: { viewer: { id: string; email: string | null; name: string | null }; paymentAvailable: boolean; variantKey: string }) {
  const id = useId();
  const methodsId = `${id}methods`, agreementId = `${id}agreement`;
  const widgets = useRef<Widgets | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error" | "unavailable">(paymentAvailable ? "loading" : "unavailable");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!paymentAvailable || !key) return;
    let cancelled = false;
    let methods: { destroy: () => Promise<void> } | undefined, agreement: { destroy: () => Promise<void> } | undefined;
    (async () => {
      try {
        const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
        const w = (await loadTossPayments(key)).widgets({ customerKey: viewer.id });
        await w.setAmount({ currency: PG_REVIEW_PRODUCT.currency, value: PG_REVIEW_PRODUCT.amount });
        if (cancelled) return;
        [methods, agreement] = await Promise.all([
          w.renderPaymentMethods({ selector: `[id="${methodsId}"]`, variantKey }),
          w.renderAgreement({ selector: `[id="${agreementId}"]`, variantKey: "AGREEMENT" }),
        ]);
        if (cancelled) { void methods.destroy(); void agreement.destroy(); return; }
        widgets.current = w;
        setState("ready");
      } catch (error) {
        console.error("Toss widget failed", error instanceof Error ? error.message : error);
        if (!cancelled) setState("error");
      }
    })();
    return () => { cancelled = true; widgets.current = null; try { void methods?.destroy(); void agreement?.destroy(); } catch {} };
  }, [paymentAvailable, viewer.id, methodsId, agreementId, variantKey]);

  async function pay() {
    const w = widgets.current;
    if (!w || busy) return;
    setBusy(true); setNotice("");
    try {
      const orderId = `CRI_REVIEW_${crypto.randomUUID()}`;
      await w.requestPayment({
        orderId, orderName: PG_REVIEW_PRODUCT.orderName,
        successUrl: `${window.location.origin}/pg-review/success`, failUrl: `${window.location.origin}/pg-review/fail`,
        customerEmail: viewer.email || undefined, customerName: viewer.name || undefined,
      });
    } catch (error) {
      setNotice(error instanceof Error && error.message ? error.message : "결제창을 열지 못했습니다.");
    } finally { setBusy(false); }
  }

  return (
    <div className="mt-6">
      {state === "unavailable" && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">온라인 결제가 아직 설정되지 않았습니다. 토스페이먼츠 결제위젯 키를 등록한 뒤 다시 확인해 주세요.</p>}
      {state === "loading" && <p role="status" className="py-6 text-center text-sm text-slate-500">결제 수단을 불러오는 중…</p>}
      {state === "error" && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">결제 수단을 불러오지 못했습니다. 페이지를 새로고침해 주세요.</p>}
      <div id={methodsId} />
      <div id={agreementId} />
      {notice && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{notice}</p>}
      <button type="button" onClick={() => void pay()} disabled={state !== "ready" || busy} className="mt-4 w-full rounded-xl bg-blue-700 px-5 py-4 text-base font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? "결제창 여는 중…" : `${PG_REVIEW_PRODUCT.label} 결제하기`}
      </button>
    </div>
  );
}
