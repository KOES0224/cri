import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import StudentDashboard from "./_components/StudentDashboard";
import ParentDashboard from "./_components/ParentDashboard";
import AdminDashboard from "./_components/AdminDashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  const role = session.user.role;
  const name = session.user.name || "User";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-10">
      {role === "ADMIN" && <AdminDashboard name={name} />}
      {role === "PARENT" && <ParentDashboard name={name} />}
      {(role === "STUDENT" || !role) && <StudentDashboard name={name} />}
    </div>
  );
}
