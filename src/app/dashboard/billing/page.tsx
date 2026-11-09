import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CreditCard, Receipt } from "lucide-react";
import ParentLayout from "../_components/ParentLayout";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Payment = { id: string; program: string; amount: number; currency: string; orderId: string; paidAt: Date | null; receipt: string | null };

/** "$50.00 USD": cents and an explicit currency code. */
function money(amount: number, currency: string) {
  try { return `${new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)} ${currency}`; } catch { return `${amount} ${currency}`; }
}

/** Application fees paid from this account, read from the payment record stored with each application. */
export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");
  const applications = await prisma.application.findMany({ where: { userId: session.user.id }, select: { id: true, content: true, createdAt: true, program: { select: { title: true } } }, orderBy: { createdAt: "desc" } });
  const payments: Payment[] = [];
  for (const application of applications) {
    let payment: Record<string, unknown> | null = null;
    try { const content = JSON.parse(application.content || "{}"); if (content?.payment && typeof content.payment === "object") payment = content.payment as Record<string, unknown>; } catch {}
    if (!payment || payment.feeStatus !== "PAID" || typeof payment.amount !== "number") continue;
    // Only the payment provider's own receipt pages are linked.
    let receipt: string | null = null;
    try { const url = new URL(String(payment.receiptUrl || "")); if (url.protocol === "https:" && (url.hostname === "tosspayments.com" || url.hostname.endsWith(".tosspayments.com"))) receipt = url.href; } catch {}
    const paidAt = typeof payment.approvedAt === "string" ? new Date(payment.approvedAt) : application.createdAt;
    payments.push({ id: application.id, program: application.program.title, amount: payment.amount, currency: typeof payment.currency === "string" ? payment.currency : "USD", orderId: typeof payment.orderId === "string" ? payment.orderId : "", paidAt: Number.isNaN(paidAt.getTime()) ? null : paidAt, receipt });
  }
  return (
    <ParentLayout>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-medium tracking-tight text-gray-900 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-green-600" />
            Payments & receipts
          </h3>
          <p className="text-sm text-gray-500 mt-1">Application fees paid from this account. Tuition is arranged with admissions after admission.</p>
        </div>
        <div className="p-6 sm:p-8">
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30">
              <Receipt className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-gray-900 font-medium">No payments yet</p>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">An application fee appears here once it is paid.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
              {payments.map((payment) => (
                <li key={payment.id} className="flex flex-wrap items-start justify-between gap-4 p-4 sm:p-5">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">Application fee</p>
                    <p className="mt-0.5 break-words text-sm text-gray-600">{payment.program}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {payment.paidAt ? `Paid ${payment.paidAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}` : "Paid"}
                      {payment.orderId ? <> · Order <span className="break-all font-mono">{payment.orderId}</span></> : null}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold tabular-nums text-gray-900">{money(payment.amount, payment.currency)}</p>
                    {payment.receipt && <a href={payment.receipt} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-semibold text-blue-700 underline">View receipt</a>}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-6 text-xs text-gray-500">Questions about a payment? Email support@cri.kr with the order number.</p>
        </div>
      </div>
    </ParentLayout>
  );
}
