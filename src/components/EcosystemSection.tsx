"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Check, X } from "lucide-react";

export default function EcosystemSection() {
  const [isRightHovered, setIsRightHovered] = useState(false);

  return (
    <section className="w-full bg-white py-32 px-6 md:px-16" id="ecosystem">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Section Header */}
        <div className="text-center mb-20 max-w-4xl">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-5xl font-serif font-bold text-obsidianBlack mb-6 leading-tight"
          >
            수십 명 중 한 명으로 남을 것인가, <br className="hidden md:block" />
            압도적인 <span className="text-deepNavy font-black border-b-4 border-champagneGold">'학술 생태계'</span>에 올라탈 것인가
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-500 font-medium tracking-wide font-sans"
          >
            기존 해외 캠프의 시공간적 한계를 파괴한 CRI만의 독점적 메리트
          </motion.p>
        </div>

        {/* Split UI Card */}
        <div 
          className="w-full max-w-5xl rounded-lg overflow-hidden flex flex-col md:flex-row shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500"
          onMouseEnter={() => setIsRightHovered(true)}
          onMouseLeave={() => setIsRightHovered(false)}
        >
          {/* Left Side (Overseas Camp) */}
          <div className={`w-full md:w-1/2 p-10 md:p-16 flex flex-col bg-gray-50 border-r border-gray-200 transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isRightHovered ? "opacity-30 grayscale saturate-0 scale-[0.98] bg-gray-100" : "opacity-100 scale-100"}`}>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <X className="text-gray-500 w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold font-serif text-gray-500 px-2 py-1 bg-gray-200 line-through decoration-2">
                기존 해외 썸머 캠프
              </h3>
            </div>

            <div className="space-y-12">
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 line-through">시공간 및 스케줄 효율</p>
                <p className="text-gray-500 text-lg">방학 중 미국 출국 필수 ➔ SAT/AP 학원 스케줄 단절 및 리스크 발생</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 line-through">결과물의 한계</p>
                <p className="text-gray-500 text-lg">수십 명과 함께 듣고 끝나는 1회성 '참가 수료증'</p>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 line-through">멘토링의 지속성</p>
                <p className="text-gray-500 text-lg">캠프 종료와 함께 멘토/교수와의 관계 일회성 단절</p>
              </div>
            </div>
          </div>

          {/* Right Side (CRI Ecosystem) */}
          <div className={`relative w-full md:w-1/2 p-10 md:p-16 flex flex-col bg-deepNavy border border-transparent transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] origin-left ${isRightHovered ? "scale-105 border-champagneGold shadow-[-10px_0_30px_rgba(0,0,0,0.2)] z-10" : "scale-100"}`}>
            
            {/* Glow when hovered */}
            <div className={`absolute inset-0 border-2 border-champagneGold shadow-[0_0_30px_rgba(212,175,55,0.4)] pointer-events-none transition-opacity duration-700 ${isRightHovered ? 'opacity-100' : 'opacity-0'}`} />

            <div className="flex items-center gap-3 mb-10 relative z-10">
              <div className="w-10 h-10 rounded-full bg-champagneGold flex items-center justify-center">
                <Check className="text-obsidianBlack w-6 h-6 stroke-[3px]" />
              </div>
              <h3 className="text-3xl font-bold font-serif text-white">
                CRI Ecosystem
              </h3>
            </div>

            <div className="space-y-12 relative z-10">
              <div>
                <p className="text-sm font-bold text-champagneGold uppercase tracking-widest mb-2">The Seoul Advantage</p>
                <p className="text-white text-lg font-medium leading-relaxed">아이비리그 교수의 직접 방한(서울 대면 리서치) ➔ <span className="underline decoration-champagneGold underline-offset-4">SAT/AP 시험 준비와 최고급 EC(비교과)의 완벽한 투트랙 병행</span></p>
              </div>
              <div>
                <p className="text-sm font-bold text-champagneGold uppercase tracking-widest mb-2">The Ecosystem Advantage</p>
                <p className="text-white text-lg font-medium leading-relaxed">실물 논문 출판은 기본, 교수가 운영하는 실제 기업 인턴십 및 <span className="underline decoration-champagneGold underline-offset-4">글로벌 창업 대회 피칭으로 이어지는 무한한 스펙 연쇄(Snowballing)</span></p>
              </div>
              <div>
                <p className="text-sm font-bold text-champagneGold uppercase tracking-widest mb-2">The Network Advantage</p>
                <p className="text-white text-lg font-medium leading-relaxed">장기 프로젝트를 통한 깊은 유대감 형성 ➔ <span className="underline decoration-champagneGold underline-offset-4">대학 지원 시 종신 교수의 강력하고 개인적인 추천서(Recommendation Letter) 가동</span></p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
