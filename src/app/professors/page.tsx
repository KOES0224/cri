"use client";

import Image from "next/image";
import { Mail, Book, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfessorsPage() {
  const professors = [
    {
      name: "Dr. Sarah Chen",
      field: "Cognitive Psychology",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Sarah&backgroundColor=b6e3f4",
      bio: "Focuses on memory encoding and retrieval mechanisms in young adults. Former lead researcher at the Cognitive Sciences Institute.",
      publications: 24,
      acceptingMentees: true
    },
    {
      name: "Dr. James Wilson",
      field: "Computational Biology",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=James&backgroundColor=c0aede",
      bio: "Specializes in algorithmic approaches to protein folding and genomic sequence alignment.",
      publications: 41,
      acceptingMentees: false
    },
    {
      name: "Dr. Elena Rodriguez",
      field: "Behavioral Economics",
      avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Elena&backgroundColor=ffd5dc",
      bio: "Researches decision-making under uncertainty and market micro-structures.",
      publications: 18,
      acceptingMentees: true
    }
  ];

  return (
    <div className="bg-[#FAFAFA] min-h-screen pt-24 pb-32">
      {/* Header */}
      <div className="relative overflow-hidden bg-white border-b border-gray-200 py-24 px-6 mb-16">
        <div className="absolute inset-0 z-0">
           <div className="absolute top-[-50%] left-[20%] w-[60%] h-[150%] bg-blue-100/30 blur-[120px] rounded-full mix-blend-multiply opacity-50"></div>
        </div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.5 }}
             className="inline-flex bg-gray-100 rounded-full px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide text-gray-700"
          >
             Faculty & Mentorship
          </motion.div>
          <motion.h1 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.1 }}
             className="text-5xl md:text-7xl font-black text-gray-900 tracking-tighter"
          >
            Mentors & Guidance
          </motion.h1>
          <motion.p 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.2 }}
             className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
            Guidance at CRI is not defined by how much is explained, but by when it is withheld and when revision is required. Meet the mentors who uphold this standard.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {professors.map((prof, i) => (
             <motion.div 
               key={i} 
               initial={{ opacity: 0, y: 40 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.5, delay: i * 0.15 }}
             >
              <div className="bg-white rounded-[2rem] border border-gray-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] p-8 text-center transition-all duration-300 group">
                <div className="relative w-36 h-36 mx-auto mb-6 rounded-full overflow-hidden border-8 border-gray-50 bg-gray-100 shadow-inner group-hover:scale-105 transition-transform duration-500">
                  <Image src={prof.avatar} alt={prof.name} fill className="object-cover" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">{prof.name}</h3>
                <p className="text-indigo-600 font-bold text-sm mb-5 uppercase tracking-wide">{prof.field}</p>
                
                <p className="text-gray-500 text-base leading-relaxed mb-8 h-24">
                  {prof.bio}
                </p>

                <div className="flex justify-center space-x-6 mb-8 px-4 py-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center text-gray-600 text-sm font-semibold">
                    <Book className="w-4 h-4 mr-2 text-indigo-500" />
                    {prof.publications} Papers
                  </div>
                  <div className="w-px h-5 bg-gray-200"></div>
                  <div className="flex items-center text-sm font-bold">
                    {prof.acceptingMentees ? (
                      <span className="text-emerald-600 flex items-center">
                        <span className="w-2h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span> Accepting
                      </span>
                    ) : (
                      <span className="text-gray-400 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-gray-300 mr-2"></span> Full
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className="flex justify-center items-center px-4 py-3 border border-gray-200 shadow-sm text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all">
                    Profile
                    <ExternalLink className="w-4 h-4 ml-2 text-gray-400" />
                  </button>
                  <button className="flex justify-center items-center px-4 py-3 border border-transparent shadow-sm text-sm font-bold rounded-xl text-white bg-gray-900 hover:bg-black transition-all">
                    <Mail className="w-4 h-4 mr-2" />
                    Message
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
