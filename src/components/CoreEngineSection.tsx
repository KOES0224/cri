"use client";

import { motion } from "framer-motion";

const faculties = [
  {
    id: 1,
    name: "Prof. Sam Kunes",
    university: "Harvard University",
    track: "Bio & Pre-Med",
    focus: "의대 및 바이오 지망 VIP 전담 심화 연구",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop", // Placeholder for actual profile
  },
  {
    id: 2,
    name: "Prof. Haifeng Xu",
    university: "University of Chicago",
    track: "AI & Data Science",
    focus: "최상위 공대 및 ISEF 국가대표 트랙 전담",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop", // Placeholder for actual profile
  },
  {
    id: 3,
    name: "Prof. Kit Hickey",
    university: "MIT",
    track: "Business & Entrepreneurship",
    focus: "비즈니스 모델링 및 실물 스타트업 창업 피칭 전담",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop", // Placeholder for actual profile
  },
  {
    id: 4,
    name: "Prof. Robin Murphy",
    university: "Oxford University",
    track: "Psychology & Social Science",
    focus: "문과 최상위권 데이터 기반 실증 연구 전담",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=800&auto=format&fit=crop", // Placeholder for actual profile
  }
];

export default function CoreEngineSection() {
  return (
    <section className="w-full bg-deepCharcoal py-32 px-6 md:px-16" id="core-engine">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Section Header */}
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-5xl font-serif font-bold text-white mb-6 leading-tight"
          >
            평범한 스펙을 &#39;아이비리그급 학술 자산&#39;으로 벼려내는<br className="hidden md:block" /> CRI의 핵심 엔진
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 font-light font-serif"
          >
            하버드, MIT, 옥스퍼드 등 글로벌 탑티어 종신 교수진의 1:1 아카데믹 디렉팅
          </motion.p>
        </div>

        {/* Faculty Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {faculties.map((prof, index) => (
            <motion.div
              key={prof.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group relative w-full aspect-[3/4] bg-black overflow-hidden cursor-pointer"
            >
              {/* Image */}
              <img 
                src={prof.image} 
                alt={prof.name} 
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out scale-100 group-hover:scale-105"
              />
              
              {/* Default Bottom Gradient Overlay (always visible) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

              {/* Hover Dark Overlay covering entire card */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              {/* Border Glow */}
              <div className="absolute inset-0 border border-white/10 group-hover:border-champagneGold/50 group-hover:shadow-[inset_0_0_20px_rgba(212,175,55,0.2)] transition-all duration-500 pointer-events-none" />

              {/* Default Content (Bottom) */}
              <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center text-center transform translate-y-0 group-hover:-translate-y-8 transition-transform duration-500 ease-out z-10">
                <h4 className="text-xl font-serif font-bold text-white mb-1 group-hover:text-champagneGold transition-colors duration-300">
                  {prof.name}
                </h4>
                <p className="text-sm text-gray-300 font-medium tracking-wide">
                  {prof.university}
                </p>
              </div>

              {/* Hover Slid-up Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center text-center translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100 ease-out z-10">
                <p className="text-xs font-bold text-champagneGold uppercase tracking-widest mb-2 border-t border-champagneGold/30 pt-3 w-full">
                  {prof.track}
                </p>
                <p className="text-sm font-light text-white leading-relaxed">
                  {prof.focus}
                </p>
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
