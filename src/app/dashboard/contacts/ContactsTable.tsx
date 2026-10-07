"use client";

import { useState, useTransition } from "react";
import { linkHousehold, setOptOut, unlinkHousehold, updateContact } from "@/app/actions/contacts";
import { segmentLabel } from "@/lib/contacts";

export type ContactRow = {
  id: string; name: string; gender: string | null; email: string; phone: string | null;
  parentName: string | null; parentEmail: string | null; parentPhone: string | null;
  school: string | null; studentLevel: string | null; gradYear: number | null; levelSource: string; segment: string;
  reviewNeeded: boolean; reviewReason: string | null; reviewedBy: string | null; reviewedAt: string | null;
  channel: string | null; agencyRaw: string | null; howLearned: string | null; householdId: string | null; pinnedNote: string | null;
  emailOptOutAt: string | null; emailBouncedAt: string | null; userId: string | null; parentUserId: string | null;
  programs: { id: string; cohortKey: string; cohortLabel: string; professor: string | null; status: string; agencyRaw: string | null; appliedAt: string | null; paymentNote: string | null; adminNote: string | null; areaOfInterest: string | null; topic: string | null; resumeUrl: string | null }[];
  siblings: { id: string; name: string; confirmed: boolean }[];
};

type Tone = "slate" | "blue" | "violet" | "amber" | "rose" | "emerald" | "sky";
const TONES: Record<Tone, string> = { slate: "bg-slate-100 text-slate-700", blue: "bg-blue-50 text-blue-700", violet: "bg-violet-50 text-violet-700", amber: "bg-amber-50 text-amber-800", rose: "bg-rose-50 text-rose-700", emerald: "bg-emerald-50 text-emerald-700", sky: "bg-sky-50 text-sky-700" };
/** Badges never overflow their cell: they truncate with an ellipsis and keep the full text in the tooltip. */
function Badge({ tone, text, title }: { tone: Tone; text: string; title?: string }) {
  return <span title={title ?? text} className={`inline-block max-w-full truncate rounded-full px-2 py-0.5 align-middle text-[11px] font-semibold leading-5 ${TONES[tone]}`}>{text}</span>;
}

const shortProfessor = (p: string | null) => (p ? p.replace(/\s*\(.*$/, "") : "");
const COLUMNS: [string, string][] = [["Person", "w-[26%]"], ["Programs", "w-[17%]"], ["Student", "w-[17%]"], ["Parent / guardian", "w-[18%]"], ["Channel", "w-[9%]"], ["Note", "w-[9%]"], ["", "w-[4%]"]];

export default function ContactsTable({ rows }: { rows: ContactRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return <div className="overflow-x-auto">
    <table className="w-full min-w-[68rem] table-fixed text-left text-sm">
      <colgroup>{COLUMNS.map(([label, width]) => <col key={label || "actions"} className={width} />)}</colgroup>
      <thead className="bg-slate-50 text-xs text-slate-500"><tr>{COLUMNS.map(([label]) => <th key={label || "actions"} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map(r => <Row key={r.id} row={r} open={openId === r.id} onToggle={() => setOpenId(openId === r.id ? null : r.id)} />)}
        {rows.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-slate-500">No customers match these filters.</td></tr>}
      </tbody>
    </table>
  </div>;
}

function Row({ row: r, open, onToggle }: { row: ContactRow; open: boolean; onToggle: () => void }) {
  const confirmed = r.siblings.filter(s => s.confirmed);
  const suggested = r.siblings.filter(s => !s.confirmed);
  const active = r.programs.filter(p => p.status !== "CANCELLED");
  const isCustomer = r.programs.some(p => p.status === "ENROLLED" || p.status === "UNPAID");
  const cell = "px-4 py-3 align-top text-xs text-slate-600 break-words";
  return <>
    <tr className={open ? "bg-blue-50/40" : "hover:bg-slate-50"}>
      <td className="px-4 py-3 align-top">
        <button type="button" onClick={onToggle} className="block max-w-full truncate text-left text-sm font-semibold text-blue-700 hover:underline" title={r.name}>{r.name}</button>
        <p className="mt-0.5 truncate text-xs text-slate-500" title={r.school ?? undefined}>{[r.school, r.studentLevel === "SCHOOL" ? "High school" : r.studentLevel === "UNIVERSITY" ? "University" : null, r.gradYear ? `class of ${r.gradYear}` : null].filter(Boolean).join(" · ") || "No school details"}</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <Badge tone={r.segment === "UNKNOWN" ? "slate" : "blue"} text={segmentLabel(r.segment)} />
          {active.length > 1 && <Badge tone="violet" text={`Repeat ×${active.length}`} title={active.map(p => p.cohortLabel).join(", ")} />}
          {!isCustomer && <Badge tone="slate" text="Applicant" />}
          {confirmed.length > 0 && <Badge tone="emerald" text={`Family · ${confirmed.map(s => s.name).join(", ")}`} />}
          {suggested.length > 0 && <Badge tone="amber" text={`Family? ${suggested.map(s => s.name).join(", ")}`} title={`Same parent email or phone as ${suggested.map(s => s.name).join(", ")}. Open the row to confirm.`} />}
          {r.reviewNeeded && <Badge tone="amber" text="Needs review" title={r.reviewReason ?? undefined} />}
          {r.programs.some(p => p.status === "UNPAID") && <Badge tone="rose" text="Unpaid" />}
          {r.emailOptOutAt && <Badge tone="rose" text="Opted out" />}
          {r.emailBouncedAt && <Badge tone="rose" text="Bounced" />}
          {(r.userId || r.parentUserId) && <a href={`/dashboard/users/${r.userId ?? r.parentUserId}`} className={`inline-block max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-semibold leading-5 hover:bg-sky-100 ${TONES.sky}`}>{r.userId ? "Portal account ↗" : "Parent account ↗"}</a>}
        </div>
      </td>
      <td className={cell}>{r.programs.map(p => <p key={p.id} className="mb-1 last:mb-0"><span className="font-semibold text-slate-700">{p.cohortLabel}</span>{p.status !== "ENROLLED" && <span className="ml-1 text-slate-400">({p.status.toLowerCase()})</span>}{p.professor && <span className="block truncate text-slate-500" title={p.professor}>{shortProfessor(p.professor)}</span>}</p>)}</td>
      <td className={cell}><p className="break-all">{r.email}</p>{r.phone && <p className="mt-1 text-slate-500">{r.phone}</p>}</td>
      <td className={cell}>{r.parentName && <p className="font-medium text-slate-700">{r.parentName}</p>}{r.parentEmail && <p className="break-all">{r.parentEmail}</p>}{r.parentPhone && <p className="mt-1 text-slate-500">{r.parentPhone}</p>}{!r.parentName && !r.parentEmail && !r.parentPhone && <span className="text-slate-300">—</span>}</td>
      <td className={cell}><p className="truncate" title={r.channel ?? undefined}>{r.channel}</p>{r.agencyRaw && r.agencyRaw !== r.channel && <p className="truncate text-slate-400" title={r.agencyRaw}>{r.agencyRaw}</p>}</td>
      <td className={cell}><p className="line-clamp-3 whitespace-pre-line" title={r.pinnedNote ?? undefined}>{r.pinnedNote || <span className="text-slate-300">—</span>}</p></td>
      <td className="px-3 py-3 text-right align-top"><button type="button" onClick={onToggle} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">{open ? "Close" : "Open"}</button></td>
    </tr>
    {open && <tr className="bg-blue-50/40"><td colSpan={7} className="px-4 pb-5 pt-1"><Editor row={r} suggested={suggested} confirmed={confirmed} /></td></tr>}
  </>;
}

function Editor({ row: r, suggested, confirmed }: { row: ContactRow; suggested: ContactRow["siblings"]; confirmed: ContactRow["siblings"] }) {
  const [level, setLevel] = useState(r.studentLevel ?? "");
  const [year, setYear] = useState(r.gradYear ? String(r.gradYear) : "");
  const [school, setSchool] = useState(r.school ?? "");
  const [note, setNote] = useState(r.pinnedNote ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ error?: string; ok?: boolean }>, done: string) => start(async () => { setMessage(null); const res = await fn(); setMessage(res.error ?? done); });
  const input = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";
  const heading = "text-xs font-bold uppercase tracking-wide text-slate-500";
  return <div className="grid gap-6 rounded-xl border border-blue-100 bg-white p-5 lg:grid-cols-3">
    <section className="min-w-0">
      <h3 className={heading}>Academic level &amp; year</h3>
      {r.reviewNeeded && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{r.reviewReason || "Needs review"}</p>}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="text-xs font-semibold text-slate-600">Level<select value={level} onChange={e => setLevel(e.target.value)} className={`${input} mt-1`}><option value="">Unknown</option><option value="SCHOOL">High school</option><option value="UNIVERSITY">University</option></select></label>
        <label className="text-xs font-semibold text-slate-600">Graduation year<input value={year} onChange={e => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="2027" className={`${input} mt-1`} /></label>
      </div>
      <label className="mt-3 block text-xs font-semibold text-slate-600">School<input value={school} onChange={e => setSchool(e.target.value)} maxLength={200} className={`${input} mt-1`} /></label>
      <p className="mt-2 text-[11px] text-slate-400">Source: {r.levelSource.toLowerCase()}{r.reviewedBy ? ` · reviewed by ${r.reviewedBy}${r.reviewedAt ? ` on ${r.reviewedAt.slice(0, 10)}` : ""}` : ""}</p>
    </section>
    <section className="min-w-0">
      <h3 className={heading}>Pinned note</h3>
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={6} maxLength={2000} placeholder="Anything worth seeing at a glance: scholarship, special schedule, family context…" className={`${input} mt-3`} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" disabled={pending} onClick={() => run(() => updateContact(r.id, { studentLevel: level || null, gradYear: year ? Number(year) : null, school, pinnedNote: note, markReviewed: true }), "Saved.")} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{pending ? "Saving…" : r.reviewNeeded ? "Save & mark reviewed" : "Save"}</button>
        <button type="button" disabled={pending} onClick={() => run(() => setOptOut(r.id, !r.emailOptOutAt), r.emailOptOutAt ? "Email re-enabled." : "Marked as opted out.")} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{r.emailOptOutAt ? "Re-enable email" : "Opt out of email"}</button>
        {message && <span className="text-xs text-slate-600">{message}</span>}
      </div>
    </section>
    <section className="min-w-0">
      <h3 className={heading}>Family &amp; history</h3>
      {confirmed.length > 0 && <p className="mt-2 text-xs text-slate-700">Linked family: {confirmed.map(s => s.name).join(", ")} <button type="button" disabled={pending} onClick={() => run(() => unlinkHousehold(r.id), "Removed from family.")} className="ml-1 text-rose-600 hover:underline">unlink</button></p>}
      {suggested.length > 0 && <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">Same parent contact as {suggested.map(s => s.name).join(", ")}. <button type="button" disabled={pending} onClick={() => run(() => linkHousehold([r.id, ...suggested.map(s => s.id)]), "Linked as one family.")} className="font-semibold underline">Confirm as family</button></div>}
      {confirmed.length === 0 && suggested.length === 0 && <p className="mt-2 text-xs text-slate-500">No sibling match on parent email or phone.</p>}
      <ul className="mt-3 space-y-2 text-xs text-slate-700">
        {r.programs.map(p => <li key={p.id} className="rounded-lg border border-slate-100 p-3">
          <p className="font-semibold">{p.cohortLabel}{p.status !== "ENROLLED" && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-600">{p.status}</span>}</p>
          <p className="text-slate-500">{[p.professor, p.agencyRaw ? `via ${p.agencyRaw}` : null, p.appliedAt ? `applied ${p.appliedAt.slice(0, 10)}` : null].filter(Boolean).join(" · ")}</p>
          {p.areaOfInterest && <p className="mt-1 line-clamp-2 text-slate-600">Interest: {p.areaOfInterest}</p>}
          {p.paymentNote && <p className="mt-1 whitespace-pre-line text-slate-500">{p.paymentNote}</p>}
          {p.adminNote && <p className="mt-1 whitespace-pre-line text-slate-500">{p.adminNote}</p>}
          {p.resumeUrl && <a href={p.resumeUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-blue-700 hover:underline">Resume</a>}
        </li>)}
      </ul>
      <p className="mt-2 text-[11px] text-slate-400">{r.howLearned ? `Heard about CRI: ${r.howLearned}` : ""}{r.gender ? ` · ${r.gender}` : ""}</p>
    </section>
  </div>;
}
