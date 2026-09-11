"use client";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function PublicOnly({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const inDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  if (inDashboard && (status === "loading" || session?.user.role === "ADMIN")) return null;
  return children;
}
