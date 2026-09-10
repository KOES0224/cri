"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { finalizePaidApplication } from "@/app/actions/payment";
import { CheckCircle2, Loader2, AlertCircle, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    applicationId?: string;
    receiptUrl?: string;
  } | null>(null);

  useEffect(() => {
    async function processPayment() {
      const paymentKey = searchParams.get("paymentKey");
      const orderId = searchParams.get("orderId");
      const amountStr = searchParams.get("amount");
      const programId = searchParams.get("programId");

      if (!paymentKey || !orderId || !amountStr) {
        setError("Missing payment confirmation details from Toss Payments.");
        setLoading(false);
        return;
      }

      // Retrieve saved application form draft from sessionStorage or localStorage
      let draftData: any = {};
      try {
        const stored = sessionStorage.getItem("cri_apply_draft") || localStorage.getItem("cri_apply_draft");
        if (stored) {
          draftData = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Could not parse draft data:", e);
      }

      const targetProgramId = programId || draftData.programId;

      if (!targetProgramId) {
        setError("Program ID is missing. Please contact support with your payment receipt.");
        setLoading(false);
        return;
      }

      const res = await finalizePaidApplication({
        programId: targetProgramId,
        formData: draftData.formData || {},
        paymentKey,
        orderId,
        amount: Number(amountStr),
      });

      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setResult({
          applicationId: res.applicationId,
          receiptUrl: res.receiptUrl,
        });
        setLoading(false);
        // Clean up draft storage
        try {
          sessionStorage.removeItem("cri_apply_draft");
          localStorage.removeItem("cri_apply_draft");
        } catch (e) {}

        // Auto redirect to applications dashboard after 5 seconds
        setTimeout(() => {
          router.push("/dashboard/applications");
        }, 5000);
      }
    }

    processPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-20 px-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-gray-100 text-center">
        {loading ? (
          <div className="py-12 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Verifying Payment...</h2>
            <p className="text-sm text-gray-500 max-w-xs">
              Confirming your payment with Toss Payments and finalizing your application.
            </p>
          </div>
        ) : error ? (
          <div className="py-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Submission Notice</h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{error}</p>
            <div className="flex flex-col gap-3 w-full">
              <Link
                href="/dashboard/applications"
                className="w-full h-12 bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center hover:bg-black transition-colors"
              >
                Go to Applicant Dashboard
              </Link>
              <Link
                href="/contact"
                className="w-full h-12 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                Contact Admissions Support
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20 ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
              Application & Fee Paid!
            </h2>
            <p className="text-gray-500 text-sm max-w-xs leading-relaxed mb-6">
              Your $50 USD application fee was verified. Your dossier has been submitted to the admissions committee.
            </p>

            <div className="w-full bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Order ID:</span>
                <span className="font-mono font-bold text-gray-800">{searchParams.get("orderId")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Payment Method:</span>
                <span className="font-bold text-gray-800">Toss Payments (Credit/Debit)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Status:</span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">PAID ($50.00 USD)</span>
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
                View Official Payment Receipt
              </a>
            )}

            <Link
              href="/dashboard/applications"
              className="w-full h-14 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center hover:bg-black transition-all shadow-lg hover:shadow-xl"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <p className="text-[11px] text-gray-400 mt-3">Redirecting automatically in a few seconds...</p>
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
