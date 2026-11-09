"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, RotateCcw, MessageSquare, Loader2 } from "lucide-react";
import Link from "@/i18n/link";
import { useT } from "@/i18n/client";

/** Where the payment provider sends the payer when a payment ends inside its window without an approval. Nothing has been charged. */
function PaymentFailContent() {
  const { t } = useT();
  const copy = t.payment.fail;
  const searchParams = useSearchParams();
  const code = (searchParams.get("code") || "").replace(/[^A-Z0-9_]/gi, "").slice(0, 60);
  const programId = searchParams.get("programId");
  // The provider's codes, grouped into what a payer can act on. Its own text is never shown: it may be in Korean, and a
  // lost, stolen or flagged card is reported as a plain decline.
  // Only the payer's own cancel reads as "you canceled". PAY_PROCESS_ABORTED is the provider's general "this payment
  // failed in the window" (a failed bank verification, a refusal), so it gets the try-another-card wording.
  const reason = !code || /^(PAY_PROCESS_CANCELED|USER_CANCEL|PAYMENT_CANCELLED)$/i.test(code) ? copy.reasons.canceled
    : /ABORTED/i.test(code) ? copy.reasons.notApproved
    : /NOT_SUPPORTED/i.test(code) ? copy.reasons.currency
    : /REJECT_CARD_PAYMENT|EXCEED/i.test(code) ? copy.reasons.limit
    : /INVALID_CARD_NUMBER|INVALID_CARD_EXPIRATION|INVALID_CARD_IDENTITY|INVALID_PASSWORD/i.test(code) ? copy.reasons.details
    : /REJECT|INVALID_CARD|INVALID_STOPPED|RESTRICTED|LOST|FDS/i.test(code) ? copy.reasons.declined
    : copy.reasons.generic;

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
