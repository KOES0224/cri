"use client";

import Link from "@/i18n/link";
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
    <div className="flex flex-col min-h-screen bg-white font-sans overflow-hidden">

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
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none transition-opacity duration-700 ease-in-out hoverable:opacity-100 hoverable:group-hover:opacity-0 hoverable:group-focus-within:opacity-0 hidden hoverable:flex" aria-hidden="true">
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
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-10 transition-opacity duration-700 ease-in-out opacity-100 hoverable:opacity-0 hoverable:group-hover:opacity-100 hoverable:group-focus-within:opacity-100 pointer-events-auto hoverable:pointer-events-none hoverable:group-hover:pointer-events-auto">
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
            className={`hero-fade-up ${locale === "ko" ? "text-5xl md:text-7xl" : "text-6xl md:text-8xl"} font-black tracking-tighter text-white leading-[1.1] drop-shadow-2xl`}
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

      {/* Every band below the hero shares one container (max-w-7xl), one heading pattern and one vertical rhythm;
          bands alternate white and a soft grey so each section reads as its own block. */}

      {/* Statistics (Managed by CMS) */}
      <section className="relative z-20 -mt-14 md:-mt-20 px-6">
        <div className="mx-auto max-w-7xl">
          <dl className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-900/5">
            {[
              { number: content.landing_stat1_number || "100%", label: statLabel("landing_stat1_label", t.home.stat1Label), color: "text-gray-900" },
              { number: content.landing_stat2_number || "#1", label: statLabel("landing_stat2_label", t.home.stat2Label), color: "text-blue-600" },
              { number: content.landing_stat3_number || "50+", label: statLabel("landing_stat3_label", t.home.stat3Label), color: "text-purple-600" },
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center px-6 py-8 md:py-10 text-center">
                <dd className={`order-first text-4xl lg:text-5xl font-black tracking-tight whitespace-nowrap ${stat.color}`}>{stat.number}</dd>
                <dt className="mt-2 max-w-[220px] text-sm font-semibold leading-snug text-gray-500">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Where the mentors teach */}
      <UniversitiesStrip />

      {/* Open cohorts: the primary conversion path */}
      <OpenProgramsSection programs={openPrograms} className="mt-16 md:mt-20 bg-[#F4F5F8] border-y border-gray-100" />

      {/* Three steps to a decision */}
      <HowItWorks />

      {/* Philosophy */}
      <section className="relative z-10 bg-[#F4F5F8] border-y border-gray-100 px-6 py-20 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl md:mb-12">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-blue-700">{t.home.philosophyEyebrow}</p>
            <h2 className="mb-4 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">{t.home.philosophyTitle.before}<span className={locale === "ko" ? "text-blue-600" : "italic font-serif font-semibold text-blue-600 tracking-normal"}>{t.home.philosophyTitle.word}</span>{t.home.philosophyTitle.after}</h2>
            <p className="text-lg leading-relaxed text-gray-600">{t.home.philosophyIntro}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { ...t.home.philosophy[0], icon: <BookOpen className="h-6 w-6 text-indigo-600" />, tint: "bg-indigo-50" },
              { ...t.home.philosophy[1], icon: <UserCheck className="h-6 w-6 text-purple-600" />, tint: "bg-purple-50" },
              { ...t.home.philosophy[2], icon: <Award className="h-6 w-6 text-pink-600" />, tint: "bg-pink-50" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative rounded-3xl border border-gray-200/80 bg-white p-8 premium-card"
              >
                <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${feature.tint} transition-transform duration-300 group-hover:scale-110`}>
                  {feature.icon}
                </div>
                <h3 className="mb-3 text-xl font-black tracking-tight text-gray-900">{feature.title}</h3>
                <p className="leading-relaxed text-gray-600">{feature.description}</p>
                <div className="absolute right-7 top-7 text-gray-300 opacity-0 transition-all duration-300 group-hover:-translate-y-1 group-hover:text-gray-900 group-hover:opacity-100">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FaqSection />

      {/* Closing CTA */}
      <section className="relative z-10 bg-white px-6 pb-20 md:pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-gray-800 bg-gray-950 px-8 py-16 text-center md:py-20"
        >
          <div className="pointer-events-none absolute left-1/2 top-0 h-full w-full max-w-2xl -translate-x-1/2 bg-gradient-to-b from-blue-500/20 to-transparent blur-[100px]"></div>
          <div className="relative z-10 mx-auto max-w-2xl space-y-6">
            <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">{t.home.ctaTitle}</h2>
            <p className="text-lg leading-relaxed text-gray-400">
              {t.home.ctaBody}
            </p>
            <div className="flex flex-col justify-center gap-4 pt-2 sm:flex-row">
              <Link href="#open-programs" className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 font-bold text-gray-900 shadow-xl shadow-white/10 transition-all hover:bg-gray-100">
                {openCount > 0 ? t.home.ctaApply : t.home.ctaSee} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-8 py-4 font-bold text-white transition-all hover:bg-white/20">
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
