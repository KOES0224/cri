import AdminLayout from "../_components/AdminLayout";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatKST } from "@/lib/formatKST";
import { formatWon } from "@/lib/payment-links";
import { setPaymentLinkActive } from "@/app/actions/paymentLinks";
import PaymentLinkForm, { CopyLink } from "./PaymentLinkForm";

export const dynamic = "force-dynamic";

const STATUS = { OPEN: ["결제 대기", "bg-blue-50 text-blue-700 ring-blue-600/20"], PROCESSING: ["승인 확인 중", "bg-amber-50 text-amber-800 ring-amber-600/20"], PAID: ["결제 완료", "bg-emerald-50 text-emerald-700 ring-emerald-600/20"] } as const;

/** Payment links: a won payment page for one student that the payer opens without an account. Rules in src/lib/payment-links.ts. */
export default async function PaymentLinksPage() {
  await requireAdmin();
  const links = await prisma.paymentLink.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const site = (process.env.NEXTAUTH_URL || "https://criglobal.org").replace(/\/$/, "");
  return (
    <AdminLayout>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Payment links</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          학생 한 명의 결제 페이지를 만들어 링크를 보내면, 받는 분은 로그인 없이 토스페이먼츠로 원화 결제합니다. 링크 하나는 한 번만 결제되며, 결제되면 support@cri.kr로 메일이 갑니다.
        </p>
      </header>

      <PaymentLinkForm site={site} />

      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-3">학생</th><th className="px-4 py-3">금액</th><th className="px-4 py-3">상태</th><th className="px-4 py-3">링크</th><th className="px-4 py-3">만든 날</th><th className="px-4 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {links.map((row) => {
              const [text, tone] = STATUS[row.status as keyof typeof STATUS] ?? [row.status, "bg-slate-100 text-slate-600 ring-slate-500/20"];
              return (
                <tr key={row.id} className="align-top">
                  <td className="px-4 py-3 text-slate-900"><span className="font-semibold">{row.studentName}</span><span className="mt-0.5 block text-xs text-slate-500">{row.orderName}</span>{row.note && <span className="mt-0.5 block text-xs text-slate-500">{row.note}</span>}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-800">{formatWon(row.amount)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone}`}>{text}</span>
                    {!row.active && row.status !== "PAID" && <span className="ml-1 text-xs text-slate-500">(꺼짐)</span>}
                    {row.paidAt && <span className="mt-1 block text-xs text-slate-500">{formatKST(row.paidAt, "yyyy-MM-dd HH:mm")}{row.method ? ` · ${row.method}` : ""}</span>}
                    {row.orderId && <span className="mt-0.5 block font-mono text-[11px] text-slate-400">{row.orderId}</span>}
                    {row.receiptUrl && <a href={row.receiptUrl} target="_blank" rel="noopener noreferrer" className="mt-0.5 block text-xs text-blue-700 underline">영수증</a>}
                  </td>
                  <td className="px-4 py-3"><CopyLink url={`${site}/pay/${row.token}`} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatKST(row.createdAt, "yyyy-MM-dd")}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {row.status !== "PAID" && (
                      <form action={setPaymentLinkActive}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="active" value={row.active ? "false" : "true"} />
                        <button type="submit" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">{row.active ? "끄기" : "켜기"}</button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {links.length === 0 && <tr><td colSpan={6} className="px-4 py-16 text-center text-slate-400">아직 링크가 없습니다. 위에서 첫 링크를 만들어 주세요.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-slate-500">환불·취소는 토스페이먼츠 상점관리자에서 주문번호로 처리합니다.</p>
    </AdminLayout>
  );
}
