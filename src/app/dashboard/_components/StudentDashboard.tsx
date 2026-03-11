"use client";

import Link from "next/link";
import { FileText, MessageSquare, BookOpen, Clock } from "lucide-react";

export default function StudentDashboard({ name }: { name: string }) {
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-xl bg-orange-50 text-orange-600 mr-4">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Apps</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-xl bg-green-50 text-green-600 mr-4">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Programs</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 mr-4">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Unread Messages</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Applications Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-black h-fit">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-medium tracking-tight flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-400" />
              Recent Applications
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
            <p>No new messages from professors right now.</p>
          </div>
        </section>
      </div>
    </>
  );
}
