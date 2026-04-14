"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, UserCheck, Award, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export default function HomeClient({ content }: { content: Record<string, string> }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] font-sans overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 blur-[120px] rounded-full mix-blend-multiply opacity-70 animate-pulse"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 blur-[120px] rounded-full mix-blend-multiply opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute -bottom-32 left-1/4 w-[60%] h-[60%] bg-indigo-300/20 blur-[120px] rounded-full mix-blend-multiply opacity-50"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] mix-blend-overlay"></div>
      </div>

      {/* Hero Section with Animated Abstract Background */}
      <section className="group relative pt-40 pb-32 md:pt-56 md:pb-48 px-6 flex items-center justify-center z-10 min-h-screen overflow-hidden bg-gray-950">
        
        {/* Video Background with Gradient Overlays */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-black">
          {content.landing_hero_image ? (
            content.landing_hero_image.endsWith('.mp4') ? (
              <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              >
                <source src={content.landing_hero_image} type="video/mp4" />
              </video>
            ) : (
              <img 
                src={content.landing_hero_image} 
                alt="Hero Background" 
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
            )
          ) : (
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            >
              <source src="/hero-bg.mp4" type="video/mp4" />
            </video>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent z-10"></div>
          
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] rounded-full bg-blue-600/20 blur-[100px] animate-pulse mix-blend-screen z-20" style={{ animationDuration: '8s' }}></div>
          <div className="absolute top-[10%] right-[-20%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse mix-blend-screen z-20" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
          <div className="absolute bottom-[-30%] left-[20%] w-[80vw] h-[80vw] max-w-[1000px] max-h-[1000px] rounded-full bg-purple-600/10 blur-[150px] animate-pulse mix-blend-screen z-20" style={{ animationDuration: '15s', animationDelay: '1s' }}></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] z-20"></div>
        </div>
        
        {/* Subtle grid texture overlay */}
        <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
        
        {/* Hover Indicator Signage (Visible when NOT hovered) */}
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none transition-opacity duration-700 ease-in-out md:opacity-100 md:group-hover:opacity-0 hidden md:flex">
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3.5 rounded-full flex items-center gap-3 shadow-2xl"
          >
            {/* Pulsing Dot Indicator */}
            <div className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </div>
            <span className="text-white/90 font-semibold tracking-wide text-sm">
              Move cursor here to reveal
            </span>
          </motion.div>
        </div>

        {/* Text container fades out unless hovered (on desktop) */}
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-10 transition-opacity duration-700 ease-in-out md:opacity-0 md:group-hover:opacity-100">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg"
          >
            <span className="relative flex h-2.5 w-2.5 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            {content.landing_pill_badge || "Applications open for 2026 Seoul Research Program"}
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[1.1] drop-shadow-2xl"
          >
            {content.landing_hero_title || "Interests Taken"} <br className="hidden md:block" />
            {(content.landing_hero_title_highlight || !content.landing_hero_title) && (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 block mt-2 md:mt-0 md:inline">
                {content.landing_hero_title_highlight || "Seriously."}
              </span>
            )}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-medium whitespace-pre-line"
          >
            {content.landing_hero_subtitle || "CRI is a guided research environment where genuine interests are developed into academic work that can be examined, defended, and evaluated."}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8"
          >
            <Link href="/research" className="w-full sm:w-auto px-10 py-4 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-100 shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center group hover-lift click-press">
              Explore Programs
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto px-10 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 font-medium rounded-full hover:bg-white/20 flex items-center justify-center hover-lift click-press">
              Student Portal
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Statistics Section (Managed by CMS) */}
      <section className="relative z-20 -mt-16 md:-mt-24 px-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col md:flex-row justify-center items-stretch divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="flex-1 text-center w-full py-10 md:py-12 lg:py-14 px-6 md:px-8 lg:px-12 flex flex-col items-center justify-start">
            <h3 className="text-5xl lg:text-6xl font-black text-gray-900 mb-3 tracking-tight whitespace-nowrap">{content.landing_stat1_number || "100%"}</h3>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs lg:text-sm leading-snug max-w-[180px] min-h-[40px] flex items-start justify-center">{content.landing_stat1_label || "Admissions Success"}</p>
          </div>
          <div className="flex-1 text-center w-full py-10 md:py-12 lg:py-14 px-6 md:px-8 lg:px-12 flex flex-col items-center justify-start">
            <h3 className="text-5xl lg:text-6xl font-black text-blue-600 mb-3 tracking-tight whitespace-nowrap">{content.landing_stat2_number || "#1"}</h3>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs lg:text-sm leading-snug max-w-[180px] min-h-[40px] flex items-start justify-center">{content.landing_stat2_label || "Research Institute"}</p>
          </div>
          <div className="flex-1 text-center w-full py-10 md:py-12 lg:py-14 px-6 md:px-8 lg:px-12 flex flex-col items-center justify-start">
            <h3 className="text-5xl lg:text-6xl font-black text-purple-600 mb-3 tracking-tight whitespace-nowrap">{content.landing_stat3_number || "50+"}</h3>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs lg:text-sm leading-snug max-w-[180px] min-h-[40px] flex items-start justify-center">{content.landing_stat3_label || "Ivy Mentors"}</p>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="pt-24 pb-32 relative z-10 bg-white">
        <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">The Standard for <span className="italic font-serif text-blue-600 tracking-normal">Research</span></h2>
            <p className="text-xl text-gray-500 leading-relaxed font-medium">Not every idea becomes research. At CRI, work is recognized as research only when it meets strict conditions.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                title: "A Question That Can Be Examined",
                description: "Research begins with a question—not an opinion or a topic. Claims must be examinable through data, texts, observation, or scholarship.",
                icon: <BookOpen className="h-7 w-7 text-indigo-600" />,
                gradient: "from-blue-50 to-indigo-50"
              },
              {
                title: "A Method That Holds",
                description: "Without method, work does not move forward. Research requires a structure that allows assumptions to be questioned and decisions revisited.",
                icon: <UserCheck className="h-7 w-7 text-purple-600" />,
                gradient: "from-indigo-50 to-purple-50"
              },
              {
                title: "A Contribution, Not a Summary",
                description: "Research is not a recap of what already exists. It must clarify what changes, what is added, or what becomes newly understood.",
                icon: <Award className="h-7 w-7 text-pink-600" />,
                gradient: "from-purple-50 to-pink-50"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="group relative bg-white p-10 rounded-3xl border border-gray-100/50 premium-card"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-gray-500 text-lg leading-relaxed">{feature.description}</p>
                <div className="absolute top-8 right-8 text-gray-200 group-hover:text-gray-900 transition-colors opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 group-hover:-translate-y-2 duration-300">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-950 text-white py-20 px-6 relative z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_100%)]"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12 relative z-10">
          <div>
            <h3 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 break-words max-w-lg">
              {content.landing_footer_cta || "Building the next generation of academic contributors."}
            </h3>
            <p className="text-gray-400 text-lg max-w-xs md:mt-6 mt-2">CRI. The Standard for Research.</p>
          </div>
          <div className="flex flex-col md:items-end gap-4">
            <div className="flex gap-8 text-lg font-medium text-gray-300">
              <a href="mailto:Admin@cri.kr" className="hover:text-white transition-colors">Admin@cri.kr</a>
              <a href="tel:02-6203-8999" className="hover:text-white transition-colors">02-6203-8999</a>
            </div>
            <p className="text-sm text-gray-600 mt-2">©2024 Elite Research Co., Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
