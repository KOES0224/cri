"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Globe, Laptop, Star, CheckCircle2, Award, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function ResearchClient({ content }: { content: Record<string, string> }) {
  const hubs = [
    {
      id: "seoul",
      title: "Seoul Research Summer Camp",
      subtitle: "Summer Camp Intensive",
      icon: <Globe className="w-8 h-8 text-purple-500" />,
      description: "A highly immersive, in-person intensive held over the summer in Seoul. Work closely with leading academics in an interactive lab-style environment. Limited cohort size.",
      features: ["In-person lab interactions", "Daily intensive seminars", "Local symposium presentations"],
      href: "/research/seoul",
      imageUrl: content.research_seoul_image || "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=2069&auto=format&fit=crop",
      highlight: false,
      color: "purple",
      colorMap: {
        bgLight: "bg-purple-50",
        bgMedium: "bg-purple-400/10",
        text: "text-purple-500",
        shadow: "shadow-purple-500/5",
        shadowStrong: "shadow-purple-500/10",
        gradientStart: "from-purple-50/50"
      }
    },
    {
      id: "winter",
      title: "Winter Online Research",
      subtitle: "Remote Vacational Cohort",
      icon: <Laptop className="w-8 h-8 text-teal-500" />,
      description: "An accelerated virtual program designed to bridge the academic year. Develop a research abstract into a full methodology over the winter break.",
      features: ["Remote flexibility", "Structured milestone tracking", "Collaborative seminars"],
      href: "/research/winter",
      imageUrl: content.research_winter_image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop",
      highlight: false,
      color: "indigo",
      colorMap: {
        bgLight: "bg-indigo-50",
        bgMedium: "bg-indigo-400/10",
        text: "text-indigo-500",
        shadow: "shadow-indigo-500/5",
        shadowStrong: "shadow-indigo-500/10",
        gradientStart: "from-indigo-50/50"
      }
    },
    {
      id: "1-on-1",
      title: "1-on-[1] Advanced Research",
      subtitle: "Advanced Research Program",
      icon: <BookOpen className="w-8 h-8 text-blue-500" />,
      description: "Our most exclusive offering. Work directly with a professor or senior researcher on a highly specialized topic of your choosing over 10 to 12 weeks.",
      features: ["Dedicated PhD mentor", "Personalized syllabus", "Publish-ready capstone"],
      href: "/research/1-on-1",
      imageUrl: content.research_1on1_image || "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=2080&auto=format&fit=crop",
      highlight: true,
      color: "blue",
      colorMap: {
        bgLight: "bg-blue-50",
        bgMedium: "bg-blue-400/10",
        text: "text-blue-500",
        shadow: "shadow-blue-500/5",
        shadowStrong: "shadow-blue-500/10",
        gradientStart: "from-blue-50/50"
      }
    }
  ];

  return (
    <div className="bg-[#FAFAFA] min-h-screen pb-32">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gray-950 border-b border-gray-900 pt-32 pb-24 px-6 md:pt-40 md:pb-32">
        <div className="absolute inset-0 z-0">
           <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-900/30 to-transparent"></div>
           <div className="absolute top-10 left-10 w-72 h-72 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[80px] opacity-70 animate-pulse"></div>
           <div className="absolute top-20 right-20 w-72 h-72 bg-blue-600/20 rounded-full mix-blend-screen filter blur-[80px] opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
           <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[80px] opacity-70 animate-pulse" style={{ animationDelay: '4s' }}></div>
           <div className="absolute bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 inset-0 mix-blend-overlay pointer-events-none"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center px-4 py-2 rounded-full text-xs font-bold text-white bg-white/10 border border-white/20 mb-8 shadow-lg backdrop-blur-md uppercase tracking-wider"
          >
            <Star className="w-4 h-4 mr-2 fill-blue-400 text-blue-400" />
            {content.research_pill_badge || "Elite Curriculum Portals"}
          </motion.div>
          <motion.h1 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
             className="text-6xl md:text-7xl font-black text-white tracking-tighter mb-6 leading-tight drop-shadow-xl"
          >
            {content.research_hero_title || "Pioneering"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">{content.research_hero_highlight || "Research"}</span>
          </motion.h1>
          <motion.p 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            {content.research_hero_subtitle || "Select a research environment below to explore available specializations, esteemed mentors, and active applications."}
          </motion.p>
        </div>
      </div>

      {/* Philosophy Section */}
      <div className="py-24 bg-gray-50/50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-center md:text-left">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="flex flex-col items-center md:items-start group">
              <div className="w-16 h-16 bg-white border border-gray-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform group-hover:bg-blue-50 group-hover:text-blue-600">
                <CheckCircle2 className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Rigorous Methodology</h3>
              <p className="text-gray-600 leading-relaxed">We don't do superficial projects. Our students learn deeply technical, verifiable, and academically sound methodologies.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="flex flex-col items-center md:items-start group">
              <div className="w-16 h-16 bg-white border border-gray-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform group-hover:bg-purple-50 group-hover:text-purple-600">
                <Users className="w-8 h-8 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Elite Mentorship</h3>
              <p className="text-gray-600 leading-relaxed">Work directly with active researchers and tenured professors from the world's most prestigious institutions.</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="flex flex-col items-center md:items-start group">
              <div className="w-16 h-16 bg-white border border-gray-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform group-hover:bg-teal-50 group-hover:text-teal-600">
                <Award className="w-8 h-8 text-gray-400 group-hover:text-teal-600 transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Publish-Ready</h3>
              <p className="text-gray-600 leading-relaxed">The ultimate goal is tangible output. We structure programs to yield papers ready for high-school and undergraduate journals.</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Programs Display - Alternating Layout */}
      <div className="max-w-7xl mx-auto px-6 py-32 space-y-32">
        {hubs.map((hub, i) => {
          const isEven = i % 2 === 0;
          return (
             <motion.div 
              key={hub.id} 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 items-center`}
            >
              {/* Text Content */}
              <div className="flex-1 space-y-8">
                <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-sm font-bold uppercase tracking-wider">
                  {hub.subtitle}
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight">{hub.title}</h2>
                <p className="text-xl text-gray-600 leading-relaxed">{hub.description}</p>
                
                <ul className="space-y-4">
                  {hub.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-gray-700 font-medium">
                      <div className={`w-6 h-6 rounded-full ${hub.colorMap.bgLight} flex items-center justify-center mr-3 shrink-0`}>
                        <CheckCircle2 className={`w-4 h-4 ${hub.colorMap.text}`} />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  <Link href={hub.href} className="inline-flex items-center px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 hover:scale-105 hover:shadow-xl transition-all duration-300 group">
                    Explore {hub.title.split(' ')[0]}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Visual Card */}
              <div className="flex-1 w-full relative z-10">
                <div className={`relative aspect-[4/3] rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden group flex items-center justify-center bg-gray-50`}>
                  {(hub as any).imageUrl ? (
                    <img src={(hub as any).imageUrl} alt={hub.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className={`relative z-10 w-32 h-32 rounded-[2rem] bg-white shadow-xl ${hub.colorMap.shadowStrong} border border-gray-100 flex items-center justify-center ${hub.colorMap.text} group-hover:scale-110 transition-all duration-500`}>
                      {hub.icon}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Bottom CTA */}
      <div className="max-w-5xl mx-auto px-6 mb-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-[3rem] overflow-hidden bg-gray-900 text-center py-24 px-8 border border-gray-800"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-2xl bg-gradient-to-b from-blue-500/20 to-transparent blur-[100px] pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Ready to begin your deep dive?</h2>
            <p className="text-xl text-gray-400">Join a global network of ambitious high school scholars actively contributing to academic literature.</p>
            <div className="flex justify-center gap-4 pt-4">
              <Link href="/contact" className="px-8 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 hover:scale-105 transition-all shadow-xl shadow-white/10">
                Contact Admissions
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
