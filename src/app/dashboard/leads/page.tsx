import AdminLayout from "../_components/AdminLayout";
import ListPagination from "../_components/ListPagination";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { formatKST } from "@/lib/formatKST";
import { adminStatusLabel } from "@/lib/admin-navigation";
import CreateLeadModal from "./CreateLeadModal";
import LeadsTable from "./LeadsTable";

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
      <LeadsTable filtered={Boolean(q || status)} leads={leads.map(lead => ({ id: lead.id, name: lead.name, email: lead.email, phone: lead.phone, school: [lead.grade, lead.institution].filter(Boolean).join(" · "), status: lead.status, latestNote: lead.activities[0]?.content || null, added: formatKST(lead.createdAt, "MMM d, yyyy") }))} />
      <ListPagination page={page} pageSize={25} total={total} pathname="/dashboard/leads" query={{ q, status }} />
    </div>
  </AdminLayout>;
}
