"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { finalizePaidApplication, settleReturnedOrder } from "@/app/actions/payment";
import { CheckCircle2, Loader2, AlertCircle, ExternalLink, ArrowRight, RotateCcw, Printer } from "lucide-react";
import Link from "@/i18n/link";
import { trackEvent } from "@/lib/analytics";
import { APPLICATION_CHARGE } from "@/lib/application-fee";
import { COMPANY } from "@/lib/company";
import { useT } from "@/i18n/client";
import { metaTrack } from "@/lib/meta/pixel";
import type { PaymentReceipt as Receipt } from "@/lib/payment-result";


/** "$50.00 USD": the amount with cents and an explicit currency code, the way a US receipt prints it. */
function money(amount: number, currency: string) {
  try { return `${new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)} ${currency}`; }
  catch { return `${amount} ${currency}`; }
}

function PaymentSuccessContent() {
  const { t, locale } = useT();
  const copy = t.payment.success;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // A refusal that released the order: the applicant can go straight back and pay with another card.
  const [declined, setDeclined] = useState(false);
  // The return landed in a browser that is not signed in: sign in, then this page finishes the confirmation.
  const [signIn, setSignIn] = useState(false);
  // The provider has not settled the payment yet; the page keeps checking by itself.
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ applicationId?: string; receiptUrl?: string; receipt?: Receipt } | null>(null);
  const started = useRef(false);
  // Kept from the first render: the query string is trimmed right after the payment reference is taken from it.
  const [orderId] = useState(() => searchParams.get("orderId"));
  const [programId] = useState(() => searchParams.get("programId"));

  useEffect(() => {
    // Runs once: the payment reference is read from the URL, then removed from the address bar so analytics and
    // the browser history never carry it. The router syncs searchParams after replaceState, which re-runs this effect.
    if (started.current) return;
    started.current = true;
    // The action names its reason in `code` (a t.apply.errors key); the English `error` text is the fallback.
    const actionText = (res: { error?: string; code?: string }) => {
      const localized = res.code ? (t.apply.errors as Record<string, unknown>)[res.code] : undefined;
      return typeof localized === "string" ? localized : res.error || copy.verifyFailed;
    };
    // The reference survives one trip to the sign-in page in this tab (a 3-D Secure or PayPal return can land in a
    // browser that lost the session); it never leaves the browser and is dropped as soon as the payment is settled.
    const storeKey = orderId ? `cri_pay_${orderId}` : "";
    const remember = (value: string | null) => { try { if (!storeKey) return; if (value) sessionStorage.setItem(storeKey, value); else sessionStorage.removeItem(storeKey); } catch {} };
    const remembered = () => { try { return storeKey ? JSON.parse(sessionStorage.getItem(storeKey) || "null") as { paymentKey?: string; amount?: number } | null : null; } catch { return null; } };

    async function processPayment() {
      if (!orderId) { setError(copy.missingDetails); setLoading(false); return; }
      const urlKey = searchParams.get("paymentKey"), urlAmount = Number(searchParams.get("amount"));
      if (urlKey && Number.isFinite(urlAmount)) remember(JSON.stringify({ paymentKey: urlKey, amount: urlAmount }));
      const saved = remembered();
      const paymentKey = urlKey || saved?.paymentKey || null;
      const amount = urlKey ? urlAmount : Number(saved?.amount);
      try {
        const clean = new URL(window.location.href);
        for (const key of ["paymentKey", "amount", "paymentType"]) clean.searchParams.delete(key);
        // A plain state object: Next treats its own history state as internal and would not sync useSearchParams.
        window.history.replaceState(null, "", clean.toString());
      } catch {}

      // Shows the outcome. Returns false while the payment is still settling at the provider, so the caller looks again.
      const show = (res: Awaited<ReturnType<typeof finalizePaidApplication>>): boolean => {
        if (!res.success) {
          if (res.code === "checkoutSignIn") { setSignIn(true); setLoading(false); return true; }
          if (res.code === "paymentPending" || res.code === "paymentUnconfirmed") return false;
          // Keep the reference only while the outcome is still open; a settled refusal or mismatch ends this attempt.
          if (res.code !== "finalizeFailed") remember(null);
          const reason = res.providerReason ? ` (Toss: ${res.providerReason})` : "";
          setDeclined(["paymentDeclined", "paymentNotStarted", "paymentSuperseded"].includes(res.code));
          setError((res.code === "paymentNotStarted" ? copy.missingDetails : actionText(res)) + reason);
          setLoading(false);
          return true;
        }
        remember(null);
        setResult({ applicationId: res.applicationId, receiptUrl: res.receiptUrl, receipt: res.receipt });
        // Counted once: only the call that recorded the application reports the conversion, and never for the
        // payment-review account, which is not a prospect.
        if (res.created && !res.review) {
          trackEvent("application_submitted", { program_id: programId || undefined, program_title: res.programTitle, order_id: orderId, transaction_id: orderId, value: res.receipt?.amount ?? APPLICATION_CHARGE.amount, currency: APPLICATION_CHARGE.currency });
          // The order id is the event id on both sides: the server copy and this one deduplicate to one Purchase.
          if (res.tracking && res.eventId) metaTrack("Purchase", res.tracking, res.eventId);
          if (res.submit?.tracking) metaTrack("SubmitApplication", res.submit.tracking, res.submit.eventId);
        }
        setLoading(false);
        // Clean up draft storage
        try {
          sessionStorage.removeItem("cri_apply_draft");
          localStorage.removeItem("cri_apply_draft");
        } catch {}
        return true;
      };
      try {
        // Without a reference (a reload, or a later visit) the order itself is looked up: a finished order shows its
        // receipt again and an unsettled one is settled from the provider's record. Nothing is charged twice.
        let res = paymentKey && Number.isFinite(amount) ? await finalizePaidApplication({ paymentKey, orderId, amount }) : await settleReturnedOrder(orderId);
        // An approval that is still in progress usually lands within seconds: look again a few times before asking
        // the payer to wait, and never ask them to pay again meanwhile.
        for (const delay of [3000, 6000, 12000, 24000]) {
          if (show(res)) return;
          setPending(true);
          await new Promise((resolve) => setTimeout(resolve, delay));
          res = await settleReturnedOrder(orderId);
        }
        if (show(res)) return;
        setError(copy.stillPending);
        setLoading(false);
      } catch { setError(copy.verifyFailed); setLoading(false); }
    }

    processPayment();
  }, [searchParams, router, t, copy, orderId, programId]);

  const receipt = result?.receipt;
  // Toss names the method in Korean ("카드", "해외간편결제"); the receipt shows it in the visitor's language.
  const method = !receipt?.method ? null : /카드|card/i.test(receipt.method) ? copy.methods.card : /간편|paypal/i.test(receipt.method) ? copy.methods.paypal : copy.methods.other;
  const paidOn = receipt?.approvedAt ? new Date(receipt.approvedAt) : null;
  const rows: Array<[string, string]> = [
    [copy.item, copy.itemValue],
    [copy.amount, receipt ? money(receipt.amount, receipt.currency) : money(APPLICATION_CHARGE.amount, APPLICATION_CHARGE.currency)],
    ...(paidOn && !Number.isNaN(paidOn.getTime()) ? [[copy.date, paidOn.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "long", day: "numeric" })] as [string, string]] : []),
    ...(method ? [[copy.method, method] as [string, string]] : []),
    ...(orderId ? [[copy.orderId, orderId] as [string, string]] : []),
    [copy.billedBy, `${COMPANY.legalName} (${COMPANY.brand})`],
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-20 px-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-[2rem] p-8 md:p-10 shadow-xl border border-gray-100">
        {loading ? (
          <div role="status" className="py-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">{pending ? copy.pendingTitle : copy.verifyingTitle}</h1>
            <p className="text-sm text-gray-500 max-w-xs">{pending ? copy.pendingBody : copy.verifyingBody}</p>
          </div>
        ) : signIn ? (
          <div role="alert" className="py-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">{copy.signInTitle}</h1>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{copy.signInBody}</p>
            <Link href={`/auth/login?callbackUrl=${encodeURIComponent(`/apply/payment-success?orderId=${encodeURIComponent(orderId || "")}${programId ? `&programId=${encodeURIComponent(programId)}` : ""}`)}`} className="w-full h-12 bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center hover:bg-black transition-colors">
              {copy.signIn}
            </Link>
          </div>
        ) : error ? (
          <div role="alert" className="py-8 flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${declined ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>
              <AlertCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">{declined ? copy.declinedTitle : copy.noticeTitle}</h1>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{error}</p>
            <div className="flex flex-col gap-3 w-full">
              {declined && programId ? (
                <Link href={`/apply?programId=${encodeURIComponent(programId)}`} className="w-full h-12 bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center hover:bg-black transition-colors">
                  <RotateCcw className="w-4 h-4 mr-2" />{copy.tryAgain}
                </Link>
              ) : pending ? (
                <button type="button" onClick={() => window.location.reload()} className="w-full h-12 bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center hover:bg-black transition-colors">
                  <RotateCcw className="w-4 h-4 mr-2" />{copy.checkAgain}
                </button>
              ) : (
                <Link href="/dashboard/applications" className="w-full h-12 bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center hover:bg-black transition-colors">
                  {copy.applicantDashboard}
                </Link>
              )}
              <Link href="/contact" className="w-full h-12 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm flex items-center justify-center hover:bg-gray-200 transition-colors">
                {copy.contactSupport}
              </Link>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 ring-8 ring-emerald-50/50">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">{copy.paidTitle}</h1>
              <p className="text-gray-600 text-sm leading-relaxed">{copy.paidBody}</p>
            </div>

            <section aria-label={copy.receiptTitle} className="mt-7 rounded-2xl border border-gray-200">
              <h2 className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{copy.receiptTitle}</h2>
              <dl className="divide-y divide-gray-100 px-4 text-sm">
                {rows.map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 py-2.5">
                    <dt className="shrink-0 text-gray-500">{label}</dt>
                    <dd className="min-w-0 break-all text-right font-semibold text-gray-900 tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            {receipt?.email && <p className="mt-3 text-xs leading-relaxed text-gray-500">{copy.emailed(receipt.email)}</p>}
            {result?.receiptUrl && (
              <p className="mt-2 text-xs leading-relaxed text-gray-500">
                <a href={result.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center font-semibold text-blue-700 hover:text-blue-900">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />{copy.receipt}
                </a>
                <span className="ml-2">{copy.receiptHint}</span>
              </p>
            )}

            <section className="mt-7">
              <h2 className="text-sm font-bold text-gray-900">{copy.nextTitle}</h2>
              <ol className="mt-3 space-y-2 text-sm text-gray-600">
                {copy.next.map((line, index) => (
                  <li key={line} className="flex gap-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white">{index + 1}</span><span>{line}</span></li>
                ))}
              </ol>
            </section>

            <Link href="/dashboard/applications" className="mt-7 w-full h-14 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center hover:bg-black transition-all shadow-lg hover:shadow-xl print:hidden">
              {copy.dashboard} <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <button type="button" onClick={() => window.print()} className="mt-3 w-full h-12 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center justify-center print:hidden">
              <Printer className="w-4 h-4 mr-2" />{copy.print}
            </button>
            <p className="mt-4 text-center text-xs leading-relaxed text-gray-500">{copy.support}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
