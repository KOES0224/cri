"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, ClipboardCheck, Inbox, MessageSquare, BookOpen, Users, PanelsTopLeft, Settings, ArrowUpRight, Menu, X, LogOut } from "lucide-react";
import { adminNavigation } from "@/lib/admin-navigation";

const icons = { overview: LayoutDashboard, applications: ClipboardCheck, inquiries: Inbox, messages: MessageSquare, programs: BookOpen, people: Users, content: PanelsTopLeft, settings: Settings };

export default function AdminShell({ children, name }: { children: React.ReactNode; name: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); menuButton.current?.focus(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a href="#admin-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:p-3">Skip to content</a>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button ref={menuButton} type="button" aria-label={open ? "Close admin menu" : "Open admin menu"} aria-expanded={open} aria-controls="admin-navigation" onClick={() => setOpen(!open)} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden">{open ? <X size={20} /> : <Menu size={20} />}</button>
          <Link href="/dashboard" className="text-xl font-black tracking-tight">CRI<span className="ml-2 text-sm font-medium text-slate-500">Admin</span></Link>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/" prefetch={false} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-700">View website<ArrowUpRight aria-hidden="true" size={16} /></Link>
          <Link href="/dashboard/profile" prefetch={false} className="hidden max-w-48 truncate rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium sm:block">{name}</Link>
          <button type="button" onClick={() => signOut({ callbackUrl: "/auth/login" })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Sign out"><LogOut size={18} /></button>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1600px]">
        <aside id="admin-navigation" className={`${open ? "block" : "hidden"} fixed inset-x-0 top-16 z-30 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-slate-200 bg-white p-4 lg:sticky lg:top-16 lg:block lg:h-[calc(100dvh-4rem)] lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r lg:p-5`}>
          <nav aria-label="Admin navigation" className="space-y-7">
            {adminNavigation.map(group => <div key={group.group}>
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">{group.group}</p>
              <ul className="space-y-1">{group.items.map(item => {
                const active = item.href === "/dashboard" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = icons[item.icon];
                return <li key={item.href}><Link href={item.href} prefetch={false} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}><Icon aria-hidden="true" size={18} />{item.label}</Link></li>;
              })}</ul>
            </div>)}
            <Link href="/dashboard/profile" prefetch={false} className="block px-3 text-sm text-slate-500 hover:text-blue-700">My profile</Link>
          </nav>
        </aside>
        <div id="admin-content" className="min-w-0 flex-1 px-4 py-7 sm:px-7 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
