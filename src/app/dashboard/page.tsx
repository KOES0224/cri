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
  let pendingApplicationsData: any = [];
  let pendingAssignmentsData: any = [];
  let upcomingEventsData: any = [];

  if (isStudent) {
    unreadCount = await getGlobalUnreadCount();
    
    // Programs count (ONGOING and ACCEPTED)
    activePrograms = await prisma.enrollment.count({
      where: { 
        userId: session.user.id, 
        status: { in: ["ONGOING", "ACCEPTED"] } 
      }
    });

    // Pending applications
    pendingApplicationsData = await prisma.application.findMany({
      where: { userId: session.user.id, status: "PENDING" },
      include: { program: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Pending assignments
    pendingAssignmentsData = await prisma.assignmentSubmission.findMany({
      where: { userId: session.user.id, status: "PENDING" },
      include: { assignment: { include: { program: true } } },
      orderBy: { assignment: { dueDate: 'asc' } },
      take: 5
    });

    // Upcoming events
    upcomingEventsData = await prisma.post.findMany({
      where: { 
        category: "Events",
        eventDate: { gte: new Date() }
      },
      orderBy: { eventDate: 'asc' },
      take: 3
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
          pendingApplications={pendingApplicationsData}
          pendingAssignments={pendingAssignmentsData}
          upcomingEvents={upcomingEventsData}
        />
      )}
    </div>
  );
}
