"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, RotateCcw, MessageSquare, Loader2 } from "lucide-react";
import Link from "@/i18n/link";
import { useT } from "@/i18n/client";
import { failureNeedsReport, paymentFailReason, sanitizeFailCode } from "@/lib/payment-fail-reason";
import { reportPaymentProblem } from "@/app/actions/payment";

/** Where the payment provider sends the payer when a payment ends inside its window without an approval. Nothing has been charged. */
function PaymentFailContent() {
  const { t } = useT();
  const copy = t.payment.fail;
  const searchParams = useSearchParams();
  const code = sanitizeFailCode(searchParams.get("code"));
  const programId = searchParams.get("programId");
  // The provider's codes are grouped into what a payer can act on (src/lib/payment-fail-reason.ts).
  const reason = copy.reasons[paymentFailReason(code)];
  // A code the page cannot explain (the provider stopped payments for the merchant, or one we do not know) is passed to
  // admissions once per visit; the server limits how often a mail goes out and skips the payment-review account.
  const reported = useRef(false);
  useEffect(() => {
    if (reported.current || !programId || !failureNeedsReport(code)) return;
    reported.current = true;
    void reportPaymentProblem(programId, "return", code).catch(() => {});
  }, [code, programId]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-20 px-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-[2rem] p-8 md:p-10 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-6 mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">{copy.title}</h1>
          <p className="text-gray-700 text-sm font-semibold leading-relaxed">{reason}</p>
          <p className="mt-2 text-gray-500 text-sm leading-relaxed">{copy.body}</p>
        </div>

        <section className="mt-6 rounded-2xl border border-gray-200 p-4">
          <h2 className="text-sm font-bold text-gray-900">{copy.tipsTitle}</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-gray-600">
            {copy.tips.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        </section>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href={programId ? `/apply?programId=${encodeURIComponent(programId)}` : "/research"}
            className="w-full h-14 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {copy.retry}
          </Link>
          <Link
            href="/contact"
            className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm flex items-center justify-center transition-colors"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            {copy.contact}
          </Link>
        </div>

        {code && <p className="mt-5 text-center text-[11px] leading-relaxed text-gray-400">{copy.reference}: {code}</p>}
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}
