"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, Clock, CheckCircle2, ChevronRight, User, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { use } from "react";

export default function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);

  return (
    <div className="bg-[#FAFAFA] min-h-screen pb-32">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white border-b border-gray-200 pt-32 pb-24 px-6 md:px-12 lg:px-24 mb-16">
        <div className="absolute inset-0 z-0 pointer-events-none">
           <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-gradient-to-l from-blue-50/80 to-transparent"></div>
           <div className="absolute bottom-[-30%] left-[-10%] w-[50%] h-[80%] bg-purple-100/40 blur-[120px] rounded-full mix-blend-multiply opacity-60"></div>
           <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <Link href="/research" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-10 group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Programs
          </Link>
          
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold text-blue-700 bg-blue-50 border border-blue-100 mb-6 uppercase tracking-wider">
                Mentorship
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter mb-6 leading-[1.1]">
                1-on-1 Advanced <br/>Research
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-8 font-medium">
                A highly individualized, continuous program where students explore profound questions alongside top academic researchers. Designed for publishing-ready outcomes.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center px-4 py-3 bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 border border-gray-100 shadow-sm">
                  <Clock className="w-5 h-5 mr-3 text-blue-600" />
                  12 Weeks Duration
                </div>
                <div className="flex items-center px-4 py-3 bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 border border-gray-100 shadow-sm">
                  <Calendar className="w-5 h-5 mr-3 text-blue-600" />
                  Flexible Start Date
                </div>
                <div className="flex items-center px-4 py-3 bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 border border-gray-100 shadow-sm">
                  <MapPin className="w-5 h-5 mr-3 text-blue-600" />
                  Remote / Hybrid
                </div>
              </div>
            </motion.div>
            
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.6, delay: 0.1 }}
               className="bg-white/60 backdrop-blur-2xl p-8 md:p-10 rounded-[2rem] border border-gray-100 shadow-[0_20px_60px_rgb(0,0,0,0.06)] ring-1 ring-black/[0.02]"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">Application Status</h3>
              <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-1">Current Status</p>
                  <p className="text-xl font-bold text-green-600 flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-3 animate-pulse"></span>
                    Accepting Applications
                  </p>
                </div>
              </div>
              
              <div className="space-y-5 mb-10">
                <div className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 mr-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-gray-700 font-medium">Rolling admissions process</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 mr-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-gray-700 font-medium">Interviews scheduled within 7 days</p>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 mr-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-gray-700 font-medium">Matched with domain expert mentor</p>
                </div>
              </div>

              <Link href="/dashboard" className="w-full flex justify-center items-center px-8 py-5 border border-transparent text-base font-bold rounded-xl text-white bg-gray-900 hover:bg-black transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                Apply via Portal
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-16">
        <div className="md:col-span-2 space-y-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">Program Overview</h2>
            <div className="prose prose-lg prose-blue max-w-none text-gray-600 leading-relaxed font-medium">
              <p>
                The 1-on-1 Advanced Research Program is our flagship initiative designed for students who demonstrate exceptional curiosity and intellectual capability. This is not a standard tutoring session; it is a collaborative academic pursuit.
              </p>
              <p>
                Students will be paired with a mentor who actively researches in their field of interest. Together, they will define a novel research question, establish a rigorous methodology, collect and analyze data, and ultimately draft a paper suitable for publication in high school or undergraduate research journals.
              </p>
            </div>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.5, delay: 0.1 }}
             className="bg-white p-10 md:p-12 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">What to Expect</h2>
            <ul className="space-y-6">
              {[
                { title: "Weekly Milestone Meetings", desc: "Rigorous 60-90 minute sessions focusing on critical review of weekly assignments." },
                { title: "Methodology Training", desc: "Learn to use industry-standard tools (e.g., Python, R, SPSS) specific to your discipline." },
                { title: "Literature Review", desc: "Access to university-level databases to construct a solid theoretical framework." },
                { title: "Final Deliverable", desc: "A 15-20 page manuscript formatted according to APA/MLA/Chicago standards." }
              ].map((item, i) => (
                <li key={i} className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-sm">
                      {i + 1}
                    </div>
                  </div>
                  <div className="ml-5">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-gray-600 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="space-y-8">
          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.5 }}
             className="bg-gray-900 text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-[30px] rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <h3 className="text-xl font-bold mb-6 tracking-tight relative z-10">Available Mentors</h3>
            <div className="space-y-6 relative z-10">
              <div className="flex items-center p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mr-4 shrink-0 overflow-hidden">
                   <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Sarah&backgroundColor=b6e3f4" alt="mentor" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Dr. Sarah Chen</p>
                  <p className="text-xs text-blue-300 font-medium">Cognitive Psychology</p>
                </div>
              </div>
              <div className="flex items-center p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mr-4 shrink-0 overflow-hidden">
                   <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Elena&backgroundColor=ffd5dc" alt="mentor" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Dr. Elena Rodriguez</p>
                  <p className="text-xs text-blue-300 font-medium">Behavioral Economics</p>
                </div>
              </div>
            </div>
            
            <Link href="/professors" className="mt-8 text-sm font-semibold text-white/70 hover:text-white flex items-center transition-colors relative z-10">
              View all faculty <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, x: 20 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.5, delay: 0.1 }}
             className="bg-blue-50 border border-blue-100/50 rounded-[2rem] p-8"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">Need Help?</h3>
            <p className="text-gray-600 text-sm mb-6 font-medium leading-relaxed">
              If you have questions about whether your intended research topic is a good fit for this program, you can contact our admissions office.
            </p>
            <a href="mailto: admissions@cri.kr" className="inline-flex justify-center items-center w-full px-4 py-3 border border-gray-300 shadow-sm text-sm font-bold rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              Contact Admissions
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
