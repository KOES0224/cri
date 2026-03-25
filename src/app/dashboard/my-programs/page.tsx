import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Calendar, ExternalLink, GraduationCap, Link2 } from "lucide-react";
import StudentLayout from "../_components/StudentLayout";
import { prisma } from "@/lib/prisma";

export default async function MyProgramsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Fetch active enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: { 
      userId: session.user.id,
      status: "ONGOING"
    },
    include: { program: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <StudentLayout>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
           <div>
             <h3 className="text-lg font-medium tracking-tight text-gray-900 flex items-center">
               <BookOpen className="h-5 w-5 mr-2 text-green-600" />
               Active Programs
             </h3>
             <p className="text-sm text-gray-500 mt-1">Access your course materials, grades, and program details.</p>
           </div>
        </div>
        
        <div className="p-8">
           {enrollments.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                <BookOpen className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-900 font-medium">No Active Programs</p>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mb-6">You are not currently enrolled in any CRI programs. View your applications or explore new offerings.</p>
                <div className="flex space-x-4">
                  <Link href="/dashboard/applications" className="flex items-center px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    View Applications
                  </Link>
                  <Link href="/research" className="flex items-center px-6 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
                    Explore
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </div>
             </div>
           ) : (
             <div className="grid grid-cols-1 gap-6">
                {enrollments.map((enr) => (
                  <div key={enr.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/30">
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {enr.program.category}
                          </span>
                          {enr.program.subCategory && (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                               {enr.program.subCategory}
                             </span>
                          )}
                        </div>
                        <h4 className="text-xl font-bold text-gray-900">{enr.program.title}</h4>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Ongoing
                      </span>
                    </div>
                    
                    <div className="p-6">
                      <p className="text-gray-600 text-sm mb-6">{enr.program.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Status & Grades */}
                        <div className="space-y-4">
                          <h5 className="text-sm font-bold tracking-wide text-gray-900 uppercase flex items-center">
                            <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                            Academic Standing
                          </h5>
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm text-gray-500 font-medium">Midterm Grade</span>
                              <span className="text-sm font-bold text-gray-900">{enr.midGrade || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500 font-medium">Final Grade</span>
                              <span className="text-sm font-bold text-gray-900">{enr.finalGrade || "N/A"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Course Materials */}
                        <div className="space-y-4">
                          <h5 className="text-sm font-bold tracking-wide text-gray-900 uppercase flex items-center">
                            <Link2 className="h-4 w-4 mr-2 text-gray-400" />
                            Course Materials
                          </h5>
                          {enr.homeworkUrls ? (
                            <a href={enr.homeworkUrls} target="_blank" rel="noreferrer" className="flex items-center justify-between bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors rounded-xl p-4 border border-blue-100 group">
                              <span className="text-sm font-semibold">Access Shared Drive</span>
                              <ExternalLink className="h-4 w-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </a>
                          ) : (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                              <p className="text-sm text-gray-500">No materials linked yet.</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                        <Link href="/dashboard/messages" className="inline-flex items-center px-5 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
                          Message Class Peers
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      </div>
    </StudentLayout>
  );
}
