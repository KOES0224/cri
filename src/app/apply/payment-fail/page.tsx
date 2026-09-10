"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, RotateCcw, MessageSquare, Loader2 } from "lucide-react";
import Link from "next/link";

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "PAYMENT_CANCELLED";
  const message = searchParams.get("message") || "The payment window was closed or the transaction was cancelled.";
  const programId = searchParams.get("programId");

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-20 px-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-gray-100 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-6 mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-gray-900 mb-2">Payment Incomplete</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Payment was not confirmed on this page. Check your card or payment provider before retrying. Your saved checkout application can be resumed with the same account; contact admissions if it has expired.
        </p>

        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-xs text-left mb-6 font-mono text-gray-600">
          <span className="font-bold text-gray-800 block mb-1">Status Code: {code}</span>
          <span className="text-gray-500">{message}</span>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href={programId ? `/apply?programId=${encodeURIComponent(programId)}` : "/research"}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center transition-all shadow-lg shadow-blue-500/25"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Return to Application
          </Link>

          <Link
            href="/contact"
            className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm flex items-center justify-center transition-colors"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Contact Support
          </Link>
        </div>
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
