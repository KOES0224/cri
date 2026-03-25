import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Clock, ExternalLink, CheckCircle2, ChevronRight, XCircle, AlertCircle } from "lucide-react";
import StudentLayout from "../_components/StudentLayout";
import { prisma } from "@/lib/prisma";

export default async function ApplicationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Fetch applications from Prisma natively
  const applications = await prisma.application.findMany({
    where: { userId: session.user.id },
    include: { program: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <StudentLayout>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
           <div>
             <h3 className="text-lg font-medium tracking-tight text-gray-900 flex items-center">
               <FileText className="h-5 w-5 mr-2 text-orange-600" />
               My Applications
             </h3>
             <p className="text-sm text-gray-500 mt-1">Track the status of your research program applications.</p>
           </div>
        </div>
        
        <div className="p-8">
           {applications.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                <Clock className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-900 font-medium">No Applications Yet</p>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mb-6">You haven't applied to any CRI research programs. Browse our offerings to find a mentor matching your interests.</p>
                <Link href="/research" className="flex items-center px-6 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                  Explore Programs
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Link>
             </div>
           ) : (
             <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
               <ul role="list" className="divide-y divide-gray-100">
                 {applications.map((app) => (
                   <li key={app.id} className="p-6">
                     <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                       <div>
                         <h4 className="text-lg font-bold text-gray-900">{app.program?.title || "Application"}</h4>
                         <p className="text-sm text-gray-500 mt-1">Submitted on {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "Unknown Date"}</p>
                       </div>
                       <div className="mt-4 md:mt-0">
                         {app.status === 'ACCEPTED' && (
                           <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                             <CheckCircle2 className="w-4 h-4 mr-1.5" /> Enrolled
                           </span>
                         )}
                         {app.status === 'REJECTED' && (
                           <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                             <XCircle className="w-4 h-4 mr-1.5" /> Declined
                           </span>
                         )}
                         {app.status === 'PENDING' && (
                           <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                             <AlertCircle className="w-4 h-4 mr-1.5" /> Under Review
                           </span>
                         )}
                       </div>
                     </div>

                     {/* Visual Tracker */}
                     <div className="relative pt-4">
                       <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-100">
                         <div style={{ width: app.status === 'ACCEPTED' ? '100%' : app.status === 'REJECTED' ? '100%' : `${(app.step / 3) * 100}%` }} className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${app.status === 'ACCEPTED' ? 'bg-green-500' : app.status === 'REJECTED' ? 'bg-red-500' : 'bg-blue-600'}`}></div>
                       </div>
                       <div className="flex justify-between text-xs font-medium text-gray-500 uppercase tracking-wide px-1">
                          <span className={`${app.step >= 1 ? 'text-blue-600 font-bold' : ''}`}>Received</span>
                          <span className={`text-center ${app.step >= 2 ? 'text-blue-600 font-bold' : ''}`}>Interview</span>
                          <span className={`text-right ${app.status === 'ACCEPTED' ? 'text-green-600 font-bold' : app.status === 'REJECTED' ? 'text-red-600 font-bold' : app.step >= 3 ? 'text-blue-600 font-bold' : ''}`}>Decision</span>
                       </div>
                     </div>
                   </li>
                 ))}
               </ul>
             </div>
           )}
        </div>
      </div>
    </StudentLayout>
  );
}
