import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Clock, ExternalLink, BookOpen } from "lucide-react";
import StudentLayout from "../_components/StudentLayout";

export default async function ApplicationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Normally we would fetch applications from Prisma here
  const applications: any[] = []; // Using empty array for mock UI

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
                 {/* List rendered here if applications array had items */}
               </ul>
             </div>
           )}
        </div>
      </div>
    </StudentLayout>
  );
}
