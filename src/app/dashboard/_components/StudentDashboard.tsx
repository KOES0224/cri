"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, MessageSquare, BookOpen, Clock, Calendar, ChevronRight, X } from "lucide-react";

export default function StudentDashboard({ 
  name, 
  unreadCount, 
  activePrograms, 
  pendingApplications,
  pendingAssignments,
  upcomingEvents
}: { 
  name: string;
  unreadCount: number;
  activePrograms: number;
  pendingApplications: any[];
  pendingAssignments: any[];
  upcomingEvents: any[];
}) {
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const totalPending = pendingApplications.length + pendingAssignments.length;
  return (
    <>
      <div className="mb-8 flex md:flex-row flex-col justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome back, {name}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Here is what's happening with your research applications today.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Student Portal
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <button 
          onClick={() => setIsPendingModalOpen(true)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:border-orange-200 hover:shadow-md transition-all group text-left w-full"
        >
          <div className="p-3 rounded-xl bg-orange-50 text-orange-600 mr-4 group-hover:bg-orange-100 transition-colors">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Tasks</p>
            <p className="text-2xl font-bold text-gray-900">{totalPending}</p>
          </div>
        </button>
        <Link href="/dashboard/my-programs" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:border-green-200 hover:shadow-md transition-all group">
          <div className="p-3 rounded-xl bg-green-50 text-green-600 mr-4 group-hover:bg-green-100 transition-colors">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">My Programs</p>
            <p className="text-2xl font-bold text-gray-900">{activePrograms}</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Applications Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-black h-fit">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-medium tracking-tight flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-400" />
              My Applications
            </h3>
            <Link href="/dashboard/applications" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all
            </Link>
          </div>
          <div className="p-6 text-center text-gray-500 text-sm">
            <p>You have not applied for any programs yet.</p>
            <Link href="/research" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium justify-center rounded-md text-white bg-black hover:bg-gray-800 transition-colors w-full sm:w-auto">
              Browse Programs
            </Link>
          </div>
        </section>

        {/* Messages Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-black h-fit">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-medium tracking-tight flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-gray-400" />
              Recent Messages
            </h3>
            <Link href="/dashboard/messages" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Inbox
            </Link>
          </div>
          <div className="p-6 text-center text-gray-500 text-sm">
            {unreadCount > 0 ? (
              <div className="flex flex-col items-center justify-center space-y-3 animate-in fade-in">
                <p className="font-semibold text-gray-900">You have {unreadCount} unread message{unreadCount > 1 ? 's' : ''}!</p>
                <Link href="/dashboard/messages" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition">
                  Open Inbox
                </Link>
              </div>
            ) : (
              <p>No new messages right now.</p>
            )}
          </div>
        </section>
      </div>
        {/* Events Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-black h-fit md:col-span-2">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-medium tracking-tight flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-400" />
              Upcoming Events
            </h3>
            <Link href="/blog" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all
            </Link>
          </div>
          <div className="p-0">
            {upcomingEvents.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {upcomingEvents.map((event) => {
                  const today = new Date();
                  const eventDate = new Date(event.eventDate);
                  const diffTime = Math.abs(eventDate.getTime() - today.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return (
                    <li key={event.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                      <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{event.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{eventDate.toLocaleDateString()}</p>
                      </div>
                      <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-bold bg-indigo-50 text-indigo-700 whitespace-nowrap">
                        D-{diffDays}
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                <p>No upcoming events at this time.</p>
              </div>
            )}
          </div>
        </section>

      {/* Pending Tasks Modal */}
      {isPendingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-orange-500" />
                Pending Tasks
              </h3>
              <button onClick={() => setIsPendingModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {totalPending === 0 ? (
                <div className="text-center py-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
                    <Clock className="w-8 h-8 text-green-500" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900">You're all caught up!</h4>
                  <p className="text-gray-500 mt-2 text-sm">There are no pending applications or assignments at this time.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Applications */}
                  {pendingApplications.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center">
                        <FileText className="w-4 h-4 mr-2" /> Applications ({pendingApplications.length})
                      </h4>
                      <div className="space-y-3">
                        {pendingApplications.map((app) => (
                          <Link href={`/dashboard/applications`} key={app.id} onClick={() => setIsPendingModalOpen(false)} className="block bg-gray-50 rounded-xl p-4 hover:bg-gray-100 border border-gray-100 transition-colors">
                            <h5 className="font-semibold text-gray-900 text-sm">{app.program?.title || "Program Application"}</h5>
                            <p className="text-xs text-gray-500 mt-1">Status: Under Review</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assignments */}
                  {pendingAssignments.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center">
                        <BookOpen className="w-4 h-4 mr-2" /> Assignments ({pendingAssignments.length})
                      </h4>
                      <div className="space-y-3">
                        {pendingAssignments.map((sub) => (
                          <Link href={`/dashboard/my-programs/${sub.enrollmentId}`} key={sub.id} onClick={() => setIsPendingModalOpen(false)} className="block bg-gray-50 rounded-xl p-4 hover:bg-gray-100 border border-gray-100 transition-colors">
                            <h5 className="font-semibold text-gray-900 text-sm">{sub.assignment?.title || "Pending Assignment"}</h5>
                            <p className="text-xs text-orange-600 font-medium mt-1">Due: {new Date(sub.assignment?.dueDate).toLocaleDateString()}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
              <button onClick={() => setIsPendingModalOpen(false)} className="text-sm font-medium text-gray-600 hover:text-gray-900">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
