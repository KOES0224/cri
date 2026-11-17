"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatWon, newPaymentLinkOrderId } from "@/lib/payment-links";

type Widgets = Awaited<ReturnType<Awaited<ReturnType<typeof import("@tosspayments/tosspayments-sdk")["loadTossPayments"]>>["widgets"]>>;
type Methods = Awaited<ReturnType<Widgets["renderPaymentMethods"]>>;

/** Toss payment widget for a payment link, in won, for a payer without an account. The success page confirms the charge. */
export default function PayClient({ token, amount, orderName, paymentAvailable, variantKey }: { token: string; amount: number; orderName: string; paymentAvailable: boolean; variantKey: string }) {
  const id = useId();
  const methodsId = `${id}methods`, agreementId = `${id}agreement`;
  const widgets = useRef<{ widgets: Widgets; methods: Methods } | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error" | "unavailable">(paymentAvailable ? "loading" : "unavailable");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!paymentAvailable || !key) return;
    let cancelled = false;
    let methods: Methods | undefined, agreement: { destroy: () => Promise<void> } | undefined;
    (async () => {
      try {
        const { loadTossPayments, ANONYMOUS } = await import("@tosspayments/tosspayments-sdk");
        const w = (await loadTossPayments(key)).widgets({ customerKey: ANONYMOUS });
        await w.setAmount({ currency: "KRW", value: amount });
        if (cancelled) return;
        [methods, agreement] = await Promise.all([
          w.renderPaymentMethods({ selector: `[id="${methodsId}"]`, variantKey }),
          w.renderAgreement({ selector: `[id="${agreementId}"]`, variantKey: "AGREEMENT" }),
        ]);
        if (cancelled) { void methods.destroy(); void agreement.destroy(); return; }
        widgets.current = { widgets: w, methods };
        setState("ready");
      } catch (error) {
        console.error("Toss widget failed", error instanceof Error ? error.message : error);
        if (!cancelled) setState("error");
      }
    })();
    return () => { cancelled = true; widgets.current = null; try { void methods?.destroy(); void agreement?.destroy(); } catch {} };
  }, [paymentAvailable, methodsId, agreementId, variantKey, amount]);

  async function pay() {
    const current = widgets.current;
    if (!current || busy) return;
    setBusy(true); setNotice("");
    try {
      const selected = await current.methods.getSelectedPaymentMethod().catch(() => null);
      // A virtual account is paid later by bank transfer, which this page cannot follow up on.
      if (selected?.code === "VIRTUAL_ACCOUNT" || selected?.code === "가상계좌") { setNotice("가상계좌는 이 링크에서 사용할 수 없습니다. 카드나 다른 결제 수단을 선택해 주세요."); return; }
      await current.widgets.requestPayment({
        orderId: newPaymentLinkOrderId(), orderName,
        successUrl: `${window.location.origin}/pay/${token}/success`,
        failUrl: `${window.location.origin}/pay/${token}/fail`,
      });
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      // Closing the window is not an error worth a red box.
      if (code !== "USER_CANCEL") setNotice(error instanceof Error && error.message ? error.message : "결제창을 열지 못했습니다. 다시 시도해 주세요.");
    } finally { setBusy(false); }
  }

  return (
    <div className="mt-6">
      {state === "unavailable" && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">지금은 온라인 결제를 이용할 수 없습니다. 담당자에게 문의해 주세요.</p>}
      {state === "loading" && <p role="status" className="py-6 text-center text-sm text-slate-500">결제 수단을 불러오는 중…</p>}
      {state === "error" && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">결제 수단을 불러오지 못했습니다. 페이지를 새로고침해 주세요.</p>}
      <div id={methodsId} />
      <div id={agreementId} />
      {notice && <p role="alert" className="mt-3 break-words rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{notice}</p>}
      <button type="button" onClick={() => void pay()} disabled={state !== "ready" || busy} className="mt-4 w-full rounded-xl bg-blue-700 px-5 py-4 text-base font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? "결제창 여는 중…" : `${formatWon(amount)} 결제하기`}
      </button>
    </div>
  );
}
