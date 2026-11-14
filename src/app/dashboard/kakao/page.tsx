import AdminLayout from "../_components/AdminLayout";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatKST } from "@/lib/formatKST";
import { claudeConfigured } from "@/lib/kakao/reply";

export const dynamic = "force-dynamic";

/** What the KakaoTalk channel bot said in the last 14 days, one card per customer, newest first. */
export default async function KakaoBotPage() {
  await requireAdmin();
  const since = new Date(Date.now() - 14 * 24 * 3600_000);
  const rows = await prisma.kakaoChatMessage.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "asc" }, take: 2000 });
  const threads = new Map<string, typeof rows>();
  for (const row of rows) threads.set(row.userKey, [...(threads.get(row.userKey) ?? []), row]);
  const ordered = [...threads.entries()].sort((a, b) => b[1][b[1].length - 1].createdAt.getTime() - a[1][a[1].length - 1].createdAt.getTime());
  const handoffs = rows.filter(r => r.handoff).length;

  return (
    <AdminLayout>
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">KakaoTalk bot</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Conversations the channel chatbot answered in the last 14 days. Red turns were passed to a person and emailed to admissions; answer those in the
          KakaoTalk channel admin chat. {ordered.length} customers · {rows.length} messages · {handoffs} handoffs.
        </p>
        {!claudeConfigured() && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">ANTHROPIC_API_KEY is not set, so every message gets the fixed reply and is handed to a person.</p>}
      </header>
      {ordered.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No conversations yet.</p>}
      <div className="space-y-4">
        {ordered.map(([key, turns]) => (
          <section key={key} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-3 font-mono text-xs text-slate-400">{key.slice(0, 12)}… · last {formatKST(turns[turns.length - 1].createdAt, "MM-dd HH:mm")}</p>
            <ol className="space-y-2">
              {turns.map(t => (
                <li key={t.id} className={`max-w-2xl whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${t.role === "user" ? "bg-yellow-50 text-slate-900" : t.handoff ? "ml-auto bg-red-50 text-red-900" : "ml-auto bg-slate-100 text-slate-800"}`}>
                  {t.text}
                  <span className="mt-1 block text-[11px] text-slate-400">{formatKST(t.createdAt, "MM-dd HH:mm")}{t.reason ? ` · ${t.reason}` : ""}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </AdminLayout>
  );
}
