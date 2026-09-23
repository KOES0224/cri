"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, UserCheck, Award, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import OpenProgramsSection from "@/components/OpenProgramsSection";
import type { OpenProgramCard } from "@/lib/open-programs";
import { useT } from "@/i18n/client";
import HowItWorks from "@/components/home/HowItWorks";
import UniversitiesStrip from "@/components/home/UniversitiesStrip";
import FaqSection from "@/components/home/FaqSection";
import MobileApplyBar from "@/components/home/MobileApplyBar";
import HeroVideo from "@/components/home/HeroVideo";

export default function HomeClient({ content, openPrograms = [] }: { content: Record<string, string>; openPrograms?: OpenProgramCard[] }) {
  const { t, locale } = useT();
  const openCount = openPrograms.length;
  // CMS landing text is English. In another locale use a `<key>_<locale>` CMS value if the admin added one, else the dictionary.
  const cms = (key: string) => (locale === "en" ? content[key] : content[`${key}_${locale}`]) || "";
  // Stat labels: a translated CMS value if the admin added one, else a dictionary translation of the English CMS label, else the fallback.
  const statLabel = (key: string, fallback: string) => cms(key) || (locale !== "en" && content[key] ? t.home.cmsLabels[content[key]] : "") || content[key] || fallback;
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
              <HeroVideo src={content.landing_hero_image} className="absolute inset-0 w-full h-full object-cover opacity-50" />
            ) : (
              <img 
                src={content.landing_hero_image} 
                alt="Hero Background" 
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
            )
          ) : (
            <HeroVideo src="/hero-bg.mp4" className="absolute inset-0 w-full h-full object-cover opacity-50" />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent z-10"></div>
          
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] rounded-full bg-blue-600/20 blur-[100px] animate-pulse mix-blend-screen z-20" style={{ animationDuration: '8s' }}></div>
          <div className="absolute top-[10%] right-[-20%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse mix-blend-screen z-20" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
          <div className="absolute bottom-[-30%] left-[20%] w-[80vw] h-[80vw] max-w-[1000px] max-h-[1000px] rounded-full bg-purple-600/10 blur-[150px] animate-pulse mix-blend-screen z-20" style={{ animationDuration: '15s', animationDelay: '1s' }}></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] z-20"></div>
        </div>
        
        {/* Subtle grid texture overlay */}
        <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>

        {/* Desktop-only Hover Indicator Signage (Hidden on mobile, visible on desktop until hovered) */}
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none transition-opacity duration-700 ease-in-out md:opacity-100 md:group-hover:opacity-0 md:group-focus-within:opacity-0 hidden md:flex">
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
              {t.home.reveal}
            </span>
          </motion.div>
        </div>

        {/* Hero Content: Always visible on mobile, reveals on hover on desktop */}
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-10 transition-opacity duration-700 ease-in-out opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 pointer-events-auto md:pointer-events-none md:group-hover:pointer-events-auto">
          <div
            className="hero-fade-up inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg"
          >
            <span className="relative flex h-2.5 w-2.5 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            {cms("landing_pill_badge") || t.home.pillBadge}
          </div>
          
          <h1
            style={{ animationDelay: "0.1s" }}
            className="hero-fade-up text-6xl md:text-8xl font-black tracking-tighter text-white leading-[1.1] drop-shadow-2xl"
          >
            {cms("landing_hero_title") || t.home.heroTitle} <br className="hidden md:block" />
            {(cms("landing_hero_title_highlight") || !cms("landing_hero_title")) && (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 block mt-2 md:mt-0 md:inline">
                {cms("landing_hero_title_highlight") || t.home.heroHighlight}
              </span>
            )}
          </h1>
          
          <p
            style={{ animationDelay: "0.2s" }}
            className="hero-fade-up text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-medium whitespace-pre-line"
          >
            {cms("landing_hero_subtitle") || t.home.heroSubtitle}
          </p>
          
          <div
            style={{ animationDelay: "0.3s" }}
            className="hero-fade-up flex flex-col sm:flex-row items-center justify-center gap-5 pt-8"
          >
            <Link href="#open-programs" className="w-full sm:w-auto px-10 py-4 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-100 shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center group hover-lift click-press">
              {openCount > 0 ? t.home.seeOpen(openCount) : t.home.seePrograms}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/research" className="w-full sm:w-auto px-10 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 font-medium rounded-full hover:bg-white/20 flex items-center justify-center hover-lift click-press">
              {t.home.exploreAll}
            </Link>
          </div>
          {openCount > 0 && (
            <p
              style={{ animationDelay: "0.5s" }}
              className="hero-fade-up text-sm text-gray-400 font-medium"
            >
              {t.home.openNote}
            </p>
          )}
        </div>
      </section>

      {/* Statistics Section (Managed by CMS) */}
      <section className="relative z-20 -mt-16 md:-mt-24 px-6 max-w-6xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col md:flex-row justify-center items-stretch divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="flex-1 text-center w-full py-10 md:py-12 lg:py-14 px-6 md:px-8 lg:px-12 flex flex-col items-center justify-start">
            <h3 className="text-5xl lg:text-6xl font-black text-gray-900 mb-3 tracking-tight whitespace-nowrap">{content.landing_stat1_number || "100%"}</h3>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs lg:text-sm leading-snug max-w-[180px] min-h-[40px] flex items-start justify-center">{statLabel("landing_stat1_label", t.home.stat1Label)}</p>
          </div>
          <div className="flex-1 text-center w-full py-10 md:py-12 lg:py-14 px-6 md:px-8 lg:px-12 flex flex-col items-center justify-start">
            <h3 className="text-5xl lg:text-6xl font-black text-blue-600 mb-3 tracking-tight whitespace-nowrap">{content.landing_stat2_number || "#1"}</h3>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs lg:text-sm leading-snug max-w-[180px] min-h-[40px] flex items-start justify-center">{statLabel("landing_stat2_label", t.home.stat2Label)}</p>
          </div>
          <div className="flex-1 text-center w-full py-10 md:py-12 lg:py-14 px-6 md:px-8 lg:px-12 flex flex-col items-center justify-start">
            <h3 className="text-5xl lg:text-6xl font-black text-purple-600 mb-3 tracking-tight whitespace-nowrap">{content.landing_stat3_number || "50+"}</h3>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs lg:text-sm leading-snug max-w-[180px] min-h-[40px] flex items-start justify-center">{statLabel("landing_stat3_label", t.home.stat3Label)}</p>
          </div>
        </div>
      </section>

      {/* Where the mentors teach */}
      <UniversitiesStrip />

      {/* Open cohorts: the primary conversion path */}
      <OpenProgramsSection programs={openPrograms} className="bg-[#FAFAFA]" />

      {/* Three steps to a decision */}
      <HowItWorks />

      {/* Philosophy Section */}
      <section className="pt-24 pb-32 relative z-10 bg-white">
        <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">{t.home.philosophyTitle.before}<span className="italic font-serif text-blue-600 tracking-normal">{t.home.philosophyTitle.word}</span>{t.home.philosophyTitle.after}</h2>
            <p className="text-xl text-gray-500 leading-relaxed font-medium">{t.home.philosophyIntro}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                ...t.home.philosophy[0],
                icon: <BookOpen className="h-7 w-7 text-indigo-600" />,
                gradient: "from-blue-50 to-indigo-50"
              },
              {
                ...t.home.philosophy[1],
                icon: <UserCheck className="h-7 w-7 text-purple-600" />,
                gradient: "from-indigo-50 to-purple-50"
              },
              {
                ...t.home.philosophy[2],
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

      {/* FAQ */}
      <FaqSection />

      {/* Closing CTA */}
      <section className="relative z-10 bg-white px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto relative rounded-[3rem] overflow-hidden bg-gray-950 text-center py-20 md:py-24 px-8 border border-gray-800"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-2xl bg-gradient-to-b from-blue-500/20 to-transparent blur-[100px] pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{t.home.ctaTitle}</h2>
            <p className="text-xl text-gray-400">
              {t.home.ctaBody}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
              <Link href="#open-programs" className="px-8 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-xl shadow-white/10 inline-flex items-center justify-center">
                {openCount > 0 ? t.home.ctaApply : t.home.ctaSee} <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link href="/contact" className="px-8 py-4 bg-white/10 text-white border border-white/20 font-bold rounded-xl hover:bg-white/20 transition-all inline-flex items-center justify-center">
                {t.home.ctaAsk}
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <MobileApplyBar openCount={openCount} />
    </div>
  );
}
