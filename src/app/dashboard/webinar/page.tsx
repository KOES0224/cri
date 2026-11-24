import { Download } from "lucide-react";
import AdminLayout from "../_components/AdminLayout";
import { requireAdmin } from "@/lib/admin";
import { formatKST } from "@/lib/formatKST";
import { pickWebinarKey, webinarOptions, webinarRowsWithHistory } from "@/lib/webinar-admin";

export const dynamic = "force-dynamic";

/**
 * Sign-ups per webinar (current one by default, ?key= for an earlier one), newest first, with a CSV download.
 * Each webinar has its own key, so lists never mix; the "Other sessions" column shows who signed up before.
 */
export default async function WebinarAdminPage({ searchParams }: { searchParams: Promise<{ key?: string; only?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const key = pickWebinarKey(params.key);
  const options = webinarOptions();
  const all = await webinarRowsWithHistory(key);
  const only = params.only === "new" || params.only === "returning" ? params.only : "";
  const rows = only === "new" ? all.filter((r) => !r.otherSignups.length) : only === "returning" ? all.filter((r) => r.otherSignups.length) : all;
  const counts = {
    parents: all.filter((r) => r.role === "PARENT").length,
    students: all.filter((r) => r.role === "STUDENT").length,
    kakao: all.filter((r) => r.viaKakao).length,
    returning: all.filter((r) => r.otherSignups.length).length,
  };
  const href = (next: { key?: string; only?: string }) => {
    const q = new URLSearchParams();
    const k = next.key ?? key; const o = next.only ?? only;
    if (k !== options[0].key) q.set("key", k);
    if (o) q.set("only", o);
    const s = q.toString();
    return `/dashboard/webinar${s ? `?${s}` : ""}`;
  };
  const exportHref = `/dashboard/webinar/export${key !== options[0].key ? `?key=${encodeURIComponent(key)}` : ""}`;
  const chip = (active: boolean) => `rounded-full px-3 py-1.5 text-sm font-semibold ${active ? "bg-slate-900 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`;
  return (
    <AdminLayout>
      <header className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Webinar sign-ups</h1>
          <p className="mt-2 text-sm text-slate-500">{all.length} registered · {counts.parents} parents, {counts.students} students · {counts.kakao} via KakaoTalk channel · {counts.returning} also signed up for another session</p>
        </div>
        <a href={exportHref} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-black"><Download className="h-4 w-4" /> Export CSV</a>
      </header>
      <nav className="mb-3 flex flex-wrap gap-2" aria-label="Session">
        {options.map((w) => <a key={w.key} href={href({ key: w.key, only: "" })} className={chip(w.key === key)}>{w.label}{w.current ? " (current)" : ""}</a>)}
      </nav>
      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Filter">
        <a href={href({ only: "" })} className={chip(!only)}>All</a>
        <a href={href({ only: "new" })} className={chip(only === "new")}>First time only</a>
        <a href={href({ only: "returning" })} className={chip(only === "returning")}>Signed up for another session</a>
      </nav>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-3">Registered</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">KakaoTalk</th><th className="px-4 py-3">Other sessions</th><th className="px-4 py-3">Question</th><th className="px-4 py-3">Lang</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatKST(r.createdAt, "MM-dd HH:mm")}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{r.name}</td>
                <td className="px-4 py-3 text-slate-600">{r.role?.toLowerCase() || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">{r.phone || "—"}</td>
                <td className="px-4 py-3">{r.email ? <a href={`mailto:${r.email}`} className="text-blue-700 hover:underline">{r.email}</a> : "—"}</td>
                <td className="px-4 py-3">{r.viaKakao ? <a href="/dashboard/kakao" className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-semibold text-yellow-900">channel chat</a> : r.kakaoId || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">{r.otherSignups.length ? r.otherSignups.map((l) => <span key={l} className="mr-1 rounded bg-blue-50 px-1.5 py-0.5 text-xs font-semibold text-blue-800">{l}</span>) : <span className="text-xs text-slate-400">first time</span>}</td>
                <td className="max-w-md whitespace-pre-wrap px-4 py-3 text-slate-600">{r.question || "—"}</td>
                <td className="px-4 py-3 text-slate-500">{r.locale || "—"}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={9} className="px-4 py-16 text-center text-slate-400">No sign-ups yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
