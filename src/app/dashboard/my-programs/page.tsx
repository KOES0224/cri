import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, ExternalLink, GraduationCap, ChevronRight } from "lucide-react";
import StudentLayout from "../_components/StudentLayout";
import { prisma } from "@/lib/prisma";

export default async function MyProgramsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  // Fetch all enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: { 
      userId: session.user.id
    },
    include: { program: true },
    orderBy: { createdAt: 'desc' }
  });

  const ongoing = enrollments.filter(e => e.status === "ONGOING");
  const upcoming = enrollments.filter(e => e.status === "ACCEPTED");
  const past = enrollments.filter(e => e.status === "PAST");

  const EnrollmentCard = ({ enr, statusLabel, colorClass, bgClass }: { enr: any, statusLabel: string, colorClass: string, bgClass: string }) => (
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
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${bgClass} ${colorClass}`}>
          {statusLabel}
        </span>
      </div>
      
      <div className="p-6">
        <p className="text-gray-600 text-sm mb-6 line-clamp-2">{enr.program.description}</p>
        
        {statusLabel !== "Upcoming" && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6 flex space-x-6">
            <div>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block mb-1">Midterm</span>
              <span className="text-sm font-bold text-gray-900">{enr.midGrade || "N/A"}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block mb-1">Final</span>
              <span className="text-sm font-bold text-gray-900">{enr.finalGrade || "N/A"}</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <Link href="/dashboard/messages" className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors shadow-sm">
            Message Peers
          </Link>
          <Link href={`/dashboard/my-programs/${enr.id}`} className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
            View Details <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <StudentLayout>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
           <h3 className="text-lg font-medium tracking-tight text-gray-900 flex items-center">
             <BookOpen className="h-5 w-5 mr-2 text-green-600" />
             My Programs
           </h3>
           <p className="text-sm text-gray-500 mt-1">Access your course materials, assignments, and program details.</p>
        </div>
        
        <div className="p-8">
           {enrollments.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                <BookOpen className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-900 font-medium">No Enrolled Programs</p>
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
             <div className="space-y-12">
                {ongoing.length > 0 && (
                  <section>
                    <h4 className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-4 pl-2 border-l-4 border-green-500">Ongoing Programs</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {ongoing.map(enr => <EnrollmentCard key={enr.id} enr={enr} statusLabel="Ongoing" colorClass="text-green-800" bgClass="bg-green-100" />)}
                    </div>
                  </section>
                )}

                {upcoming.length > 0 && (
                  <section>
                    <h4 className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-4 pl-2 border-l-4 border-indigo-500">Upcoming Programs</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {upcoming.map(enr => <EnrollmentCard key={enr.id} enr={enr} statusLabel="Upcoming" colorClass="text-indigo-800" bgClass="bg-indigo-100" />)}
                    </div>
                  </section>
                )}

                {past.length > 0 && (
                  <section>
                    <h4 className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-4 pl-2 border-l-4 border-gray-400">Past Programs</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {past.map(enr => <EnrollmentCard key={enr.id} enr={enr} statusLabel="Completed" colorClass="text-gray-800" bgClass="bg-gray-100" />)}
                    </div>
                  </section>
                )}
             </div>
           )}
        </div>
      </div>
    </StudentLayout>
  );
}
