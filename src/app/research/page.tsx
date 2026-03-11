"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Clock, BookOpen, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function ProgramsPage() {
  const programs = [
    {
      id: "1",
      title: "1-on-1 Advanced Research",
      category: "Mentorship",
      status: "OPEN",
      duration: "12 Weeks",
      startDate: "Flexible",
      description: "A highly individualized, continuous program where students explore profound questions alongside top academic researchers. Designed for publishing-ready outcomes.",
      highlight: true
    },
    {
      id: "2",
      title: "Seoul Research Program",
      category: "Summer Camp",
      status: "OPEN",
      duration: "3-4 Weeks",
      startDate: "Summer 2026",
      description: "An immersive, on-campus research intensive in Seoul. Students develop a comprehensive research thesis under rigorous guidance.",
      highlight: false
    },
    {
      id: "3",
      title: "Winter Remote Research Init",
      category: "Remote Cohort",
      status: "UPCOMING",
      duration: "6 Weeks",
      startDate: "Dec 10, 2024",
      description: "Structure your methodology and literature review during the winter break in a focused, remote group setting.",
      highlight: false
    }
  ];

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
            Research Programs
          </motion.h1>
          <motion.p 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
            We offer specialized environments—whether 1-on-1, intense summer cohorts, or remote groups—each designed to demand rigorous inquiry.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program, i) => (
             <motion.div 
              key={program.id} 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <div className={`relative h-full flex flex-col bg-white rounded-[2rem] p-8 border border-gray-100 premium-card group overflow-hidden ${program.highlight ? 'ring-2 ring-blue-500/20' : ''}`}>
                
                {program.highlight && (
                   <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-[40px] rounded-full"></div>
                )}

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-gray-600 bg-gray-100 uppercase tracking-wider">
                    {program.category}
                  </span>
                  
                  {program.status === "OPEN" && (
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-green-700 bg-green-100 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                      Apply Now
                    </span>
                  )}
                  {program.status === "CLOSED" && (
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-gray-500 bg-gray-100 uppercase tracking-wider">
                      Full
                    </span>
                  )}
                  {program.status === "UPCOMING" && (
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold text-amber-700 bg-amber-100 uppercase tracking-wider">
                      Upcoming
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight leading-tight relative z-10">{program.title}</h2>
                <p className="text-gray-500 mb-8 flex-grow leading-relaxed relative z-10">{program.description}</p>
                
                <div className="space-y-3 mb-8 relative z-10">
                  <div className="flex items-center text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <Clock className="w-5 h-5 mr-3 text-blue-500" />
                    {program.duration}
                  </div>
                  <div className="flex items-center text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <Calendar className="w-5 h-5 mr-3 text-blue-500" />
                    Starts: {program.startDate}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 relative z-10">
                  <Link href={`/research/${program.id}`} className="w-full inline-flex justify-between items-center px-5 py-3.5 bg-gray-50 text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-900 hover:text-white shadow-sm group-hover:shadow-md hover-lift click-press">
                    View Mentors & Details
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
