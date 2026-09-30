"use client";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  // Admin surfaces (the dashboard shell and full-screen tools under /admin) draw their own chrome.
  const inDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname.startsWith("/admin/");
  if (inDashboard && (status === "loading" || session?.user.role === "ADMIN")) return null;
  return children;
}
