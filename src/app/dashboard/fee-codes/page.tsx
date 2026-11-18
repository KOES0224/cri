import AdminLayout from "../_components/AdminLayout";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatKST } from "@/lib/formatKST";
import { APPLICATION_CHARGE, APPLICATION_FEE_ENABLED, APPLICATION_FEE_INTRODUCED } from "@/lib/application-fee";
import { feeCodeEffect, feeCodeProblem, koreanDay } from "@/lib/fee-code";
import FeeCodeForm from "./FeeCodeForm";
import FeeCodeRow from "./FeeCodeRow";

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
        {!APPLICATION_FEE_ENABLED && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">The application fee is currently switched off, so applicants are not asked for a code. Codes can be prepared now and work as soon as the fee is on.</p>}
        {/* The date comes from NEXT_PUBLIC_APPLICATION_FEE_SINCE: shown so a value left over from an earlier switch-on is noticed. */}
        {APPLICATION_FEE_ENABLED && <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">The application fee is on. Drafts last saved before {formatKST(APPLICATION_FEE_INTRODUCED, "yyyy-MM-dd HH:mm")} (Korea time) are told that a fee has been introduced.</p>}
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
              return <FeeCodeRow key={row.id} row={{ id: row.id, code: row.code, partner: row.partner, note: row.note, effect: feeCodeEffect(row, APPLICATION_CHARGE.amount), usedCount: row.usedCount, maxUses: row.maxUses, lastValidDay: row.expiresAt ? koreanDay(row.expiresAt) : "", created: formatKST(row.createdAt, "yyyy-MM-dd"), active: row.active, status: text, tone }} />;
            })}
            {codes.length === 0 && <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-400">No codes yet. Create the first one above.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-slate-500">Codes are never deleted, so past applications keep theirs. Switch a code off to stop new use; applications already submitted are not affected. The number under Used links to the applications that used the code.</p>
    </AdminLayout>
  );
}
