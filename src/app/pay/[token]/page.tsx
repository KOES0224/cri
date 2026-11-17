import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { COMPANY } from "@/lib/company";
import { TOSS_WIDGET_VARIANT_KEY_KRW, tossWidgetClientKeyValid } from "@/lib/application-fee";
import { formatWon, validPaymentLinkToken } from "@/lib/payment-links";
import { settleStuckPaymentLink } from "@/lib/payment-link-server";
import PayClient from "./PayClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "결제 | CRI", robots: { index: false, follow: false } };

/** A payment link (rules in src/lib/payment-links.ts): anyone holding it pays the stated amount, no sign-in. */
export default async function PaymentLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!validPaymentLinkToken(token)) notFound();
  let link = await prisma.paymentLink.findUnique({ where: { token } });
  if (!link) notFound();
  link = await settleStuckPaymentLink(link);
  const paymentAvailable = Boolean(process.env.TOSS_SECRET_KEY && tossWidgetClientKeyValid(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY));

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-24 pt-32 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">CRI 결제 안내</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">{link.orderName}</h1>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">학생</dt><dd className="mt-1 text-lg font-semibold text-slate-900">{link.studentName}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">결제 금액</dt><dd className="mt-1 text-2xl font-black tabular-nums text-slate-900">{formatWon(link.amount)}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">받는 곳</dt><dd className="mt-1 text-sm text-slate-800">{COMPANY.legalName} · 대표 {COMPANY.representative.ko} · 사업자등록번호 {COMPANY.businessRegistrationNumber}</dd></div>
          </dl>

          {link.status === "PAID" ? (
            <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
              <p className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-5 w-5" />결제가 완료되었습니다</p>
              <p className="mt-1 text-sm">{link.paidAt ? `${link.paidAt.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} 승인` : "승인 완료"}{link.method ? ` · ${link.method}` : ""}. 다시 결제하실 필요가 없습니다.</p>
              {link.receiptUrl && <a href={link.receiptUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold underline">영수증 보기</a>}
            </div>
          ) : !link.active ? (
            <p role="status" className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">이 결제 링크는 더 이상 사용할 수 없습니다. 담당자에게 문의해 주세요.</p>
          ) : link.status === "PROCESSING" ? (
            <p role="status" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">이 링크로 진행된 결제를 확인하고 있습니다. 다시 결제하지 마시고 몇 분 뒤 이 페이지를 새로고침해 주세요.</p>
          ) : (
            <>
              <p className="mt-5 text-sm text-slate-600">
                결제는 토스페이먼츠를 통해 처리되며 로그인이 필요 없습니다. 결제 전에 <Link href="/refunds" className="text-blue-700 underline">취소 및 환불 규정</Link>을 확인해 주세요.
              </p>
              <PayClient token={link.token} amount={link.amount} orderName={link.orderName} paymentAvailable={paymentAvailable} variantKey={TOSS_WIDGET_VARIANT_KEY_KRW} />
            </>
          )}
        </section>

        <p className="mt-6 text-xs text-slate-500">문의: {COMPANY.email} · {COMPANY.phone}</p>
      </div>
    </div>
  );
}
