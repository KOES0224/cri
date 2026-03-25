"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { FolderGit2, Users, Trophy, ArrowRight, Star, ChevronRight, Activity, Award, Globe2 } from "lucide-react";

export default function ProjectsClient({ content }: { content: Record<string, string> }) {
  return (
    <div className="bg-[#FAFAFA] min-h-screen pb-32 overflow-x-hidden">
      
      {/* Hero Section */}
      <div className="relative pt-32 pb-40 px-6 md:pt-40 md:pb-56 border-b border-gray-900 bg-gray-950 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
          <div className="absolute top-40 -left-20 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDelay: '4s' }}></div>
          <div className="absolute bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 inset-0 mix-blend-overlay"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center px-4 py-2 rounded-full text-xs font-bold text-white bg-white/10 border border-white/20 mb-8 shadow-lg backdrop-blur-md uppercase tracking-wider"
            >
              <Star className="w-4 h-4 mr-2 fill-blue-400 text-blue-400" />
              {content.projects_pill_badge || "Student Portfolios"}
            </motion.div>
            <motion.h1 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.1 }}
               className="text-6xl md:text-7xl font-black text-white tracking-tighter mb-6 leading-tight drop-shadow-xl"
            >
              {content.projects_hero_title || "Ideas Turned Into"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">{content.projects_hero_highlight || "Impact"}</span>
            </motion.h1>
            <motion.p 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-gray-300 max-w-2xl leading-relaxed font-medium"
            >
              {content.projects_hero_subtitle || "Explore personal endeavors, collaborative group work, and rigorous competition preparation led entirely by our scholars."}
            </motion.p>
          </div>
        </div>
      </div>

      {/* Premium Impact Stats Dashboard - Apple Glassmorphism */}
      <div className="relative -mt-32 z-20 max-w-6xl mx-auto px-6 mb-32">
        {/* The Glass Container Wrapper */}
        <div className="relative rounded-[3rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
          {/* Layer 0: Vivid background blobs inside the container bounding box */}
          <div className="absolute inset-0 z-0 overflow-hidden rounded-[3rem] pointer-events-none bg-white/10">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] bg-blue-400/50 rounded-full blur-[80px] mix-blend-multiply opacity-100 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-400/50 rounded-full blur-[80px] mix-blend-multiply opacity-100" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-[20%] right-[20%] w-[40%] h-[50%] bg-amber-300/40 rounded-full blur-[80px] mix-blend-multiply opacity-90 flex"></div>
          </div>

          {/* Layer 1: The Glass */}
          <div className="relative z-10 bg-white/10 backdrop-blur-3xl rounded-[3rem] border border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] p-8 md:p-16 overflow-hidden">
            {/* Inner ambient glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/5 to-transparent pointer-events-none"></div>
            
            <div className="relative z-20 flex flex-col lg:flex-row gap-12 items-center justify-between">
              
              <div className="max-w-lg lg:w-1/2">
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-lg border border-white shadow-sm text-gray-800 text-xs font-bold uppercase tracking-widest mb-8">
                  <Activity className="w-4 h-4 mr-2 text-blue-600" /> Active Global Impact
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-6 leading-tight drop-shadow-sm">Measuring<br/>What Matters.</h2>
                <p className="text-gray-700 text-lg leading-relaxed font-medium">CRI scholars are pushing boundaries across the globe. Our metrics aren't just numbers—they represent deployed systems, published abstracts, and real-world policy implementations.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full lg:w-1/2 relative">
                <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2rem] p-6 md:p-8 flex flex-col justify-center relative shadow-sm hover:bg-white/50 transition-colors group">
                  <p className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter mb-1 drop-shadow-sm">150<span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-indigo-500">+</span></p>
                  <p className="text-[10px] md:text-xs font-extrabold text-blue-900/60 uppercase tracking-widest">Active Projects</p>
                </div>
                <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2rem] p-6 md:p-8 flex flex-col justify-center relative shadow-sm hover:bg-white/50 transition-colors group">
                  <p className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter mb-1 drop-shadow-sm">24</p>
                  <p className="text-[10px] md:text-xs font-extrabold text-blue-900/60 uppercase tracking-widest">Countries Reached</p>
                </div>
                <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2rem] p-6 md:p-8 flex flex-col justify-center relative shadow-sm hover:bg-white/50 transition-colors group">
                  <p className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter mb-1 drop-shadow-sm">80<span className="text-transparent bg-clip-text bg-gradient-to-br from-teal-500 to-emerald-500">+</span></p>
                  <p className="text-[10px] md:text-xs font-extrabold text-teal-900/60 uppercase tracking-widest">Global Awards</p>
                </div>
                <Link href="/projects/group" className="bg-gradient-to-br from-gray-900 to-black rounded-[2rem] p-6 md:p-8 flex flex-col justify-center items-center text-center shadow-lg hover:scale-[1.02] transition-transform group border border-gray-800">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-3 group-hover:bg-white/20 transition-colors border border-white/10">
                     <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[10px] md:text-xs font-extrabold text-gray-300 uppercase tracking-widest">View Gallery</p>
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid layout for categories */}
      <div className="max-w-7xl mx-auto px-6 mb-32">
        <div className="text-center md:text-left mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">Project Pathways</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[400px]">
          
          {/* Card 1: Personal (Span 2 cols on lg) */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="lg:col-span-2 relative bg-white rounded-[2rem] p-8 md:p-12 border border-gray-100 shadow-sm overflow-hidden group premium-card flex flex-col justify-end">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent group-hover:scale-105 transition-transform duration-700"></div>
            
            <div className="relative z-10 w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mb-8">
              <FolderGit2 className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>

            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Personal Projects</h3>
              <p className="text-lg text-gray-600 mb-8 max-w-xl">Independent research and technical builds tailored to specific academic passions. Build and launch your own minimum viable products from scratch.</p>
              
              <Link href="/projects/personal" className="inline-flex items-center px-6 py-3 bg-white border border-gray-200 text-gray-900 font-bold rounded-xl hover:bg-gray-900 hover:text-white hover:border-transparent transition-all shadow-sm">
                Explore Personal Projects
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Card 2: Group (Span 1 col) */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="relative bg-gray-900 text-white rounded-[2rem] p-8 border border-gray-800 shadow-sm overflow-hidden group premium-card flex flex-col justify-end">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/40 to-transparent group-hover:scale-105 transition-transform duration-700"></div>
            
            <div className="relative z-10 w-16 h-16 bg-gray-800 border border-gray-700 rounded-2xl flex items-center justify-center mb-8">
              <Users className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>

            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-3 tracking-tight">Group Projects</h3>
              <p className="text-gray-400 mb-8 text-sm leading-relaxed">Cross-disciplinary teams working on large-scale societal or technical problems.</p>
              
              <Link href="/projects/group" className="w-full inline-flex justify-between items-center px-5 py-3.5 bg-gray-800 text-white text-sm font-semibold rounded-xl hover:bg-purple-600 hover:shadow-lg transition-all">
                View Teams
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 group-hover:text-white transition-all" />
              </Link>
            </div>
          </motion.div>

          {/* Card 3: Competitions (Span 3 cols on lg, but we make it span full and adjust grid) 
              Actually to make it Bento, let's keep grid-cols-1 md:grid-cols-2 lg:grid-cols-3,
              Card 1 took 2, Card 2 took 1. Wait, let's make the next row completely standard or span 3. */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="lg:col-span-3 relative bg-white rounded-[2rem] p-8 md:p-12 border border-gray-100 shadow-sm overflow-hidden group premium-card flex flex-col md:flex-row items-center md:items-end justify-between">
            <div className="absolute inset-0 bg-gradient-to-tl from-amber-50/80 to-transparent group-hover:scale-105 transition-transform duration-700"></div>
            
            <div className="relative z-10 w-full md:w-2/3 mb-8 md:mb-0">
               <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-2xl flex items-center justify-center mb-8">
                 <Trophy className="w-8 h-8 text-amber-500 group-hover:scale-110 transition-transform" />
               </div>
               <h3 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Competition Preps</h3>
               <p className="text-lg text-gray-600 max-w-2xl">Structured preparation for international science, math, and debate olympiads. Compete at the highest global tier with rigorous training from experienced mentors.</p>
            </div>

            <div className="relative z-10 w-full md:w-auto shrink-0 pb-2">
              <Link href="/projects/competitions" className="w-full md:w-auto inline-flex justify-center items-center px-8 py-4 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 hover:shadow-xl hover:shadow-amber-500/20 transition-all">
                See Competitions
                <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Featured Showcase Section */}
      <div className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto space-y-8">
             <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold text-gray-300 bg-gray-800 border border-gray-700">
                Showcase
             </div>
             <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Pioneering the Future</h2>
             <p className="text-xl text-gray-400 leading-relaxed">"The environment at CRI allowed me to turn an abstract machine learning concept into a functional diagnostic app in under three months."</p>
             <div className="flex items-center justify-center gap-4 text-left border-t border-gray-800 pt-8 mt-8 inline-block mx-auto max-w-sm">
                <div className="w-12 h-12 bg-gray-800 rounded-full border border-gray-700"></div>
                <div>
                   <p className="font-bold text-white">Sarah Jenkins</p>
                   <p className="text-sm text-gray-400">Personal Project: MediAI</p>
                </div>
             </div>
          </motion.div>
        </div>
      </div>

    </div>
  );
}

// Inline component for Globe2 as it might not be exported from lucide-react in older versions, 
// using Globe2 from lucide-react if imported, otherwise defining a fallback.
const Global2Icon = () => {
    return <Globe2 className="w-6 h-6" />;
}
