import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

// The persistent visual shell lives in dashboard/layout.tsx. Keep this role
// guard for admin-only pages that are also reachable by other portal roles.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") redirect("/dashboard");
  return <>{children}</>;
}
