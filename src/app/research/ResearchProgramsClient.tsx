"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Clock, Star } from "lucide-react";
import { motion } from "framer-motion";

type Program = {
  id: string;
  title: string;
  category: string;
  subCategory: string | null;
  status: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
};

export default function ResearchProgramsClient({ 
  programs, 
  pageTitle = "Research Programs",
  pageDescription = "We offer specialized environments—whether 1-on-1, intense summer cohorts, or remote groups—each designed to demand rigorous inquiry."
}: { 
  programs: Program[];
  pageTitle?: string;
  pageDescription?: string;
}) {
  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-24 pb-32">
      {/* Header */}
      <div className="relative overflow-hidden bg-white border-b border-gray-200 py-24 px-6 mb-16">
        <div className="absolute inset-0 z-0">
           <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 to-transparent"></div>
           <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[60%] bg-purple-100/30 blur-[100px] rounded-full mix-blend-multiply opacity-60"></div>
        </div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
            className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-100 mb-6"
          >
            <Star className="w-4 h-4 mr-2" />
            Academic Offerings
          </motion.div>
          <motion.h1 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.1 }}
             className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter"
          >
            {pageTitle}
          </motion.h1>
          <motion.p 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
            {pageDescription}
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500">
               No active programs at this time. Please check back later!
            </div>
          ) : (
            programs.map((program, i) => (
               <motion.div 
                key={program.id} 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <div className="relative h-full flex flex-col bg-white rounded-[2rem] p-8 border border-gray-100 premium-card group overflow-hidden">
                  
                  <div className="flex justify-between items-start mb-6 relative z-10 w-full flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-gray-600 bg-gray-100 uppercase tracking-wider">
                      {program.category}{program.subCategory ? ` - ${program.subCategory}` : ''}
                    </span>
                    
                    {program.status === "OPEN" && (
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-green-700 bg-green-100 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                        Apply Now
                      </span>
                    )}
                    {program.status === "CLOSED" && (
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-gray-500 bg-gray-100 uppercase tracking-wider">
                        Closed
                      </span>
                    )}
                    {program.status === "COMPLETED" && (
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-blue-700 bg-blue-100 uppercase tracking-wider">
                        Completed
                      </span>
                    )}
                  </div>
  
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight leading-tight relative z-10">{program.title}</h2>
                  <p className="text-gray-500 mb-8 flex-grow leading-relaxed relative z-10 whitespace-pre-line">{program.description}</p>
                  
                  <div className="space-y-3 mb-8 relative z-10">
                    <div className="flex items-center text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <Calendar className="w-5 h-5 mr-3 text-blue-500" />
                      Starts: {program.startDate ? new Date(program.startDate).toLocaleDateString() : 'TBD'}
                    </div>
                  </div>
  
                  <div className="pt-4 border-t border-gray-100 relative z-10">
                    <Link href={`/research/${program.id}`} className="w-full inline-flex justify-between items-center px-5 py-3.5 bg-gray-50 text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-900 hover:text-white shadow-sm group-hover:shadow-md hover-lift click-press">
                      View details
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
