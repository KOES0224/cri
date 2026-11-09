"use client";

import { useState, useTransition } from "react";
import { setFeeCodeActive, updateFeeCode } from "@/app/actions/feeCodes";

const input = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
const label = "mb-1 block text-xs font-semibold text-slate-600";

export type FeeCodeRowData = {
  id: string; code: string; partner: string; note: string | null; effect: string; usedCount: number; maxUses: number | null;
  /** Last valid day in Korea as yyyy-mm-dd, or "" for no end date. */
  lastValidDay: string; created: string; active: boolean; status: string; tone: string;
};

/**
 * One referral code in the admin list. "Edit" opens a row underneath for the things that change during a season: who the
 * code is for, the note, how many times it may be used and its last valid day. The code text and what the applicant pays
 * are fixed, so applications already recorded with the code keep their meaning.
 */
export default function FeeCodeRow({ row }: { row: FeeCodeRowData }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // Submitted by hand rather than as a form action: React resets a form after its action, which would wipe what the
  // admin typed whenever the server refuses it.
  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await updateFeeCode(data);
        if (result.saved) { setError(""); setEditing(false); } else setError(result.error || "The change could not be saved. Please try again.");
      } catch { setError("The change could not be saved. Please try again."); }
    });
  }

  return (
    <>
      <tr className="align-top">
        <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-slate-900">{row.code}</td>
        <td className="px-4 py-3 text-slate-800">{row.partner}{row.note && <span className="mt-0.5 block text-xs text-slate-500">{row.note}</span>}</td>
        <td className="whitespace-nowrap px-4 py-3 text-slate-800">{row.effect}</td>
        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-800">
          {/* The spreadsheet view searches the fee column, so the code finds the applications that used it. */}
          {row.usedCount > 0 ? <a href={`/admin/applications-sheet?q=${encodeURIComponent(row.code)}`} className="font-semibold text-blue-700 underline" title="Show the applications that used this code">{row.usedCount}</a> : row.usedCount}
          {row.maxUses !== null ? ` / ${row.maxUses}` : ""}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.lastValidDay || "No end date"}</td>
        <td className="whitespace-nowrap px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${row.tone}`}>{row.status}</span></td>
        <td className="whitespace-nowrap px-4 py-3 text-slate-500">{row.created}</td>
        <td className="whitespace-nowrap px-4 py-3 text-right">
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setEditing((value) => !value); setError(""); }} aria-expanded={editing} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">{editing ? "Close" : "Edit"}</button>
            <form action={setFeeCodeActive}>
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="active" value={row.active ? "false" : "true"} />
              <button type="submit" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">{row.active ? "Switch off" : "Switch on"}</button>
            </form>
          </div>
        </td>
      </tr>
      {editing && (
        <tr className="bg-slate-50">
          <td colSpan={8} className="px-4 py-4">
            <form onSubmit={save} className="grid gap-3 sm:grid-cols-4">
              <input type="hidden" name="id" value={row.id} />
              <div>
                <label htmlFor={`partner-${row.id}`} className={label}>Given to</label>
                <input id={`partner-${row.id}`} name="partner" required maxLength={120} defaultValue={row.partner} className={input} />
              </div>
              <div>
                <label htmlFor={`uses-${row.id}`} className={label}>Uses allowed (used so far: {row.usedCount})</label>
                <input id={`uses-${row.id}`} name="maxUses" type="number" min={1} step={1} placeholder="No limit" defaultValue={row.maxUses ?? ""} className={input} />
              </div>
              <div>
                <label htmlFor={`expires-${row.id}`} className={label}>Last valid day (KST)</label>
                <input id={`expires-${row.id}`} name="expiresAt" type="date" defaultValue={row.lastValidDay} className={input} />
              </div>
              <div>
                <label htmlFor={`note-${row.id}`} className={label}>Note (optional)</label>
                <input id={`note-${row.id}`} name="note" maxLength={500} defaultValue={row.note ?? ""} className={input} />
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:col-span-4">
                <button type="submit" disabled={pending} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50">{pending ? "Saving…" : "Save changes"}</button>
                <p className="text-xs text-slate-500">The code text and what the applicant pays cannot be changed. Leave a limit empty for none.</p>
                {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
              </div>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}
