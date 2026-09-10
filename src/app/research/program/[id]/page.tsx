import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Users, MapPin, Tag, ChevronRight, CheckCircle2, CreditCard } from "lucide-react";
import { admissionState, admissionLabel, programFacts, programHref, programDate } from "@/lib/program-policy";
import ResearchGuide from "@/components/ResearchGuide";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import ApplyButton from "./ApplyButton";

// Force dynamic rendering since we are fetching from DB
export const dynamic = "force-dynamic";

export default async function ProgramDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const program = await prisma.program.findUnique({
    where: { id: resolvedParams.id },
    include: { professors: true }
  });

  if (!program || !program.isPublished) {
    notFound();
  }

  const facts = programFacts(program);
  const open = admissionState(program) === "OPEN";
  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-36 lg:pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <Link href={programHref(program.category)} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Programs
        </Link>
        
        <div className="grid lg:grid-cols-3 gap-12">
           {/* Main Content Area */}
           <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-6">
                 {open ? (
                   <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full flex items-center">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span> Applications Open
                   </span>
                 ) : (
                   <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-full">
                     {admissionLabel(program)}
                   </span>
                 )}
                 <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full">
                   {facts.name}
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
                             <p className="text-gray-600 mt-1">Students author their own research manuscript. Journal submission and acceptance are separate steps, not guaranteed outcomes.</p>
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

                 <ResearchGuide category={program.category} />
                 {program.content && (
                   <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm mb-12 prose prose-lg prose-gray max-w-none prose-headings:font-black prose-headings:text-gray-900 prose-a:text-blue-600 hover:prose-a:text-blue-500 prose-img:rounded-2xl prose-img:shadow-sm prose-hr:border-gray-100 prose-table:border-collapse prose-th:bg-gray-50 prose-th:p-4 prose-td:p-4 prose-td:border-b prose-td:border-gray-100 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:p-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:font-medium text-gray-700">
                     <ReactMarkdown 
                       remarkPlugins={[remarkGfm]} 
                       rehypePlugins={[rehypeRaw]}
                     >
                       {program.content}
                     </ReactMarkdown>
                   </div>
                 )}

                 {program.professors && program.professors.length > 0 && (
                   <div className="space-y-8">
                     <h3 className="text-3xl font-bold text-gray-900 mb-6">Course Curriculum</h3>
                     {program.professors.map((prof: any) => (
                       <div key={prof.id} className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-blue-100 shadow-md">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                              {prof.imageUrl ? (
                                <img src={prof.imageUrl} alt={prof.name} className="w-16 h-16 rounded-full object-cover border-4 border-blue-50 shadow-md ring-1 ring-gray-100 shrink-0" />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl shadow-md border-4 border-blue-50 shrink-0">
                                  {prof.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                                </div>
                              )}
                              <div>
                                <h4 className="text-xl font-bold text-gray-900 leading-tight">{prof.courseTitle || 'Research Project Seminar'}</h4>
                                <p className="text-sm text-blue-600 font-semibold mt-1">Led by {prof.name}</p>
                                <p className="text-xs text-gray-500 font-normal">{prof.role} {prof.university ? `• ${prof.university}` : ''}</p>
                              </div>
                            </div>

                            {prof.universityLogo && (
                              <div className="sm:self-center shrink-0 bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                                <img src={prof.universityLogo} alt={prof.university || "Institute Logo"} className="h-10 max-w-[120px] object-contain" />
                              </div>
                            )}
                          </div>
                         
                         {prof.bio && <p className="text-gray-700 leading-relaxed mb-5">{prof.bio}</p>}
                         {prof.courseDescription ? (
                           <div className="prose prose-sm prose-gray max-w-none mb-8">
                             <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{prof.courseDescription}</p>
                           </div>
                         ) : (
                           <div className="prose prose-sm prose-gray max-w-none mb-8">
                             <p className="text-gray-600 leading-relaxed">{prof.bio}</p>
                           </div>
                         )}

                         <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-gray-100 pt-6 mt-6">
                           {facts.professorHours && (
                             <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col justify-center">
                               <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-1">Professor Hours</p>
                               <p className="text-gray-900 font-semibold">{facts.professorHours}</p>
                             </div>
                           )}
                           {facts.taHours && (
                             <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col justify-center">
                               <p className="text-xs font-bold text-indigo-800 uppercase tracking-widest mb-1">TA Mentoring Hours</p>
                               <p className="text-gray-900 font-semibold">{facts.taHours}</p>
                             </div>
                           )}
                           {program.courseSchedule && (
                             <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 flex flex-col justify-center">
                               <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">Schedule</p>
                               <p className="text-gray-900 font-semibold">{program.courseSchedule}</p>
                             </div>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
           </div>
           
           {/* Sidebar */}
           <div className="lg:col-span-1">
              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl sticky top-32">
                 <h3 className="text-xl font-bold text-gray-900 mb-6">Program Details</h3>

                 {program.professors && program.professors.length > 0 && (
                   <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-100">
                     <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-3">Faculty Mentor</p>
                     <div className="flex items-center gap-3">
                       {program.professors[0].imageUrl ? (
                         <img
                           src={program.professors[0].imageUrl}
                           alt={program.professors[0].name}
                           className="w-13 h-13 rounded-full object-cover border-2 border-white shadow-md ring-1 ring-blue-100 shrink-0"
                         />
                       ) : (
                         <div className="w-13 h-13 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                           {program.professors[0].name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                         </div>
                       )}
                       <div className="min-w-0 flex-1">
                         <h4 className="font-bold text-gray-900 text-sm leading-snug">{program.professors[0].name}</h4>
                         <p className="text-xs text-gray-600 line-clamp-1">{program.professors[0].role}</p>
                         {program.professors[0].university && (
                           <p className="text-xs font-semibold text-blue-700">{program.professors[0].university}</p>
                         )}
                       </div>
                     </div>
                     {program.professors[0].universityLogo && (
                       <div className="mt-3 pt-3 border-t border-blue-100/70 flex items-center justify-between">
                         <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Affiliation</span>
                         <img
                           src={program.professors[0].universityLogo}
                           alt={program.professors[0].university || "Logo"}
                           className="h-6 max-w-[90px] object-contain"
                         />
                       </div>
                     )}
                   </div>
                 )}
                 
                 <div className="space-y-6 mb-8">
                    <div className="flex items-center text-gray-700">
                       <Calendar className="h-5 w-5 mr-4 text-blue-600 shrink-0" />
                       <div>
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Duration</p>
                         <p className="font-medium">
                           {facts.kind === 'individual' ? facts.duration : program.startDate ? programDate(program.startDate) : 'Schedule available on inquiry'}
                           {facts.kind !== 'individual' && program.endDate ? ` – ${programDate(program.endDate)}` : ''}
                         </p>
                       </div>
                    </div>
                    
                    <div className="h-px bg-gray-100 w-full" />
                    
                    {facts.capacity != null && <>
                    <div className="flex items-center text-gray-700">
                       <Users className="h-5 w-5 mr-4 text-blue-600 shrink-0" />
                       <div>
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cohort Capacity</p>
                         <p className="font-semibold text-gray-900">
                           {facts.capacity} Students
                         </p>
                       </div>
                    </div>
                    
                    </>}
                    <div className="h-px bg-gray-100 w-full" />
                    
                    <div className="flex items-center text-gray-700">
                       <MapPin className="h-5 w-5 mr-4 text-blue-600 shrink-0" />
                       <div>
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Delivery Format</p>
                         <p className="font-semibold text-gray-900">
                           {facts.format}
                         </p>
                       </div>
                    </div>
                 </div>
                 
                 <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 mb-4">
                   <p className="font-bold text-gray-900">Program tuition</p>
                   <p className="text-xl font-bold">{program.tuition != null ? `$${program.tuition.toLocaleString()} USD` : 'Available on inquiry'}</p>
                   <p className="text-sm text-gray-600 mt-2">Tuition is separate from the $50 USD application fee. Ask admissions about payment timing, inclusions and cancellation terms before applying.</p>
                 </div>
                 {/* Application Fee Notice */}
                 {open && (
                   <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/70 border border-blue-100/90 rounded-2xl p-4 mb-4 text-left shadow-xs">
                     <div className="flex items-center justify-between mb-1.5">
                       <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                         <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                         Application Fee
                       </span>
                       <span className="font-black text-gray-900 text-sm">$50 USD</span>
                     </div>
                     <p className="text-xs text-blue-900/70 leading-relaxed font-normal">
                       Covers admissions committee evaluation & interview scheduling. Payable via card upon submission.
                     </p>
                   </div>
                 )}

                 {open ? (
                   <ApplyButton programId={program.id} />
                 ) : (
                   <div className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl text-center font-bold text-lg border border-gray-200">
                     {admissionLabel(program)}
                   </div>
                 )}
                 <p className="text-center text-xs text-gray-400 mt-4 px-4">
                   Applications are reviewed for research readiness and fit. A place is confirmed only after an admissions decision.
                 </p>
                 <Link href="/admissions" className="block text-center text-blue-700 underline mt-4 text-sm">Application steps and fee information</Link>
                 {!open && <Link href="/research" className="block text-center text-blue-700 underline mt-4">Browse upcoming programs</Link>}
              </div>
           </div>
        </div>
      </div>

      {/* Mobile Floating Sticky Action Bar */}
      {open && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200/80 p-4 z-40 lg:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <div className="min-w-0 max-w-[48%]">
              <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <CreditCard className="w-3 h-3 text-blue-600" />
                <span>Application fee · separate from tuition</span>
              </div>
              <p className="font-black text-gray-900 text-lg leading-tight">$50 <span className="text-xs font-semibold text-gray-500">USD</span></p>
            </div>
            <div className="flex-1">
              <ApplyButton programId={program.id} className="h-12 text-base shadow-md" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
