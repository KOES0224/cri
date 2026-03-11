"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Globe, Laptop, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function ResearchLandingPage() {
  const hubs = [
    {
      id: "1-on-1",
      title: "1-on-[...]",
      subtitle: "Advanced Research Program",
      icon: <BookOpen className="w-8 h-8 text-blue-500" />,
      description: "Highly individualized, continuous program where students explore profound questions alongside top academic researchers or mentors. Designed for publishing-ready outcomes.",
      href: "/research/1-on-1",
      highlight: true
    },
    {
      id: "seoul",
      title: "Seoul Research Program",
      subtitle: "Summer Camp Intensive",
      icon: <Globe className="w-8 h-8 text-purple-500" />,
      description: "An immersive, on-campus research intensive in Seoul. Students develop a comprehensive research thesis under the rigorous guidance of 14 elite professors.",
      href: "/research/seoul",
      highlight: false
    },
    {
      id: "winter",
      title: "Winter Online Research",
      subtitle: "Remote Vacational Cohort",
      icon: <Laptop className="w-8 h-8 text-teal-500" />,
      description: "Structure your methodology and literature review during the winter break in a focused, remote group environment.",
      href: "/research/winter",
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
            Curriculum Portals
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
            Select a research environment below to explore available specializations, available mentors, and active applications.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {hubs.map((hub, i) => (
             <motion.div 
              key={hub.id} 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <Link href={hub.href} className="block relative h-full">
                <div className={`relative h-full flex flex-col bg-white rounded-[2rem] p-8 border border-gray-100 premium-card group overflow-hidden ${hub.highlight ? 'ring-2 ring-blue-500/20' : ''}`}>
                  
                  {hub.highlight && (
                     <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-[40px] rounded-full"></div>
                  )}

                  <div className="mb-8 relative z-10 bg-gray-50/50 w-16 h-16 rounded-2xl flex items-center justify-center border border-gray-100 transition-transform group-hover:scale-110 group-hover:rotate-3">
                    {hub.icon}
                  </div>

                  <div className="relative z-10 mb-2">
                     <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{hub.subtitle}</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight leading-tight relative z-10">{hub.title}</h2>
                  <p className="text-gray-500 mb-8 flex-grow leading-relaxed relative z-10">{hub.description}</p>
                  
                  <div className="pt-4 border-t border-gray-100 relative z-10 mt-auto">
                    <div className="w-full inline-flex justify-between items-center px-5 py-3.5 bg-gray-50 text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-900 hover:text-white shadow-sm group-hover:shadow-md transition-all">
                      Explore Programs
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
