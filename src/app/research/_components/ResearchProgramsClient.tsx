"use client";

import Link from "next/link";
import { ArrowLeft, Clock, Calendar, ChevronRight, Filter } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export default function ResearchProgramsClient({ 
  programs, 
  title, 
  description, 
  categoryFilter 
}: { 
  programs: any[], 
  title: string, 
  description: string,
  categoryFilter: string
}) {
  const [activeTab, setActiveTab] = useState("ALL");
  
  // Filter programs based on the specific hub category, and then the active tab
  const filteredPrograms = programs.filter(p => {
    // First ensure it belongs to this hub's category
    if (p.category !== categoryFilter) return false;
    
    // Then filter by active tab status
    if (activeTab === "ALL") return true;
    return p.status === activeTab;
  });

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-32 pb-32">
      <div className="max-w-7xl mx-auto px-6">
        <Link href="/research" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-12">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Programs
        </Link>

        <div className="max-w-3xl mb-12">
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter mb-6 leading-tight">
            {title}
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed font-medium">
            {description}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-4">
           <div className="flex items-center text-sm font-bold text-gray-400 uppercase tracking-wider mr-4">
             <Filter className="w-4 h-4 mr-2" /> Filter
           </div>
           <button 
             onClick={() => setActiveTab("ALL")}
             className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === "ALL" ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
           >
             All Programs
           </button>
           <button 
             onClick={() => setActiveTab("OPEN")}
             className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === "OPEN" ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-blue-50"}`}
           >
             Accepting Applications
           </button>
           <button 
             onClick={() => setActiveTab("CLOSED")}
             className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === "CLOSED" ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
           >
             Closed
           </button>
        </div>

        {filteredPrograms.length === 0 ? (
           <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
             <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400 mb-4">
               <Clock className="h-8 w-8" />
             </div>
             <h3 className="text-2xl font-bold text-gray-900 mb-2">No Programs Found</h3>
             <p className="text-gray-500 max-w-md mx-auto">There are currently no research programs matching this criteria. Please check back later.</p>
           </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {filteredPrograms.map((program) => (
              <div 
                key={program.id}
                className="group bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full"
              >
                 <div className="flex justify-between items-start mb-6">
                   {program.status === "OPEN" ? (
                     <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full flex items-center">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span> Open
                     </span>
                   ) : (
                     <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-full">
                       Closed
                     </span>
                   )}
                   
                   {(() => {
                     let majorText = program.subCategory;
                     if (program.professors && program.professors.length > 0) {
                        const prof = program.professors[0];
                        if (prof.relatedMajor) {
                            majorText = prof.relatedMajor;
                        } else if (prof.potentialTopics) {
                            const topics = prof.potentialTopics.split(/[|,]/);
                            if (topics.length > 0 && topics[0].trim()) {
                                majorText = topics[0].trim();
                            }
                        }
                     }
                     if (!majorText) return null;
                     return (
                       <span className="text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full uppercase tracking-wider max-w-[200px] truncate">
                         Major: {majorText}
                       </span>
                     );
                   })()}
                 </div>
                 
                 <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">
                   {program.title}
                 </h3>
                 
                 {program.professors && program.professors.length > 0 && (
                   <div className="mb-4 text-sm font-semibold text-gray-700">
                     <div className="flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                       {program.professors[0].name}
                       {program.professors[0].university && (
                         <span className="text-gray-400 font-normal">| {program.professors[0].university}</span>
                       )}
                     </div>
                   </div>
                 )}

                 <p className="text-gray-600 text-base leading-relaxed mb-6 flex-grow">
                   {program.description}
                 </p>

                 {program.professors && program.professors.length > 0 && program.professors[0].potentialTopics && (
                   <div className="mb-6 flex flex-wrap gap-2">
                     {program.professors[0].potentialTopics.split('|').map((topic: string, idx: number) => {
                       const t = topic.trim();
                       if (!t || idx >= 3) return null;
                       return (
                         <span key={idx} className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md uppercase tracking-wider">
                           {t}
                         </span>
                       );
                     })}
                   </div>
                 )}
                 
                 <div className="pt-6 border-t border-gray-50 mt-auto flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex flex-col gap-2">
                      <div className="text-sm font-medium text-gray-500 flex items-center bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 w-fit">
                         <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                         {program.startDate ? format(new Date(program.startDate), 'MMM d, yyyy') : 'TBA'}
                         {program.endDate ? ` - ${format(new Date(program.endDate), 'MMM d, yyyy')}` : ''}
                      </div>
                      {program.tuition && (
                        <div className="text-sm font-bold text-gray-900 flex items-center bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 w-fit">
                           <span className="text-emerald-600 font-black mr-2">$</span>
                           {program.tuition.toLocaleString()} USD
                        </div>
                      )}
                    </div>
                    
                    <Link href={`/research/program/${program.id}`} className="w-full sm:w-auto h-11 px-6 rounded-xl bg-gray-900 white text-white text-sm font-bold hover:bg-black transition-colors inline-flex items-center justify-center group/btn shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 shrink-0">
                      Apply Now
                      <ChevronRight className="ml-2 h-4 w-4 text-gray-400 group-hover/btn:translate-x-1 group-hover/btn:text-white transition-all" />
                    </Link>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
