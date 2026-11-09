"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PG_REVIEW_PRODUCTS, REVIEW_ORDER_PREFIX, type ReviewProductKey } from "@/lib/pg-review-products";
import { COUNTRY_CODES, countryName } from "@/lib/countries";

type Widgets = Awaited<ReturnType<Awaited<ReturnType<typeof import("@tosspayments/tosspayments-sdk")["loadTossPayments"]>>["widgets"]>>;
type Methods = Awaited<ReturnType<Widgets["renderPaymentMethods"]>>;

/**
 * Toss payment widget for a sample product (won or US dollars); the success page confirms the charge server-side.
 * The US-dollar one also offers PayPal when the merchant id has it, which needs the buyer's country.
 */
export default function ReviewProduct({ viewer, paymentAvailable, variantKey, agreementVariantKey = "AGREEMENT", product = "krw" }: { viewer: { id: string; email: string | null; name: string | null }; paymentAvailable: boolean; variantKey: string; agreementVariantKey?: string; product?: ReviewProductKey }) {
  const item = PG_REVIEW_PRODUCTS[product];
  const id = useId();
  const methodsId = `${id}methods`, agreementId = `${id}agreement`, countryId = `${id}country`;
  const widgets = useRef<{ widgets: Widgets; methods: Methods } | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error" | "unavailable">(paymentAvailable ? "loading" : "unavailable");
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [paypal, setPaypal] = useState(false);
  const [country, setCountry] = useState("US");

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!paymentAvailable || !key) return;
    let cancelled = false;
    let methods: Methods | undefined, agreement: { destroy: () => Promise<void> } | undefined;
    (async () => {
      try {
        const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
        const w = (await loadTossPayments(key)).widgets({ customerKey: viewer.id });
        await w.setAmount({ currency: item.currency, value: item.amount });
        if (cancelled) return;
        [methods, agreement] = await Promise.all([
          w.renderPaymentMethods({ selector: `[id="${methodsId}"]`, variantKey }),
          w.renderAgreement({ selector: `[id="${agreementId}"]`, variantKey: agreementVariantKey }),
        ]);
        if (cancelled) { void methods.destroy(); void agreement.destroy(); return; }
        widgets.current = { widgets: w, methods };
        methods.on("paymentMethodSelect", (selected) => setPaypal(selected?.code === "PAYPAL"));
        void methods.getSelectedPaymentMethod().then((selected) => { if (!cancelled) setPaypal(selected?.code === "PAYPAL"); }).catch(() => {});
        setState("ready");
      } catch (error) {
        // Shown as is: on this test page the SDK's own code and text are the diagnosis.
        const code = (error as { code?: string } | null)?.code;
        console.error("Toss widget failed", error instanceof Error ? error.message : error);
        if (!cancelled) { setFailure([code, error instanceof Error ? error.message : ""].filter(Boolean).join(" · ")); setState("error"); }
      }
    })();
    return () => { cancelled = true; widgets.current = null; try { void methods?.destroy(); void agreement?.destroy(); } catch {} };
  }, [paymentAvailable, viewer.id, methodsId, agreementId, variantKey, agreementVariantKey, item.currency, item.amount]);

  async function pay() {
    const current = widgets.current;
    if (!current || busy) return;
    setBusy(true); setNotice("");
    try {
      const orderId = `${REVIEW_ORDER_PREFIX[product]}${crypto.randomUUID()}`;
      const selected = await current.methods.getSelectedPaymentMethod().catch(() => null);
      await current.widgets.requestPayment({
        orderId, orderName: item.orderName,
        successUrl: `${window.location.origin}/pg-review/success?product=${product}`, failUrl: `${window.location.origin}/pg-review/fail?product=${product}`,
        customerEmail: viewer.email || undefined, customerName: viewer.name || undefined,
        // PayPal needs the buyer's country and the order contents; cards do not.
        ...(selected?.code === "PAYPAL" ? { foreignEasyPay: { country, products: [{ name: item.orderName, quantity: 1, unitAmount: item.amount, currency: item.currency, description: "CRI application review fee (test)" }] } } : {}),
      });
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      setNotice([code, error instanceof Error && error.message ? error.message : "결제창을 열지 못했습니다."].filter(Boolean).join(" · "));
    } finally { setBusy(false); }
  }

  return (
    <div className="mt-6">
      {state === "unavailable" && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">온라인 결제가 아직 설정되지 않았습니다. 토스페이먼츠 결제위젯 키를 등록한 뒤 다시 확인해 주세요.</p>}
      {state === "loading" && <p role="status" className="py-6 text-center text-sm text-slate-500">결제 수단을 불러오는 중…</p>}
      {state === "error" && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">결제 수단을 불러오지 못했습니다. 페이지를 새로고침해 주세요.{failure && <span className="mt-1 block break-words font-mono text-xs">{failure}</span>}</p>}
      <div id={methodsId} />
      <div id={agreementId} />
      {product === "usd" && paypal && (
        <div className="mt-3">
          <label htmlFor={countryId} className="mb-1 block text-xs font-semibold text-slate-600">PayPal 결제자 거주 국가</label>
          <select id={countryId} value={country} onChange={(event) => setCountry(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900">
            {COUNTRY_CODES.map((code) => <option key={code} value={code}>{countryName(code, "ko")}</option>)}
          </select>
        </div>
      )}
      {notice && <p role="alert" className="mt-3 break-words rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{notice}</p>}
      <button type="button" onClick={() => void pay()} disabled={state !== "ready" || busy} className="mt-4 w-full rounded-xl bg-blue-700 px-5 py-4 text-base font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? "결제창 여는 중…" : product === "usd" && paypal ? "PayPal로 계속하기" : `${item.label} 결제하기`}
      </button>
    </div>
  );
}
