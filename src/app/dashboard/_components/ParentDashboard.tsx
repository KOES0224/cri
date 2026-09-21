"use client";

import Link from "next/link";
import { GraduationCap, LayoutDashboard, FileText, ArrowRight, Send } from "lucide-react";

type ParentApplication = { id: string; title: string; status: string; stage: string; submittedAt: string };
type ParentDraft = { programId: string; updatedAt: string };
type LinkedStudent = { id: string; name: string; ongoing: number; upcoming: number; completed: number; current: string | null };

function statusLabel(app: ParentApplication) {
  if (app.status === "ACCEPTED") return { text: app.stage === "ENROLLED" ? "Registered" : "Accepted · registration pending", cls: "bg-green-100 text-green-800" };
  if (app.status === "REJECTED") return { text: "Declined", cls: "bg-red-100 text-red-800" };
  return { text: "Under review", cls: "bg-orange-100 text-orange-800" };
}

export default function ParentDashboard({ name, applications = [], drafts = [], students = [] }: { name: string; applications?: ParentApplication[]; drafts?: ParentDraft[]; students?: LinkedStudent[] }) {
  const ongoing = students.reduce((sum, s) => sum + s.ongoing, 0);
  return (
    <>
      <div className="mb-8 flex md:flex-row flex-col justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome, {name}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Apply on behalf of your student and follow each application here.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            Parent Portal
          </span>
          <Link href="/research#open-programs" className="inline-flex items-center px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors">
            <Send className="h-4 w-4 mr-2" /> Apply for a student
          </Link>
        </div>
      </div>

      {/* Applications submitted from this account */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="p-3 rounded-xl bg-orange-50 text-orange-600 mr-4">
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Applications</h2>
          </div>
          {applications.length > 0 && (
            <Link href="/dashboard/applications" className="text-sm font-semibold text-blue-700 hover:underline inline-flex items-center">
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          )}
        </div>

        {drafts.length > 0 && (
          <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm">
            <p className="font-semibold text-gray-900">Unfinished draft{drafts.length > 1 ? "s" : ""}</p>
            <ul className="mt-2 space-y-1">
              {drafts.map((draft) => (
                <li key={draft.programId}>
                  <Link href={`/apply?programId=${encodeURIComponent(draft.programId)}`} className="text-blue-700 underline">Continue application</Link>
                  <span className="ml-2 text-xs text-gray-500">Saved {new Date(draft.updatedAt).toLocaleDateString("en-US")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {applications.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
            <p className="text-gray-500 text-sm mb-4">No applications have been submitted from this account yet.</p>
            <Link href="/research#open-programs" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              See programs accepting applications
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {applications.map((app) => {
              const label = statusLabel(app);
              return (
                <li key={app.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{app.title}</p>
                    <p className="text-xs text-gray-500">Submitted {new Date(app.submittedAt).toLocaleDateString("en-US")}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${label.cls}`}>{label.text}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 mr-4">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Linked Students</h2>
          </div>
          {students.length === 0 ? (
            <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
              <p className="text-gray-500 text-sm mb-4">No students linked yet. Enter your student's 8-digit code to see their programs and feedback.</p>
              <Link href="/dashboard/linked" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">Link a student</Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {students.map((student) => (
                <li key={student.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.current ? `In progress: ${student.current}` : student.upcoming ? `${student.upcoming} upcoming program${student.upcoming > 1 ? "s" : ""}` : student.completed ? `${student.completed} completed` : "No programs yet"}</p>
                  </div>
                  <Link href={`/dashboard/linked/${student.id}`} className="text-sm font-semibold text-purple-700 hover:underline inline-flex items-center">Progress <ArrowRight className="h-4 w-4 ml-1" /></Link>
                </li>
              ))}
              <li className="pt-3"><Link href="/dashboard/linked" className="text-sm text-gray-500 hover:text-gray-900 underline">Manage linked students</Link></li>
            </ul>
          )}
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 mr-4">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Academic Overview</h2>
          </div>
          {ongoing === 0 ? (
            <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100 h-32 flex items-center justify-center">
              <p className="text-gray-400 text-sm">Program progress appears here once a linked student is enrolled.</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <p className="text-4xl font-black text-gray-900">{ongoing}</p>
              <p className="text-sm text-gray-500 mt-1">program{ongoing > 1 ? "s" : ""} in progress across {students.length} linked student{students.length > 1 ? "s" : ""}. Open a student to see assignments, grades and mentor feedback.</p>
            </div>
          )}
        </div>
      </div>

    </>
  );
}
