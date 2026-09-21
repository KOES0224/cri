import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, BookOpen, Clock, CheckCircle, MessageSquareText } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ParentLayout from "../../_components/ParentLayout";

export const dynamic = "force-dynamic";

const statusBadge: Record<string, string> = { SUBMITTED: "bg-blue-100 text-blue-800", GRADED: "bg-green-100 text-green-800", PENDING: "bg-orange-100 text-orange-800" };

/** Read-only view of a linked student's programs, assignments, grades and feedback for the guardian. */
export default async function LinkedStudentProgressPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "PARENT") redirect("/dashboard");

  const student = await prisma.user.findFirst({
    where: { id: studentId, parentId: session.user.id },
    select: {
      id: true, name: true, email: true, studentCode: true,
      enrollments: {
        include: {
          program: { select: { title: true, category: true, startDate: true, endDate: true } },
          submissions: { include: { assignment: true }, orderBy: { assignment: { dueDate: "asc" } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!student) redirect("/dashboard/linked");

  return (
    <ParentLayout>
      <div className="mb-6">
        <Link href="/dashboard/linked" className="text-sm font-medium text-gray-500 hover:text-gray-900 inline-flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" /> Linked students
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{student.name || student.email}</h1>
        <p className="mt-1 text-sm text-gray-500">{student.email}{student.studentCode ? ` · code ${student.studentCode}` : ""}</p>
      </div>

      {student.enrollments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-sm text-gray-500">
          <BookOpen className="h-8 w-8 mx-auto mb-3 text-gray-300" />
          No programs yet. Once admissions enrolls this student, the program, assignments and feedback appear here.
        </div>
      ) : (
        <div className="space-y-8">
          {student.enrollments.map((enrollment) => (
            <section key={enrollment.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 uppercase tracking-wide">{enrollment.program.category}</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${enrollment.status === "ONGOING" ? "bg-green-100 text-green-800" : enrollment.status === "ACCEPTED" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}>
                    {enrollment.status === "ACCEPTED" ? "Upcoming" : enrollment.status === "ONGOING" ? "In progress" : "Completed"}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{enrollment.program.title}</h2>
                <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div><dt className="text-xs text-gray-500">Midterm</dt><dd className="font-semibold text-gray-900">{enrollment.midGrade || "—"}</dd></div>
                  <div><dt className="text-xs text-gray-500">Final</dt><dd className="font-semibold text-gray-900">{enrollment.finalGrade || "—"}</dd></div>
                  <div><dt className="text-xs text-gray-500">Recommendation letter</dt><dd className="font-semibold text-gray-900">{enrollment.recommendationCompleted ? "Completed" : enrollment.recommendationRequested ? "Requested" : "—"}</dd></div>
                  <div><dt className="text-xs text-gray-500">Assignments</dt><dd className="font-semibold text-gray-900">{enrollment.submissions.filter((s) => s.status !== "PENDING").length} / {enrollment.submissions.length} submitted</dd></div>
                </dl>
              </div>

              <div className="p-6 sm:p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-blue-500" /> Assignments &amp; feedback</h3>
                {enrollment.submissions.length === 0 ? (
                  <p className="text-sm text-gray-500">No assignments posted yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {enrollment.submissions.map((submission) => (
                      <li key={submission.id} className="rounded-xl border border-gray-200 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-900">{submission.assignment.title}</p>
                            {submission.assignment.description && <p className="text-sm text-gray-500 mt-0.5">{submission.assignment.description}</p>}
                            <p className="text-xs text-gray-500 mt-2 flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> Due {new Date(submission.assignment.dueDate).toLocaleDateString("en-US")}{submission.submittedAt ? ` · submitted ${new Date(submission.submittedAt).toLocaleDateString("en-US")}` : ""}</p>
                          </div>
                          <div className="flex flex-col items-start sm:items-end gap-1">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${statusBadge[submission.status] || "bg-gray-100 text-gray-600"}`}>{submission.status}</span>
                            {submission.grade && <span className="text-sm font-bold text-gray-900">Grade: {submission.grade}</span>}
                          </div>
                        </div>
                        {submission.feedback && (
                          <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-950 flex gap-2">
                            <MessageSquareText className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
                            <p className="whitespace-pre-wrap">{submission.feedback}</p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </ParentLayout>
  );
}
