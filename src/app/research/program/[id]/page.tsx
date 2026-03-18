import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Users, MapPin, Tag, ChevronRight, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

// Force dynamic rendering since we are fetching from DB
export const dynamic = "force-dynamic";

export default async function ProgramDetailsPage({ params }: { params: { id: string } }) {
  const program = await prisma.program.findUnique({
    where: { id: params.id }
  });

  if (!program) {
    notFound();
  }

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <Link href={`/research/${program.category}`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Programs
        </Link>
        
        <div className="grid lg:grid-cols-3 gap-12">
           {/* Main Content Area */}
           <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-6">
                 {program.status === "OPEN" ? (
                   <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full flex items-center">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span> Applications Open
                   </span>
                 ) : (
                   <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-full">
                     Closed
                   </span>
                 )}
                 <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full">
                   {program.category}
                 </span>
                 {program.subCategory && (
                   <span className="text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-1 rounded-full bg-white">
                     {program.subCategory}
                   </span>
                 )}
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter mb-8 leading-tight">
                {program.title}
              </h1>
              
              <div className="prose prose-lg prose-gray max-w-none mb-12">
                 <p className="text-xl text-gray-600 leading-relaxed font-medium mb-8">
                   {program.description}
                 </p>
                 
                 <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-12">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Program Overview</h3>
                    <div className="space-y-6">
                       <div className="flex items-start">
                          <CheckCircle2 className="h-6 w-6 text-blue-500 mr-4 shrink-0 mt-0.5" />
                          <div>
                             <h4 className="font-bold text-gray-900 text-lg">Rigorous Methodology</h4>
                             <p className="text-gray-600 mt-1">Develop advanced data collection and analysis skills under strict academic standards.</p>
                          </div>
                       </div>
                       <div className="flex items-start">
                          <CheckCircle2 className="h-6 w-6 text-blue-500 mr-4 shrink-0 mt-0.5" />
                          <div>
                             <h4 className="font-bold text-gray-900 text-lg">Publication Output</h4>
                             <p className="text-gray-600 mt-1">Goal-driven environment focused on producing a paper ready for peer-reviewed journal submission.</p>
                          </div>
                       </div>
                       <div className="flex items-start">
                          <CheckCircle2 className="h-6 w-6 text-blue-500 mr-4 shrink-0 mt-0.5" />
                          <div>
                             <h4 className="font-bold text-gray-900 text-lg">Expert Mentorship</h4>
                             <p className="text-gray-600 mt-1">Direct feedback and ongoing guidance from scholars active at top global institutions.</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
           
           {/* Sidebar */}
           <div className="lg:col-span-1">
              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl sticky top-32">
                 <h3 className="text-xl font-bold text-gray-900 mb-6">Program Details</h3>
                 
                 <div className="space-y-6 mb-8">
                    <div className="flex items-center text-gray-700">
                       <Calendar className="h-5 w-5 mr-4 text-blue-600 shrink-0" />
                       <div>
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Duration</p>
                         <p className="font-medium">
                           {program.startDate ? format(new Date(program.startDate), 'MMM d, yyyy') : 'TBA'} 
                           {program.endDate ? ` - ${format(new Date(program.endDate), 'MMM d, yyyy')}` : ''}
                         </p>
                       </div>
                    </div>
                    
                    <div className="h-px bg-gray-100 w-full" />
                    
                    <div className="flex items-center text-gray-700">
                       <Users className="h-5 w-5 mr-4 text-blue-600 shrink-0" />
                       <div>
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Capacity</p>
                         <p className="font-medium">Limited Cohort</p>
                       </div>
                    </div>
                    
                    <div className="h-px bg-gray-100 w-full" />
                    
                    <div className="flex items-center text-gray-700">
                       <MapPin className="h-5 w-5 mr-4 text-blue-600 shrink-0" />
                       <div>
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location Format</p>
                         <p className="font-medium uppercase">{program.category === 'seoul' ? 'On-Campus (Seoul)' : 'Remote / Hybrid'}</p>
                       </div>
                    </div>
                 </div>
                 
                 {program.status === 'OPEN' ? (
                   <Link href={`/apply?programId=${program.id}`} className="block w-full h-14 bg-blue-600 text-white rounded-2xl text-center font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-blue-500/30 flex items-center justify-center group/btn shine-effect">
                     Apply for Program
                     <ChevronRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                   </Link>
                 ) : (
                   <div className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl text-center font-bold text-lg border border-gray-200">
                     Applications Closed
                   </div>
                 )}
                 <p className="text-center text-xs text-gray-400 mt-4 px-4">
                   Admission is highly selective and evaluated on a rolling basis.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
