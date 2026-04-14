"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ClipboardCheck } from "lucide-react";

export default function UserApplicationsList({ applications }: { applications: any[] }) {
  if (!applications || applications.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 text-sm">
        <ClipboardCheck className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        This user has not submitted any applications.
      </div>
    );
  }

  return (
    <div className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Program</th>
              <th className="px-6 py-3">Submitted</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Current Step</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {applications.map(app => {
              const currentStepIndex = app.steps?.findIndex((s: any) => s.status === 'IN_PROGRESS' || s.status === 'UPCOMING');
              const currentStep = currentStepIndex !== -1 && app.steps ? app.steps[currentStepIndex] : null;

              return (
                <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">
                    <div className="max-w-[200px] truncate" title={app.program.title}>
                      {app.program.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {format(new Date(app.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider ${
                      app.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : 
                      app.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {currentStep ? (
                      <span className="text-[11px] font-semibold text-blue-600 uppercase">{currentStep.title}</span>
                    ) : (
                      <span className="text-[11px] font-semibold text-green-600 uppercase">All Steps Complete</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-center">
         <Link href="/dashboard/applications-admin" className="text-xs font-bold text-orange-600 hover:text-orange-800 transition-colors">
            Manage steps in Application Management →
         </Link>
      </div>
    </div>
  );
}
