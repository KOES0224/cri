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
  emailOptOutAt: string | null; emailBouncedAt: string | null; userId: string | null;
  programs: { id: string; cohortKey: string; cohortLabel: string; professor: string | null; status: string; agencyRaw: string | null; appliedAt: string | null; paymentNote: string | null; adminNote: string | null; areaOfInterest: string | null; topic: string | null; resumeUrl: string | null }[];
  siblings: { id: string; name: string; confirmed: boolean }[];
};

const badge = (tone: "slate" | "blue" | "violet" | "amber" | "rose" | "emerald", text: string, title?: string) => {
  const tones = { slate: "bg-slate-100 text-slate-700", blue: "bg-blue-50 text-blue-700", violet: "bg-violet-50 text-violet-700", amber: "bg-amber-50 text-amber-800", rose: "bg-rose-50 text-rose-700", emerald: "bg-emerald-50 text-emerald-700" };
  return <span key={text} title={title} className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>{text}</span>;
};

export default function ContactsTable({ rows }: { rows: ContactRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return <div className="overflow-x-auto">
    <table className="w-full text-left text-sm">
      <thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Person", "Programs", "Student contact", "Parent / guardian", "Channel", "Note", ""].map(h => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map(r => {
          const open = openId === r.id;
          const confirmedSiblings = r.siblings.filter(s => s.confirmed);
          const suggested = r.siblings.filter(s => !s.confirmed);
          return <RowGroup key={r.id} row={r} open={open} onToggle={() => setOpenId(open ? null : r.id)} confirmedSiblings={confirmedSiblings} suggested={suggested} />;
        })}
        {rows.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-slate-500">No customers match these filters.</td></tr>}
      </tbody>
    </table>
  </div>;
}

function RowGroup({ row: r, open, onToggle, confirmedSiblings, suggested }: { row: ContactRow; open: boolean; onToggle: () => void; confirmedSiblings: ContactRow["siblings"]; suggested: ContactRow["siblings"] }) {
  const unpaid = r.programs.some(p => p.status === "UNPAID");
  return <>
    <tr className={`align-top ${open ? "bg-blue-50/40" : "hover:bg-slate-50"}`}>
      <td className="min-w-56 px-4 py-3">
        <button type="button" onClick={onToggle} className="text-left font-semibold text-blue-700 hover:underline">{r.name}</button>
        <p className="mt-0.5 text-xs text-slate-500">{[r.school, r.studentLevel === "SCHOOL" ? "High school" : r.studentLevel === "UNIVERSITY" ? "University" : null, r.gradYear ? `class of ${r.gradYear}` : null].filter(Boolean).join(" · ") || "No school details"}</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {badge(r.segment === "UNKNOWN" ? "slate" : "blue", segmentLabel(r.segment))}
          {r.programs.length > 1 && badge("violet", `Repeat · ${r.programs.length} programs`)}
          {confirmedSiblings.length > 0 && badge("emerald", `Family: ${confirmedSiblings.map(s => s.name).join(", ")}`)}
          {suggested.length > 0 && badge("amber", `Family? ${suggested.map(s => s.name).join(", ")}`, "Same parent email or phone. Open the row to confirm.")}
          {r.reviewNeeded && badge("amber", "Needs review", r.reviewReason ?? undefined)}
          {unpaid && badge("rose", "Unpaid")}
          {r.emailOptOutAt && badge("rose", "Opted out")}
          {r.emailBouncedAt && badge("rose", "Bounced")}
        </div>
      </td>
      <td className="min-w-48 px-4 py-3 text-xs text-slate-700">{r.programs.map(p => <p key={p.id} className="mb-1"><span className="font-semibold">{p.cohortLabel}</span>{p.professor ? <span className="text-slate-500"> · {p.professor.replace(/\s*\(.*$/, "")}</span> : null}</p>)}</td>
      <td className="px-4 py-3 text-xs text-slate-600"><p className="break-all">{r.email}</p><p className="mt-1">{r.phone}</p></td>
      <td className="px-4 py-3 text-xs text-slate-600"><p className="font-medium text-slate-700">{r.parentName}</p><p className="break-all">{r.parentEmail}</p><p className="mt-1">{r.parentPhone}</p></td>
      <td className="px-4 py-3 text-xs text-slate-600"><p>{r.channel}</p>{r.agencyRaw && r.agencyRaw !== r.channel && <p className="text-slate-400">{r.agencyRaw}</p>}</td>
      <td className="max-w-xs px-4 py-3 text-xs text-slate-600"><p className="line-clamp-3 whitespace-pre-line break-words">{r.pinnedNote || <span className="text-slate-300">—</span>}</p></td>
      <td className="px-4 py-3 text-right"><button type="button" onClick={onToggle} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">{open ? "Close" : "Open"}</button></td>
    </tr>
    {open && <tr className="bg-blue-50/40"><td colSpan={7} className="px-4 pb-5 pt-1"><Editor row={r} suggested={suggested} confirmed={confirmedSiblings} /></td></tr>}
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
  const input = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";
  return <div className="grid gap-5 rounded-xl border border-blue-100 bg-white p-4 md:grid-cols-[1fr_1fr_1.2fr]">
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Academic level &amp; year</h3>
      {r.reviewNeeded && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{r.reviewReason || "Needs review"}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs font-semibold text-slate-600">Level<select value={level} onChange={e => setLevel(e.target.value)} className={`${input} mt-1 w-full`}><option value="">Unknown</option><option value="SCHOOL">High school</option><option value="UNIVERSITY">University</option></select></label>
        <label className="text-xs font-semibold text-slate-600">Graduation year<input value={year} onChange={e => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder="2027" className={`${input} mt-1 w-full`} /></label>
      </div>
      <label className="mt-2 block text-xs font-semibold text-slate-600">School<input value={school} onChange={e => setSchool(e.target.value)} maxLength={200} className={`${input} mt-1 w-full`} /></label>
      <p className="mt-2 text-[11px] text-slate-400">Source: {r.levelSource.toLowerCase()}{r.reviewedBy ? ` · reviewed by ${r.reviewedBy}${r.reviewedAt ? ` on ${r.reviewedAt.slice(0, 10)}` : ""}` : ""}</p>
    </div>
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Pinned note</h3>
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={5} maxLength={2000} placeholder="Anything worth seeing at a glance: scholarship, special schedule, family context…" className={`${input} mt-3 w-full`} />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" disabled={pending} onClick={() => run(() => updateContact(r.id, { studentLevel: level || null, gradYear: year ? Number(year) : null, school, pinnedNote: note, markReviewed: true }), "Saved.")} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{pending ? "Saving…" : r.reviewNeeded ? "Save & mark reviewed" : "Save"}</button>
        <button type="button" disabled={pending} onClick={() => run(() => setOptOut(r.id, !r.emailOptOutAt), r.emailOptOutAt ? "Email re-enabled." : "Marked as opted out.")} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{r.emailOptOutAt ? "Re-enable email" : "Opt out of email"}</button>
        {message && <span className="text-xs text-slate-600">{message}</span>}
      </div>
    </div>
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Family &amp; history</h3>
      {confirmed.length > 0 && <p className="mt-2 text-xs text-slate-700">Linked family: {confirmed.map(s => s.name).join(", ")} <button type="button" disabled={pending} onClick={() => run(() => unlinkHousehold(r.id), "Removed from family.")} className="ml-1 text-rose-600 hover:underline">unlink</button></p>}
      {suggested.length > 0 && <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">Same parent contact as {suggested.map(s => s.name).join(", ")}. <button type="button" disabled={pending} onClick={() => run(() => linkHousehold([r.id, ...suggested.map(s => s.id)]), "Linked as one family.")} className="font-semibold underline">Confirm as family</button></div>}
      {confirmed.length === 0 && suggested.length === 0 && <p className="mt-2 text-xs text-slate-500">No sibling match on parent email or phone.</p>}
      <ul className="mt-3 space-y-2 text-xs text-slate-700">
        {r.programs.map(p => <li key={p.id} className="rounded-lg border border-slate-100 p-2.5">
          <p className="font-semibold">{p.cohortLabel}{p.status !== "ENROLLED" && <span className="ml-2 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-700">{p.status}</span>}</p>
          <p className="text-slate-500">{[p.professor, p.agencyRaw ? `via ${p.agencyRaw}` : null, p.appliedAt ? `applied ${p.appliedAt.slice(0, 10)}` : null].filter(Boolean).join(" · ")}</p>
          {p.areaOfInterest && <p className="mt-1 line-clamp-2 text-slate-600">Interest: {p.areaOfInterest}</p>}
          {p.paymentNote && <p className="mt-1 whitespace-pre-line text-slate-500">{p.paymentNote}</p>}
          {p.adminNote && <p className="mt-1 whitespace-pre-line text-slate-500">{p.adminNote}</p>}
          {p.resumeUrl && <a href={p.resumeUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-blue-700 hover:underline">Resume</a>}
        </li>)}
      </ul>
      <p className="mt-2 text-[11px] text-slate-400">{r.howLearned ? `Heard about CRI: ${r.howLearned}` : ""}{r.gender ? ` · ${r.gender}` : ""}</p>
    </div>
  </div>;
}
