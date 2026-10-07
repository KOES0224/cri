import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pgReviewViewer } from "@/lib/pg-review";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "결제 실패 | CRI", robots: { index: false, follow: false } };

export default async function PgReviewFailPage({ searchParams }: { searchParams: Promise<{ code?: string; message?: string }> }) {
  if (!(await pgReviewViewer())) notFound();
  const { code, message } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 pb-20 pt-32">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black">결제가 완료되지 않았습니다</h1>
        <p className="mt-3 text-sm text-slate-600">{message || "결제가 취소되었거나 승인되지 않았습니다."}</p>
        {code && <p className="mt-1 font-mono text-xs text-slate-400">{code}</p>}
        <div className="mt-8 flex flex-col gap-2">
          <Link href="/pg-review" className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">다시 시도하기</Link>
          <Link href="/contact" className="text-sm text-slate-600 underline">문의하기</Link>
        </div>
      </div>
    </div>
  );
}
