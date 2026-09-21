import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import StudentDashboard from "./_components/StudentDashboard";
import ParentDashboard from "./_components/ParentDashboard";
import AdminDashboard from "./_components/AdminDashboard";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import { getGlobalUnreadCount } from "@/app/actions/messages";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  const role = session.user.role;
  const name = session.user.name || "User";

  if (role === "ADMIN") return <AdminDashboard name={name} />;

  const isStudent = role === "STUDENT" || !role;

  let unreadCount = 0;
  let activePrograms = 0;
  let totalApplications = 0;
  let pendingApplicationsData: any = [];
  let pendingAssignmentsData: any = [];
  let upcomingEventsData: any = [];
  let parentApplications: any[] = [];
  let parentDrafts: any[] = [];
  let linkedStudents: any[] = [];

  if (role === "PARENT") {
    // Parents and agencies apply on behalf of students and follow their linked students' programs.
    [parentApplications, parentDrafts, linkedStudents] = await Promise.all([
      prisma.application.findMany({ where: { userId: session.user.id }, include: { program: { select: { title: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.applicationDraft.findMany({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" }, take: 5 }),
      prisma.user.findMany({ where: { parentId: session.user.id }, select: { id: true, name: true, email: true, enrollments: { select: { status: true, program: { select: { title: true } } } } }, orderBy: { name: "asc" } }),
    ]);
  }

  if (isStudent) {
    unreadCount = await getGlobalUnreadCount();
    
    // Total Applications
    totalApplications = await prisma.application.count({
      where: { userId: session.user.id }
    });

    // Programs count (ONGOING and ACCEPTED)
    activePrograms = await prisma.enrollment.count({
      where: { 
        userId: session.user.id, 
        status: "ONGOING" 
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
      {role === "PARENT" && (
        <ParentDashboard
          name={name}
          applications={parentApplications.map((app) => ({ id: app.id, title: app.program?.title || "Application", status: app.status, stage: app.stage, submittedAt: app.createdAt.toISOString() }))}
          drafts={parentDrafts.map((draft) => ({ programId: draft.programId, updatedAt: draft.updatedAt.toISOString() }))}
          students={linkedStudents.map((student) => ({ id: student.id, name: student.name || student.email, ongoing: student.enrollments.filter((e: any) => e.status === "ONGOING").length, upcoming: student.enrollments.filter((e: any) => e.status === "ACCEPTED").length, completed: student.enrollments.filter((e: any) => e.status === "PAST").length, current: student.enrollments.find((e: any) => e.status === "ONGOING")?.program.title || null }))}
        />
      )}
      {isStudent && (
        <Suspense fallback={<div>Loading dashboard overview...</div>}>
          <StudentDashboard 
            name={name} 
            unreadCount={unreadCount}
            activePrograms={activePrograms}
            totalApplications={totalApplications}
            pendingApplications={pendingApplicationsData}
            pendingAssignments={pendingAssignmentsData}
            upcomingEvents={upcomingEventsData}
          />
        </Suspense>
      )}
    </div>
  );
}
