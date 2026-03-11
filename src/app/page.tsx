"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, UserCheck, Award, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] font-sans overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex justify-center">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 blur-[120px] rounded-full mix-blend-multiply opacity-70 animate-pulse"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 blur-[120px] rounded-full mix-blend-multiply opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute -bottom-32 left-1/4 w-[60%] h-[60%] bg-indigo-300/20 blur-[120px] rounded-full mix-blend-multiply opacity-50"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] mix-blend-overlay"></div>
      </div>

      {/* Hero Section with Video Background */}
      <section className="relative pt-40 pb-32 md:pt-56 md:pb-48 px-6 flex items-center justify-center z-10 min-h-screen overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-[-2]">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            {/* Replace with actual video path once provided */}
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
        </div>
        
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 z-[-1] bg-gradient-to-b from-gray-950/90 via-black/80 to-black/95 backdrop-blur-[2px]"></div>
        
        <div className="max-w-5xl mx-auto text-center space-y-10">
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
            Applications open for 2026 Seoul Research Program
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[1.1] drop-shadow-2xl"
          >
            Interests Taken <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
              Seriously.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-medium"
          >
            CRI is a guided research environment where genuine interests are developed into academic work that can be examined, defended, and evaluated.
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

      {/* Philosophy Section */}
      <section className="py-32 relative z-10 bg-white">
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
            <h3 className="text-5xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">CRI.</h3>
            <p className="text-gray-400 text-lg max-w-xs">Building the next generation of academic contributors.</p>
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
