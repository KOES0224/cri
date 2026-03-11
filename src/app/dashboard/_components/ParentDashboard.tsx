"use client";

import Link from "next/link";
import { Users, GraduationCap, LayoutDashboard } from "lucide-react";

export default function ParentDashboard({ name }: { name: string }) {
  return (
    <>
      <div className="mb-8 flex md:flex-row flex-col justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome, {name}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Monitor your student's progress and active applications.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            Parent Portal
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 mr-4">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Linked Students</h2>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
             <p className="text-gray-500 text-sm mb-4">You have not linked any student accounts yet.</p>
             <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
               Link Student Account
             </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 mr-4">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Academic Overview</h2>
          </div>
          <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100 h-32 flex items-center justify-center">
            <p className="text-gray-400 text-sm">Link a student to see their research progress.</p>
          </div>
        </div>
      </div>

    </>
  );
}
