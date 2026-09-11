import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import AdminLayout from "../_components/AdminLayout";
import ListPagination from "../_components/ListPagination";
import ApplicationsTable from "./ApplicationsTable";
import { adminStatusLabel } from "@/lib/admin-navigation";

export default async function AdminApplicationsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0,100) : "";
  const status = ["PENDING","ACCEPTED","REJECTED"].includes(params.status || "") ? params.status! : "";
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page || "1",10) || 1));
  const where: Prisma.ApplicationWhereInput = {
    ...(status ? {status} : {}),
    ...(q ? {OR:[{user:{name:{contains:q,mode:"insensitive"}}},{user:{email:{contains:q,mode:"insensitive"}}},{user:{studentCode:{contains:q,mode:"insensitive"}}},{program:{title:{contains:q,mode:"insensitive"}}}]} : {}),
  };
  const [applications,total] = await Promise.all([
    prisma.application.findMany({where,take:25,skip:(page-1)*25,orderBy:[{createdAt:"desc"},{id:"desc"}],select:{id:true,status:true,updatedAt:true,createdAt:true,user:{select:{id:true,name:true,email:true,image:true,studentCode:true}},program:{select:{id:true,title:true}},steps:{orderBy:{order:"asc"}}}}),
    prisma.application.count({where}),
  ]);
  return <AdminLayout><header className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold tracking-tight">Applications</h1><p className="mt-2 text-sm text-slate-500">Review submissions, update decisions and track each applicant’s next steps.</p></div><Link prefetch={false} href="/dashboard/applications-admin/sheet" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">Spreadsheet view</Link></header>
    <form action="/dashboard/applications-admin" className="mb-4 flex flex-wrap gap-3"><label htmlFor="application-search" className="sr-only">Search applications</label><input id="application-search" name="q" defaultValue={q} placeholder="Name, email, student code or program" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm" /><label htmlFor="application-status" className="sr-only">Application status</label><select id="application-status" name="status" defaultValue={status} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">All statuses</option>{["PENDING","ACCEPTED","REJECTED"].map(s=><option value={s} key={s}>{adminStatusLabel(s)}</option>)}</select><button className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">Search</button>{(q||status)&&<Link href="/dashboard/applications-admin" className="px-2 py-2.5 text-sm text-slate-500">Clear</Link>}</form>
    <ApplicationsTable initialApplications={applications} />
    <ListPagination page={page} pageSize={25} total={total} pathname="/dashboard/applications-admin" query={{q,status}} />
  </AdminLayout>;
}
