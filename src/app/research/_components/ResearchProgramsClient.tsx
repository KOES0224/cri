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
  categoryFilter: string | string[]
}) {
  const [activeTab, setActiveTab] = useState("ALL");
  
  // Filter programs based on visibility, the specific hub category, and then the active tab
  const filteredPrograms = programs.filter(p => {
    // Only display published programs on the public website
    if (p.isPublished === false) return false;

    // First ensure it belongs to this hub's category (case-insensitive & robust)
    const cat = (p.category || "").trim().toLowerCase();
    const matchesCategory = Array.isArray(categoryFilter)
      ? categoryFilter.some(c => {
          const target = c.trim().toLowerCase();
          return cat === target || cat.includes(target);
        })
      : cat === categoryFilter.trim().toLowerCase() || cat.includes(categoryFilter.trim().toLowerCase());
    
    if (!matchesCategory) return false;
    
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
          <div className="space-y-6">
            {filteredPrograms.map((program) => {
              const prof = program.professors && program.professors.length > 0 ? program.professors[0] : null;

              // Disciplinary badge determination
              let majorText = program.subCategory;
              if (prof) {
                if (prof.relatedMajor) {
                  majorText = prof.relatedMajor;
                } else if (prof.potentialTopics) {
                  const topics = prof.potentialTopics.split(/[|,]/);
                  if (topics.length > 0 && topics[0].trim()) {
                    majorText = topics[0].trim();
                  }
                }
              }

              // Color coding by major keywords
              const mLower = (majorText || "").toLowerCase();
              let badgeColor = "bg-purple-50 text-purple-700 border-purple-200/80";
              if (mLower.includes("bio") || mLower.includes("genom") || mLower.includes("stem")) {
                badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200/80";
              } else if (mLower.includes("polit") || mLower.includes("geopol") || mLower.includes("relation")) {
                badgeColor = "bg-blue-50 text-blue-800 border-blue-200/80";
              } else if (mLower.includes("chem") || mLower.includes("pharm")) {
                badgeColor = "bg-rose-50 text-rose-800 border-rose-200/80";
              } else if (mLower.includes("econ")) {
                badgeColor = "bg-amber-50 text-amber-900 border-amber-200/80";
              }

              // Key research tags
              const sourceTags = prof ? (prof.keywords || prof.potentialTopics) : "";
              const tags = sourceTags
                ? sourceTags.split(/[|,]/).map((t: string) => t.trim()).filter(Boolean).slice(0, 3)
                : [];

              return (
                <div 
                  key={program.id}
                  className="group bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs hover:shadow-xl hover:border-blue-400/80 transition-all duration-300 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6 sm:gap-8"
                >
                  {/* Left (Design 1): Prominent Faculty & Institution Crest Showcase */}
                  <div className="flex items-center gap-5 xl:w-80 shrink-0 pb-6 xl:pb-0 border-b xl:border-b-0 xl:border-r border-gray-100 xl:pr-8">
                    {/* Overlapping Portrait + Institution Logo Badge */}
                    <div className="relative shrink-0">
                      {prof?.imageUrl ? (
                        <img
                          src={prof.imageUrl}
                          alt={prof.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl object-cover border-2 border-white shadow-lg ring-1 ring-gray-200/70"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 text-slate-800 border-2 border-white ring-1 ring-gray-200/70 flex items-center justify-center font-black text-xl sm:text-2xl shadow-md">
                          {prof?.name
                            ? prof.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')
                            : "CRI"}
                        </div>
                      )}

                      {/* Overlapping University Logo Badge */}
                      {prof?.universityLogo ? (
                        <div 
                          className="absolute -bottom-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white border border-gray-200 shadow-md p-1 flex items-center justify-center overflow-hidden"
                          title={prof.university || "Institution"}
                        >
                          <img
                            src={prof.universityLogo}
                            alt={prof.university || "University Crest"}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : prof?.university ? (
                        <div 
                          className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-lg bg-gray-900 text-white border-2 border-white shadow-md text-[9px] font-black uppercase tracking-wider max-w-[85px] truncate"
                          title={prof.university}
                        >
                          {prof.university.split(' ')[0]}
                        </div>
                      ) : null}
                    </div>

                    {/* Faculty Details - Clean, zero text redundancy */}
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">
                        Faculty Mentor
                      </div>
                      <div className="font-black text-gray-900 text-lg sm:text-xl leading-tight group-hover:text-blue-600 transition-colors truncate">
                        {prof?.name || "Distinguished Mentor"}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 font-medium leading-snug mt-1 line-clamp-2">
                        {prof?.role || "Faculty Mentor"}
                      </div>
                      {/* Show text university only if no logo exists */}
                      {!prof?.universityLogo && prof?.university && (
                        <div className="text-xs font-bold text-gray-700 truncate mt-1">
                          {prof.university}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right (Design 2): Structured Course Information, Overview & Metadata */}
                  <div className="min-w-0 flex-1 flex flex-col justify-between gap-4">
                    {/* Header Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {program.status === "OPEN" ? (
                        <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                          Accepting Applications
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-wider rounded-full">
                          Closed
                        </span>
                      )}

                      {majorText && (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${badgeColor}`}>
                          {majorText}
                        </span>
                      )}

                      <span className="text-xs font-medium text-gray-400 ml-auto hidden sm:inline-block">
                        Winter Cohort • Remote
                      </span>
                    </div>

                    {/* Program Title & Description */}
                    <div>
                      <Link href={`/research/program/${program.id}`}>
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors leading-tight">
                          {program.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-2 leading-relaxed font-normal">
                        {program.description}
                      </p>
                    </div>

                    {/* Structured Metadata & Logistics Bar */}
                    <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Schedule, Credits & Topics */}
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <div className="flex items-center text-gray-600 font-semibold bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          {program.startDate ? format(new Date(program.startDate), 'MMM d') : 'TBA'}
                          {program.endDate ? ` - ${format(new Date(program.endDate), 'MMM d, yyyy')}` : ''}
                        </div>

                        {program.tuition && (
                          <div className="font-black text-gray-900 text-sm bg-emerald-50 text-emerald-900 border border-emerald-100 px-3 py-1.5 rounded-xl">
                            ${program.tuition.toLocaleString()} <span className="text-[10px] font-bold text-emerald-700">USD</span>
                          </div>
                        )}

                        {tags.length > 0 && (
                          <div className="hidden md:flex items-center gap-1.5">
                            {tags.map((tag: string, idx: number) => (
                              <span 
                                key={idx} 
                                className="text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-200/70 px-2 py-0.5 rounded-md"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Explore Button */}
                      <Link 
                        href={`/research/program/${program.id}`} 
                        className="h-11 px-6 rounded-2xl bg-gray-900 hover:bg-black text-white text-sm font-bold transition-all inline-flex items-center justify-center group/btn shadow-sm hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 shrink-0 whitespace-nowrap"
                      >
                        Explore Program
                        <ChevronRight className="ml-2 h-4 w-4 text-gray-400 group-hover/btn:translate-x-1 group-hover/btn:text-white transition-all" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
