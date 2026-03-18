import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login");
  }

  // NextAuth users initially default to "STUDENT" role without a studentCode
  if (session.user.role === "STUDENT" && !session.user.studentCode) {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
