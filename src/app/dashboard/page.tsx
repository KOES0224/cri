import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import StudentDashboard from "./_components/StudentDashboard";
import ParentDashboard from "./_components/ParentDashboard";
import AdminDashboard from "./_components/AdminDashboard";
import { prisma } from "@/lib/prisma";
import { getGlobalUnreadCount } from "@/app/actions/messages";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  const role = session.user.role;
  const name = session.user.name || "User";

  const isStudent = role === "STUDENT" || !role;

  let unreadCount = 0;
  let activePrograms = 0;
  let pendingApps = 0;

  if (isStudent) {
    unreadCount = await getGlobalUnreadCount();
    activePrograms = await prisma.enrollment.count({
      where: { userId: session.user.id, status: "ONGOING" }
    });
    pendingApps = await prisma.application.count({
      where: { userId: session.user.id, status: "PENDING" }
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-10">
      {role === "ADMIN" && <AdminDashboard name={name} />}
      {role === "PARENT" && <ParentDashboard name={name} />}
      {isStudent && (
        <StudentDashboard 
          name={name} 
          unreadCount={unreadCount}
          activePrograms={activePrograms}
          pendingApps={pendingApps}
        />
      )}
    </div>
  );
}
