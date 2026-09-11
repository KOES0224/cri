import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import AdminShell from "./_components/AdminShell";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // NextAuth users initially default to "STUDENT" role without a studentCode
  if (session.user.role === "STUDENT" && !session.user.studentCode) {
    redirect("/onboarding");
  }

  if (session.user.role === "ADMIN") return <AdminShell name={session.user.name || "Administrator"}>{children}</AdminShell>;
  return <>{children}</>;
}
