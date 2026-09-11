import AdminLayout from "../_components/AdminLayout";
import ListPagination from "../_components/ListPagination";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { formatKST } from "@/lib/formatKST";
import { adminStatusLabel } from "@/lib/admin-navigation";
import CreateLeadModal from "./CreateLeadModal";

export default async function AdminLeadsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; status?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const status = ["NEW", "CONTACTED", "MET", "ENROLLED", "WAITLISTED", "REJECTED"].includes(params.status || "") ? params.status! : "";
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page || "1", 10) || 1));
  const where: Prisma.LeadWhereInput = {
    ...(status ? { status } : {}),
    ...(q ? { OR: ["name", "email", "phone", "institution"].map(field => ({ [field]: { contains: q, mode: "insensitive" } })) } : {}),
  };
  const [leads, total] = await Promise.all([
    prisma.lead.findMany({ where, take: 25, skip: (page - 1) * 25, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, name: true, email: true, phone: true, grade: true, institution: true, status: true, createdAt: true, activities: { take: 1, orderBy: { createdAt: "desc" }, select: { content: true } } } }),
    prisma.lead.count({ where }),
  ]);
  return <AdminLayout>
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold tracking-tight">Inquiries</h1><p className="mt-2 text-sm text-slate-500">Follow up with prospective students and keep consultation notes together.</p></div><CreateLeadModal /></header>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <form className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-5" action="/dashboard/leads">
        <div className="min-w-0 flex-1"><label htmlFor="inquiry-search" className="mb-1.5 block text-xs font-semibold text-slate-600">Search inquiries</label><input id="inquiry-search" name="q" defaultValue={q} placeholder="Name, email, phone or institution" maxLength={100} className="w-full min-w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
        <div><label htmlFor="inquiry-status" className="mb-1.5 block text-xs font-semibold text-slate-600">Status</label><select id="inquiry-status" name="status" defaultValue={status} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">All statuses</option>{["NEW", "CONTACTED", "MET", "ENROLLED", "WAITLISTED", "REJECTED"].map(s => <option value={s} key={s}>{adminStatusLabel(s)}</option>)}</select></div>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Search</button>{(q || status) && <Link href="/dashboard/leads" className="px-2 py-2 text-sm text-slate-500">Clear</Link>}
      </form>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Person", "Status", "Contact", "Latest note", "Added"].map(label => <th key={label} scope="col" className="px-5 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{leads.map(lead => <tr key={lead.id} className="hover:bg-slate-50"><td className="min-w-44 px-5 py-4"><Link href={`/dashboard/leads/${lead.id}`} prefetch={false} className="font-semibold text-blue-700 hover:underline">{lead.name}</Link><p className="mt-1 text-xs text-slate-500">{[lead.grade, lead.institution].filter(Boolean).join(" · ") || "No school details"}</p></td><td className="px-5 py-4"><span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs ${lead.status === "NEW" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{adminStatusLabel(lead.status)}</span></td><td className="px-5 py-4 text-slate-600"><p>{lead.email || "—"}</p><p className="mt-1 text-xs">{lead.phone}</p></td><td className="max-w-xs px-5 py-4 text-slate-500"><p className="line-clamp-2 break-words">{lead.activities[0]?.content || "No notes yet"}</p></td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatKST(lead.createdAt, "MMM d, yyyy")}</td></tr>)}{leads.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-500">{q || status ? "No inquiries match these filters." : "No inquiries yet. Website contact requests will appear here."}</td></tr>}</tbody></table></div>
      <ListPagination page={page} pageSize={25} total={total} pathname="/dashboard/leads" query={{ q, status }} />
    </div>
  </AdminLayout>;
}
