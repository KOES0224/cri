import AdminLayout from "../_components/AdminLayout";
import Link from "next/link";
export default function AdminSettingsPage() {
  return <AdminLayout><header className="mb-6"><h1 className="text-3xl font-bold tracking-tight">Settings</h1><p className="mt-2 text-sm text-slate-500">Choose the area you want to update.</p></header><div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{[
    { title: "Account settings", description: "Update your name, email and sign-in details.", href: "/dashboard/profile" },
    { title: "Website content", description: "Edit homepage text, professor profiles, articles and student success stories.", href: "/dashboard/cms" },
    { title: "Program availability", description: "Manage recruitment status, dates and visibility for each program.", href: "/dashboard/programs" },
  ].map(item => <Link key={item.href} href={item.href} prefetch={false} className="flex items-center justify-between gap-4 p-6 hover:bg-slate-50"><div><h2 className="font-semibold">{item.title}</h2><p className="mt-1 text-sm text-slate-500">{item.description}</p></div><span aria-hidden="true" className="text-blue-700">→</span></Link>)}</div><p className="mt-5 text-sm text-slate-500">Site-wide registration and maintenance controls are not available in this dashboard.</p></AdminLayout>;
}
