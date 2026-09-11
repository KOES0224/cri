import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import AdminLayout from "../_components/AdminLayout";
import AdminUsersList from "../_components/AdminUsersList";
import ListPagination from "../_components/ListPagination";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string; page?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0,100) : "";
  const role = ["Student", "Parent", "Agency", "Admin"].includes(params.role || "") ? params.role! : "Student";
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page || "1",10) || 1));
  const where: Prisma.UserWhereInput = {
    role: role === "Admin" ? "ADMIN" : role === "Student" ? "STUDENT" : "PARENT",
    ...(["Parent", "Agency"].includes(role) ? { isAgency: role === "Agency" } : {}),
    ...(q ? { OR: ["name", "email", "studentCode", "agencyName"].map(field => ({ [field]: { contains: q, mode: "insensitive" } })) } : {}),
  };
  const [users,total] = await Promise.all([
    prisma.user.findMany({ where, take:25, skip:(page-1)*25, orderBy:[{createdAt:"desc"},{id:"desc"}], select:{id:true,name:true,email:true,role:true,studentCode:true,isAgency:true,agencyName:true,createdAt:true} }),
    prisma.user.count({where}),
  ]);
  return <AdminLayout><header className="mb-6"><h1 className="text-3xl font-bold tracking-tight">People</h1><p className="mt-2 text-sm text-slate-500">Manage student, parent, agency and administrator accounts.</p></header>
    <form action="/dashboard/users" className="mb-4 flex gap-2"><input type="hidden" name="role" value={role} /><label htmlFor="people-search" className="sr-only">Search people</label><input key={q} id="people-search" name="q" defaultValue={q} placeholder="Search name, email or student code" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm" /><button className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">Search</button></form>
    <AdminUsersList initialUsers={users} activeRole={role as "Student" | "Parent" | "Agency" | "Admin"} />
    <ListPagination page={page} pageSize={25} total={total} pathname="/dashboard/users" query={{q,role}} />
  </AdminLayout>;
}
