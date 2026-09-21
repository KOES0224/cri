import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { GraduationCap, ChevronRight, BookOpen } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ParentLayout from "../_components/ParentLayout";
import { LinkStudentForm, UnlinkStudentButton } from "./LinkStudentForm";

export const dynamic = "force-dynamic";

const enrollmentBadge: Record<string, string> = { ONGOING: "bg-green-100 text-green-800", ACCEPTED: "bg-blue-100 text-blue-800", PAST: "bg-gray-100 text-gray-600" };
const enrollmentLabel: Record<string, string> = { ONGOING: "In progress", ACCEPTED: "Upcoming", PAST: "Completed" };

export default async function LinkedStudentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "PARENT") redirect("/dashboard");

  const students = await prisma.user.findMany({
    where: { parentId: session.user.id },
    select: {
      id: true, name: true, email: true, studentCode: true,
      enrollments: { select: { id: true, status: true, midGrade: true, finalGrade: true, program: { select: { title: true } } }, orderBy: { createdAt: "desc" } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <ParentLayout>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-medium tracking-tight text-gray-900 flex items-center">
            <GraduationCap className="h-5 w-5 mr-2 text-purple-600" />
            Linked Students
          </h3>
          <p className="text-sm text-gray-500 mt-1">Students linked to this account. You can follow each one's programs, assignments and feedback.</p>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          <LinkStudentForm />

          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30 px-6">
              <p className="text-gray-900 font-medium">No linked students yet</p>
              <p className="text-sm text-gray-500 mt-1 max-w-md">Enter your student's code above. If you applied on their behalf, admissions links the student account for you once the application is accepted.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {students.map((student) => (
                <li key={student.id} className="rounded-2xl border border-gray-200 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-gray-900">{student.name || student.email}</p>
                      <p className="text-xs text-gray-500">{student.email}{student.studentCode ? <span className="ml-2 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{student.studentCode}</span> : null}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link href={`/dashboard/linked/${student.id}`} className="inline-flex items-center text-sm font-semibold text-purple-700 hover:underline">
                        View progress <ChevronRight className="h-4 w-4 ml-0.5" />
                      </Link>
                      <UnlinkStudentButton studentId={student.id} studentName={student.name || student.email} />
                    </div>
                  </div>
                  {student.enrollments.length === 0 ? (
                    <p className="mt-4 text-sm text-gray-500 flex items-center"><BookOpen className="h-4 w-4 mr-2 text-gray-400" /> No programs yet.</p>
                  ) : (
                    <ul className="mt-4 divide-y divide-gray-100">
                      {student.enrollments.map((enrollment) => (
                        <li key={enrollment.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                          <span className="text-gray-800">{enrollment.program.title}</span>
                          <span className="flex items-center gap-3">
                            {enrollment.finalGrade ? <span className="text-xs text-gray-500">Final: <strong className="text-gray-900">{enrollment.finalGrade}</strong></span> : enrollment.midGrade ? <span className="text-xs text-gray-500">Mid: <strong className="text-gray-900">{enrollment.midGrade}</strong></span> : null}
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${enrollmentBadge[enrollment.status] || "bg-gray-100 text-gray-600"}`}>{enrollmentLabel[enrollment.status] || enrollment.status}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ParentLayout>
  );
}
