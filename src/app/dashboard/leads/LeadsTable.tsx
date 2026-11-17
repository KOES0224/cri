"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteLeads } from "@/app/actions/crm";
import { adminStatusLabel } from "@/lib/admin-navigation";

export type LeadRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  school: string;
  status: string;
  latestNote: string | null;
  added: string;
};

export default function LeadsTable({ leads, filtered }: { leads: LeadRow[]; filtered: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const visibleIds = leads.map(l => l.id);
  const chosen = visibleIds.filter(id => selected.has(id));
  const allChecked = leads.length > 0 && chosen.length === leads.length;

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(visibleIds));

  const remove = () => {
    if (chosen.length === 0 || pending) return;
    const names = leads.filter(l => selected.has(l.id)).map(l => l.name);
    const preview = names.slice(0, 5).join(", ") + (names.length > 5 ? ` and ${names.length - 5} more` : "");
    if (!window.confirm(`Permanently delete ${chosen.length} inquir${chosen.length === 1 ? "y" : "ies"} (${preview}) with their notes and reminders?\n\nThis cannot be undone.`)) return;
    setError("");
    startTransition(async () => {
      const res = await deleteLeads(chosen);
      if (!res.success) { setError(res.error || "Could not delete. Please retry."); return; }
      setSelected(new Set());
      router.refresh();
    });
  };

  return <>
    {chosen.length > 0 && <div className="flex flex-wrap items-center gap-3 border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm">
      <span className="font-semibold text-rose-800">{chosen.length} selected</span>
      <button type="button" onClick={remove} disabled={pending} className="inline-flex items-center rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-700 disabled:opacity-50"><Trash2 className="mr-1.5 h-4 w-4" />{pending ? "Deleting…" : "Delete selected"}</button>
      <button type="button" onClick={() => setSelected(new Set())} disabled={pending} className="text-slate-600 hover:underline">Cancel</button>
      {error && <span role="alert" className="font-semibold text-rose-700">{error}</span>}
    </div>}
    <div className="overflow-x-auto"><table className="w-full text-left text-sm">
      <thead className="bg-slate-50 text-xs text-slate-500"><tr>
        <th scope="col" className="w-10 py-3 pl-5"><input type="checkbox" aria-label="Select all inquiries on this page" checked={allChecked} onChange={toggleAll} disabled={leads.length === 0} className="h-4 w-4 rounded border-slate-300" /></th>
        {["Person", "Status", "Contact", "Latest note", "Added"].map(label => <th key={label} scope="col" className="px-5 py-3 font-semibold">{label}</th>)}
      </tr></thead>
      <tbody className="divide-y divide-slate-100">
        {leads.map(lead => <tr key={lead.id} className={selected.has(lead.id) ? "bg-rose-50/60" : "hover:bg-slate-50"}>
          <td className="py-4 pl-5 align-top"><input type="checkbox" aria-label={`Select ${lead.name}`} checked={selected.has(lead.id)} onChange={() => toggle(lead.id)} className="h-4 w-4 rounded border-slate-300" /></td>
          <td className="min-w-44 px-5 py-4"><Link href={`/dashboard/leads/${lead.id}`} prefetch={false} className="font-semibold text-blue-700 hover:underline">{lead.name}</Link><p className="mt-1 text-xs text-slate-500">{lead.school || "No school details"}</p></td>
          <td className="px-5 py-4"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs ${lead.status === "NEW" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{adminStatusLabel(lead.status)}</span></td>
          <td className="px-5 py-4 text-slate-600"><p>{lead.email || "—"}</p><p className="mt-1 text-xs">{lead.phone}</p></td>
          <td className="max-w-xs px-5 py-4 text-slate-500"><p className="line-clamp-2 break-words">{lead.latestNote || "No notes yet"}</p></td>
          <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{lead.added}</td>
        </tr>)}
        {leads.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-slate-500">{filtered ? "No inquiries match these filters." : "No inquiries yet. Website contact requests will appear here."}</td></tr>}
      </tbody>
    </table></div>
  </>;
}
