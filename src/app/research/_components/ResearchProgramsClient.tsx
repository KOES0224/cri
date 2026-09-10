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
                  className="group bg-white rounded-3xl border border-gray-200/90 shadow-xs hover:shadow-2xl hover:border-blue-400/80 transition-all duration-300 flex flex-col xl:flex-row items-stretch overflow-hidden"
                >
                  {/* Left (Idea 4): Cinematic Faculty Sidebar with Large Portrait & University Crest */}
                  <div className="xl:w-84 2xl:w-96 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden shrink-0">
                    {/* Background Subtle Accent Glow */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    {/* Top Row: Faculty Badge & Large University Crest */}
                    <div className="flex items-center justify-between gap-3 mb-5 z-10 relative">
                      <span className="text-[10px] uppercase font-black tracking-widest text-slate-300 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
                        Faculty Mentor
                      </span>

                      {/* University Logo Badge */}
                      {prof?.universityLogo ? (
                        <div 
                          className="h-10 px-3 rounded-xl bg-white/95 backdrop-blur-md border border-white/20 shadow-md flex items-center justify-center max-w-[130px]"
                          title={prof.university || "Institution Crest"}
                        >
                          <img
                            src={prof.universityLogo}
                            alt={prof.university || "Institution"}
                            className="max-h-8 max-w-full object-contain"
                          />
                        </div>
                      ) : prof?.university ? (
                        <span 
                          className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 max-w-[130px] truncate"
                          title={prof.university}
                        >
                          {prof.university.split(' ')[0]}
                        </span>
                      ) : null}
                    </div>

                    {/* Middle: Massive Portrait (160px - 180px height) */}
                    <div className="my-auto py-2 flex justify-center z-10 relative">
                      {prof?.imageUrl ? (
                        <img
                          src={prof.imageUrl}
                          alt={prof.name}
                          className="w-40 h-40 sm:w-44 sm:h-44 rounded-3xl object-cover border-2 border-white/20 shadow-2xl ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-br from-slate-800 to-indigo-900 border-2 border-white/20 shadow-2xl flex items-center justify-center font-black text-4xl text-slate-200">
                          {prof?.name
                            ? prof.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')
                            : "CRI"}
                        </div>
                      )}
                    </div>

                    {/* Bottom: Professor Name & Academic Rank (Zero Text Redundancy) */}
                    <div className="mt-5 pt-4 border-t border-white/10 z-10 relative">
                      <div className="font-black text-white text-xl sm:text-2xl leading-tight truncate">
                        {prof?.name || "Distinguished Faculty"}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-300 font-medium leading-snug mt-1 line-clamp-2">
                        {prof?.role || "Faculty Mentor"}
                      </div>
                      {/* Show text university only if no logo exists */}
                      {!prof?.universityLogo && prof?.university && (
                        <div className="text-[11px] font-bold text-slate-400 truncate mt-1">
                          {prof.university}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right (Design 2): Structured Course Overview, Metadata & Actions */}
                  <div className="min-w-0 flex-1 p-6 sm:p-8 flex flex-col justify-between gap-5 bg-white">
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

                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 sm:ml-auto">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100/80">
                          {program.locationFormat || "Online (Remote)"}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                          Max {program.capacity || 5} Students
                        </span>
                      </div>
                    </div>

                    {/* Course Title & Research Focus */}
                    <div className="space-y-2">
                      <Link href={`/research/program/${program.id}`}>
                        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors leading-snug">
                          {program.title}
                        </h3>
                      </Link>
                      <p className="text-sm sm:text-base text-gray-600 line-clamp-3 leading-relaxed font-normal pt-1">
                        {program.description}
                      </p>
                    </div>

                    {/* Structured Logistics Bar */}
                    <div className="pt-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto">
                      {/* Dates, Tuition & Topic Tags */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
                        <div className="flex items-center text-gray-700 font-semibold bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-100">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {program.startDate ? format(new Date(program.startDate), 'MMM d') : 'TBA'}
                          {program.endDate ? ` - ${format(new Date(program.endDate), 'MMM d, yyyy')}` : ''}
                        </div>

                        {program.tuition && (
                          <div className="font-black text-gray-900 text-base bg-emerald-50 text-emerald-900 border border-emerald-100 px-3.5 py-1.5 rounded-xl">
                            ${program.tuition.toLocaleString()} <span className="text-xs font-bold text-emerald-700">USD</span>
                          </div>
                        )}

                        {tags.length > 0 && (
                          <div className="hidden lg:flex items-center gap-1.5">
                            {tags.map((tag: string, idx: number) => (
                              <span 
                                key={idx} 
                                className="text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-200/70 px-2.5 py-1 rounded-md"
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
                        className="h-12 px-7 rounded-2xl bg-gray-900 hover:bg-black text-white text-sm font-bold transition-all inline-flex items-center justify-center group/btn shadow-sm hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 shrink-0 whitespace-nowrap"
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
