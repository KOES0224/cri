"use client";

import { useState } from "react";
import { finishAudienceSync, pushAudienceBatch, startAudienceSync, type Recipient } from "@/app/actions/contacts";

type Recent = { id: string; name: string; recipient: string; audienceId: string | null; total: number; added: number; failed: number; status: string; createdAt: string };

export default function AudienceSync({ filters, total, defaultName, recent }: { filters: Record<string, string>; total: number; defaultName: string; recent: Recent[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [recipient, setRecipient] = useState("STUDENT");
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<{ audienceId: string; added: number; failed: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true); setResult(null); setProgress("Creating audience…");
    try {
      const started = await startAudienceSync({ filters, recipient, name });
      if ("error" in started && started.error) { setProgress(started.error); setBusy(false); return; }
      const { syncId, audienceId, recipients } = started as { syncId: string; audienceId: string; recipients: Recipient[] };
      let added = 0; const failed: string[] = [];
      for (let i = 0; i < recipients.length; i += 10) {
        setProgress(`Adding ${Math.min(i + 10, recipients.length)} of ${recipients.length}…`);
        const res = await pushAudienceBatch(syncId, audienceId, recipients.slice(i, i + 10));
        if ("error" in res && res.error) { failed.push(res.error); break; }
        added += res.added ?? 0; failed.push(...(res.failed ?? []));
      }
      await finishAudienceSync(syncId, failed.length && !added ? "FAILED" : "DONE");
      setProgress(null); setResult({ audienceId, added, failed });
    } catch (e) {
      setProgress(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setBusy(false); }
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700">Send to Resend audience</button>
    {open && <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-16" role="dialog" aria-modal="true" aria-labelledby="audience-title" onClick={e => { if (e.target === e.currentTarget && !busy) setOpen(false); }}>
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><h3 id="audience-title" className="text-base font-bold text-slate-900">Create a Resend audience</h3><p className="mt-1 text-xs text-slate-500">The {total} people matching the current filters are added one by one; opted-out and bounced addresses are skipped. Write and send the email in Resend → Broadcasts, where every recipient gets their own copy with an unsubscribe link.</p></div>
          <button type="button" onClick={() => !busy && setOpen(false)} className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">✕</button>
        </div>
        <label className="mt-4 block text-xs font-semibold text-slate-600">Audience name<input value={name} onChange={e => setName(e.target.value)} maxLength={120} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
        <label className="mt-3 block text-xs font-semibold text-slate-600">Recipients<select value={recipient} onChange={e => setRecipient(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="STUDENT">Student emails</option><option value="PARENT">Parent / guardian emails</option><option value="BOTH">Students and parents</option></select></label>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" disabled={busy || total === 0} onClick={run} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy ? "Working…" : "Create audience"}</button>
          <button type="button" disabled={busy} onClick={() => setOpen(false)} className="px-2 py-2 text-xs text-slate-500">Close</button>
          {progress && <span className="text-xs text-slate-700">{progress}</span>}
        </div>
        {result && <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900">
          <p className="font-semibold">Audience ready: {result.added} added{result.failed.length ? `, ${result.failed.length} failed` : ""}.</p>
          <a href={`https://resend.com/audiences/${result.audienceId}`} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold underline">Open in Resend</a>
          {result.failed.length > 0 && <ul className="mt-2 list-disc pl-4 text-rose-700">{result.failed.slice(0, 5).map(f => <li key={f}>{f}</li>)}</ul>}
          <p className="mt-2 text-emerald-800">Reminder for promotional emails: start the subject with (광고), keep the sender name, address and unsubscribe line in the footer.</p>
        </div>}
        {recent.length > 0 && <div className="mt-5 border-t border-slate-100 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Recent audiences</p>
          <ul className="mt-1 space-y-1 text-xs text-slate-600">{recent.map(s => <li key={s.id} className="flex items-center justify-between gap-2"><span className="truncate">{s.name} · {s.recipient.toLowerCase()} · {s.added}/{s.total}</span>{s.audienceId && <a href={`https://resend.com/audiences/${s.audienceId}`} target="_blank" rel="noreferrer" className="shrink-0 text-blue-700 hover:underline">open</a>}</li>)}</ul>
        </div>}
      </div>
    </div>}
  </>;
}
