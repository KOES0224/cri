import AdminLayout from "../_components/AdminLayout";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatKST } from "@/lib/formatKST";
import { APPLICATION_CHARGE, APPLICATION_FEE_ENABLED } from "@/lib/application-fee";
import { feeCodeEffect, feeCodeProblem } from "@/lib/fee-code";
import { setFeeCodeActive } from "@/app/actions/feeCodes";
import FeeCodeForm from "./FeeCodeForm";

export const dynamic = "force-dynamic";

const STATUS = { ok: ["Active", "bg-emerald-50 text-emerald-700 ring-emerald-600/20"], inactive: ["Switched off", "bg-slate-100 text-slate-600 ring-slate-500/20"], expired: ["Expired", "bg-amber-50 text-amber-800 ring-amber-600/20"], usedUp: ["Used up", "bg-amber-50 text-amber-800 ring-amber-600/20"], invalid: ["Invalid", "bg-red-50 text-red-700 ring-red-600/20"] } as const;

/**
 * Referral codes: a code given to an agency or school. An applicant who enters it at the payment step pays a reduced
 * application fee or none. Uses are counted when an application is recorded.
 */
export default async function FeeCodesPage() {
  await requireAdmin();
  const codes = await prisma.feeCode.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();
  return (
    <AdminLayout>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Referral codes</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Give a code to an agency or school. An applicant who enters it on the payment step pays a reduced application fee, or none at all.
          The normal fee is ${APPLICATION_CHARGE.amount} USD. A use is counted when the application is submitted.
        </p>
        {!APPLICATION_FEE_ENABLED && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">The application fee is currently switched off, so applicants are not asked for a code.</p>}
      </header>

      <FeeCodeForm normalFee={APPLICATION_CHARGE.amount} />

      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Given to</th><th className="px-4 py-3">Applicant pays</th><th className="px-4 py-3">Used</th><th className="px-4 py-3">Last valid day</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th><th className="px-4 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {codes.map((row) => {
              const [text, tone] = STATUS[feeCodeProblem(row, now) ?? "ok"];
              return (
                <tr key={row.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-slate-900">{row.code}</td>
                  <td className="px-4 py-3 text-slate-800">{row.partner}{row.note && <span className="mt-0.5 block text-xs text-slate-500">{row.note}</span>}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-800">{feeCodeEffect(row, APPLICATION_CHARGE.amount)}</td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-800">{row.usedCount}{row.maxUses !== null ? ` / ${row.maxUses}` : ""}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.expiresAt ? formatKST(row.expiresAt, "yyyy-MM-dd") : "No end date"}</td>
                  <td className="whitespace-nowrap px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${tone}`}>{text}</span></td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatKST(row.createdAt, "yyyy-MM-dd")}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <form action={setFeeCodeActive}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="active" value={row.active ? "false" : "true"} />
                      <button type="submit" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">{row.active ? "Switch off" : "Switch on"}</button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {codes.length === 0 && <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-400">No codes yet. Create the first one above.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-slate-500">Codes are never deleted, so past applications keep theirs. Switch a code off to stop new use; applications already submitted are not affected.</p>
    </AdminLayout>
  );
}
