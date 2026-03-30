import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, CheckCircle, ExternalLink, GraduationCap } from "lucide-react";
import StudentLayout from "../../_components/StudentLayout";
import { prisma } from "@/lib/prisma";

export default async function ProgramDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { 
      id: params.id,
      userId: session.user.id
    },
    include: { 
      program: true,
      submissions: {
        include: { assignment: true },
        orderBy: { assignment: { dueDate: 'asc' } }
      }
    }
  });

  if (!enrollment) {
    redirect("/dashboard/my-programs");
  }

  const { program, submissions } = enrollment;

  return (
    <StudentLayout>
      <div className="mb-6">
        <Link href="/dashboard/my-programs" className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center inline-flex">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Programs
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8 md:p-10 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-4">
               <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 tracking-wide uppercase">
                 {program.category}
               </span>
               <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${enrollment.status === 'ONGOING' ? 'bg-green-100 text-green-800' : enrollment.status === 'ACCEPTED' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'}`}>
                 {enrollment.status === 'ACCEPTED' ? 'Upcoming' : enrollment.status}
               </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              {program.title}
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">
              {program.description}
            </p>
          </div>
          
          <div className="absolute -right-20 -bottom-20 opacity-5">
            <BookOpen className="w-96 h-96" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
           
           <div className="p-8 lg:p-10 lg:col-span-2">
             <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-6 flex items-center">
               <CheckCircle className="w-6 h-6 mr-3 text-blue-500" />
               Assignments & Deliverables
             </h3>
             
             {submissions.length === 0 ? (
               <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center">
                 <p className="text-gray-500 text-sm">No assignments posted for this program yet.</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {submissions.map((sub) => (
                   <div key={sub.id} className="bg-white border text-left border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:shadow-md transition-shadow group">
                     <div>
                       <h4 className="font-bold text-gray-900">{sub.assignment?.title}</h4>
                       <p className="text-sm text-gray-500 mt-1 line-clamp-1">{sub.assignment?.description}</p>
                       <div className="flex items-center mt-3 text-xs font-medium text-gray-500 space-x-4">
                         <span className="flex items-center">
                           <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                           Due: {sub.assignment?.dueDate ? new Date(sub.assignment.dueDate).toLocaleDateString() : 'N/A'}
                         </span>
                       </div>
                     </div>
                     <div className="mt-4 sm:mt-0 flex flex-col items-end">
                       <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
                         sub.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                         sub.status === 'GRADED' ? 'bg-green-100 text-green-800' :
                         'bg-orange-100 text-orange-800'
                       }`}>
                         {sub.status}
                       </span>
                       {sub.status === 'GRADED' && (
                         <span className="text-sm font-bold text-gray-900">Grade: {sub.grade}</span>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>

           <div className="p-8 lg:p-10 bg-gray-50/50">
             <h3 className="text-lg font-bold tracking-tight text-gray-900 mb-6 flex items-center">
               <GraduationCap className="w-5 h-5 mr-3 text-purple-500" />
               Academic Profile
             </h3>
             
             <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Midterm Progress</span>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Grade</span>
                    <span className="text-lg font-extrabold text-gray-900">{enrollment.midGrade || "N/A"}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Final Evaluation</span>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Grade</span>
                    <span className="text-lg font-extrabold text-gray-900">{enrollment.finalGrade || "N/A"}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3">Course Materials</span>
                  {enrollment.homeworkUrls ? (
                     <a href={enrollment.homeworkUrls} target="_blank" rel="noreferrer" className="flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white transition-colors rounded-xl p-4 shadow-sm group">
                       <span className="text-sm font-bold">Access Shared Drive</span>
                       <ExternalLink className="w-4 h-4 transform group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                     </a>
                  ) : (
                     <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                       <p className="text-sm text-gray-500 font-medium">No materials linked yet.</p>
                     </div>
                  )}
                </div>
             </div>
           </div>
        </div>
      </div>
    </StudentLayout>
  );
}
