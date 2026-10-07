import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PG_REVIEW_PRODUCT, pgReviewViewer } from "@/lib/pg-review";
import { TOSS_WIDGET_VARIANT_KEY, tossWidgetClientKeyValid } from "@/lib/application-fee";
import ReviewProduct from "./ReviewProduct";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "지원서 심사 서비스 결제 | CRI", robots: { index: false, follow: false } };

/** Sample product page in won for the PG registration review. Invisible (404) to everyone but the review account and admins. */
export default async function PgReviewPage() {
  const viewer = await pgReviewViewer();
  if (!viewer) notFound();
  const paymentAvailable = Boolean(process.env.TOSS_SECRET_KEY && tossWidgetClientKeyValid(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY));
  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-24 pt-32 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">CRI 리서치 프로그램</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{PG_REVIEW_PRODUCT.name}</h1>
        <p className="mt-3 text-slate-600">
          교수 멘토와 함께 진행하는 리서치 프로그램의 지원서 심사 서비스입니다. 제출된 지원서를 입학팀이 검토하고 면접 여부와 합격 결과를 이메일로 안내해 드립니다. 수업료는 별도이며 합격 후 안내됩니다.
        </p>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">상품명</dt><dd className="mt-1 font-semibold text-slate-900">{PG_REVIEW_PRODUCT.name}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">결제 금액</dt><dd className="mt-1 text-2xl font-black text-slate-900">{PG_REVIEW_PRODUCT.label}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">제공 방식</dt><dd className="mt-1 text-slate-800">온라인 심사 · 결제 후 영업일 기준 7일 이내 결과 안내</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">판매자</dt><dd className="mt-1 text-slate-800">Elite Research Co., Ltd. · 사업자등록번호 863-87-02851</dd></div>
          </dl>
          <p className="mt-5 text-sm text-slate-600">
            결제 전에 <Link href="/refunds" className="text-blue-700 underline">취소 및 환불 규정</Link>과 <Link href="/privacy" className="text-blue-700 underline">개인정보 안내</Link>를 확인해 주세요. 결제는 토스페이먼츠를 통해 처리됩니다.
          </p>
          <ReviewProduct viewer={viewer} paymentAvailable={paymentAvailable} variantKey={TOSS_WIDGET_VARIANT_KEY} />
        </section>

        <p className="mt-6 text-xs text-slate-500">이 페이지는 결제 심사용 샘플 상품 페이지이며 심사 계정에만 표시됩니다. 문의: support@cri.kr</p>
      </div>
    </div>
  );
}
