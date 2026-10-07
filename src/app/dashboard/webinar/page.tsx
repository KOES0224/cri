import { Download } from "lucide-react";
import AdminLayout from "../_components/AdminLayout";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { WEBINAR } from "@/lib/webinar";
import { formatKST } from "@/lib/formatKST";

export const dynamic = "force-dynamic";

/** Everyone who signed up for the current webinar, newest first, with a CSV download. */
export default async function WebinarAdminPage() {
  await requireAdmin();
  const rows = await prisma.webinarRegistration.findMany({ where: { webinarKey: WEBINAR.key }, orderBy: { createdAt: "desc" } });
  const counts = { parents: rows.filter((r) => r.role === "PARENT").length, students: rows.filter((r) => r.role === "STUDENT").length, withEmail: rows.filter((r) => r.email).length };
  return (
    <AdminLayout>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webinar sign-ups</h1>
          <p className="mt-2 text-sm text-slate-500">{formatKST(WEBINAR.startsAt, "yyyy-MM-dd HH:mm")} KST · {rows.length} registered · {counts.parents} parents, {counts.students} students · {counts.withEmail} with email</p>
        </div>
        <a href="/dashboard/webinar/export" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black"><Download className="h-4 w-4" /> Export CSV</a>
      </header>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-3">Registered</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">KakaoTalk</th><th className="px-4 py-3">Question</th><th className="px-4 py-3">Lang</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatKST(r.createdAt, "MM-dd HH:mm")}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{r.name}</td>
                <td className="px-4 py-3 text-slate-600">{r.role?.toLowerCase() || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">{r.phone || "—"}</td>
                <td className="px-4 py-3">{r.email ? <a href={`mailto:${r.email}`} className="text-blue-700 hover:underline">{r.email}</a> : "—"}</td>
                <td className="px-4 py-3">{r.kakaoId || "—"}</td>
                <td className="max-w-md whitespace-pre-wrap px-4 py-3 text-slate-600">{r.question || "—"}</td>
                <td className="px-4 py-3 text-slate-500">{r.locale || "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-400">No sign-ups yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
