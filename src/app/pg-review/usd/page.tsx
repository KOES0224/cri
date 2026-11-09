import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { COMPANY } from "@/lib/company";
import { PG_REVIEW_PRODUCT_USD, pgReviewViewer } from "@/lib/pg-review";
import { TOSS_AGREEMENT_VARIANT_KEY, TOSS_WIDGET_VARIANT_KEY, tossWidgetClientKeyValid } from "@/lib/application-fee";
import ReviewProduct from "../ReviewProduct";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "달러 결제 테스트 | CRI", robots: { index: false, follow: false } };

/**
 * One-dollar test payment on the US-dollar merchant id, with the same payment UI and keys the application fee uses.
 * Invisible (404) to everyone but the review account and admins; it creates no application.
 */
export default async function PgReviewUsdPage() {
  const viewer = await pgReviewViewer();
  if (!viewer) notFound();
  const paymentAvailable = Boolean(process.env.TOSS_SECRET_KEY && tossWidgetClientKeyValid(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY));
  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-24 pt-32 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">달러 결제 테스트</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{PG_REVIEW_PRODUCT_USD.name}</h1>
        <p className="mt-3 text-slate-600">
          지원비 결제와 같은 달러용 결제 UI로 {PG_REVIEW_PRODUCT_USD.label}를 결제해 보는 테스트 페이지입니다. 지원서는 만들어지지 않으며, 결과 화면에 토스페이먼츠의 응답이 그대로 표시됩니다.
        </p>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">상품명</dt><dd className="mt-1 font-semibold text-slate-900">{PG_REVIEW_PRODUCT_USD.name}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">결제 금액</dt><dd className="mt-1 text-2xl font-black text-slate-900">{PG_REVIEW_PRODUCT_USD.label}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">결제 UI</dt><dd className="mt-1 break-all font-mono text-sm text-slate-800">{TOSS_WIDGET_VARIANT_KEY}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">판매자</dt><dd className="mt-1 text-slate-800">{COMPANY.legalName} · 대표 {COMPANY.representative.ko}</dd></div>
          </dl>
          <ul className="mt-5 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>실제 카드로 결제하면 {PG_REVIEW_PRODUCT_USD.label}가 실제로 청구됩니다. 확인 후 토스 상점관리자의 결제내역에서 취소해 주세요. 당일 취소는 전액 승인 취소됩니다.</li>
            <li>달러용 상점아이디는 해외에서 발급된 카드와 PayPal만 승인될 수 있습니다. 한국에서 발급된 카드는 거절될 수 있습니다.</li>
            <li>결제 수단이 뜨지 않으면 아래에 표시되는 오류 코드를 알려 주세요.</li>
          </ul>
          <ReviewProduct viewer={viewer} paymentAvailable={paymentAvailable} variantKey={TOSS_WIDGET_VARIANT_KEY} agreementVariantKey={TOSS_AGREEMENT_VARIANT_KEY} product="usd" />
        </section>

        <p className="mt-6 text-xs text-slate-500">
          이 페이지는 심사 계정과 관리자에게만 표시됩니다. 원화 결제 테스트는 <Link href="/pg-review" className="text-blue-700 underline">여기</Link>에서 할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
