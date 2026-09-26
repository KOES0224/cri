"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { finalizePaidApplication } from "@/app/actions/payment";
import { CheckCircle2, Loader2, AlertCircle, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import { APPLICATION_CHARGE_LABEL } from "@/lib/application-fee";
import { useT } from "@/i18n/client";
import { metaTrack } from "@/lib/meta/pixel";

function PaymentSuccessContent() {
  const { t } = useT();
  const copy = t.payment.success;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    applicationId?: string;
    receiptUrl?: string;
  } | null>(null);

  useEffect(() => {
    // The action names its reason in `code` (a t.apply.errors key); the English `error` text is the fallback.
    const actionText = (res: { error?: string; code?: string }) => {
      const localized = res.code ? (t.apply.errors as Record<string, unknown>)[res.code] : undefined;
      return typeof localized === "string" ? localized : res.error || copy.verifyFailed;
    };
    async function processPayment() {
      const paymentKey = searchParams.get("paymentKey");
      const orderId = searchParams.get("orderId");
      const amountStr = searchParams.get("amount");
      const programId = searchParams.get("programId");

      if (!paymentKey || !orderId || !amountStr) {
        setError(copy.missingDetails);
        setLoading(false);
        return;
      }

      try {
      // The order id doubles as the Meta event id: reloads of this page and the server copy all deduplicate to one Purchase.
      const res = await finalizePaidApplication({
        paymentKey,
        orderId,
        amount: Number(amountStr),
        eventId: orderId,
      });

      if (res.error) {
        setError(actionText(res));
        setLoading(false);
      } else {
        setResult({
          applicationId: res.applicationId,
          receiptUrl: res.receiptUrl,
        });
        trackEvent("application_submitted", { program_id: programId || undefined, order_id: orderId, value: Number(amountStr), currency: "KRW" });
        if (res.tracking) metaTrack("Purchase", res.tracking, orderId);
        setLoading(false);
        // Clean up draft storage
        try {
          sessionStorage.removeItem("cri_apply_draft");
          localStorage.removeItem("cri_apply_draft");
        } catch {}


      }
      } catch { setError(copy.verifyFailed); setLoading(false); }
    }

    processPayment();
  }, [searchParams, router, t, copy]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-20 px-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-gray-100 text-center">
        {loading ? (
          <div className="py-12 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">{copy.verifyingTitle}</h2>
            <p className="text-sm text-gray-500 max-w-xs">{copy.verifyingBody}</p>
          </div>
        ) : error ? (
          <div className="py-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">{copy.noticeTitle}</h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{error}</p>
            <div className="flex flex-col gap-3 w-full">
              <Link
                href="/dashboard/applications"
                className="w-full h-12 bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center hover:bg-black transition-colors"
              >
                {copy.applicantDashboard}
              </Link>
              <Link
                href="/contact"
                className="w-full h-12 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                {copy.contactSupport}
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20 ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">{copy.paidTitle}</h2>
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-6">{copy.paidBody(APPLICATION_CHARGE_LABEL)}</p>

            <div className="w-full bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">{copy.orderId}</span>
                <span className="font-mono font-bold text-gray-800">{searchParams.get("orderId")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">{copy.method}</span>
                <span className="font-bold text-gray-800">{copy.methodValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">{copy.status}</span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{copy.statusValue(APPLICATION_CHARGE_LABEL)}</span>
              </div>
            </div>

            {result?.receiptUrl && (
              <a
                href={result.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 mb-6"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                {copy.receipt}
              </a>
            )}

            <Link
              href="/dashboard/applications"
              className="w-full h-14 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center hover:bg-black transition-all shadow-lg hover:shadow-xl"
            >
              {copy.dashboard} <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <p className="text-[11px] text-gray-400 mt-3">{copy.savedNote}</p>
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
