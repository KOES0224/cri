"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    id: 1,
    role: "The Architect",
    subtitle: "아이비리그 종신 교수진",
    summary: "하이엔드 아카데믹 로직 및 연구 주제 설계",
    detail: "원장님의 초기 기획을 바탕으로, 글로벌 탑티어 사정관을 압도할 수 있는 연구 가설과 학술적 프레임워크를 교수님이 직접 1:1로 세팅합니다. (방향성 상실 리스크 0%)",
  },
  {
    id: 2,
    role: "The Executor",
    subtitle: "명문대 석/박사 전담 TA",
    summary: "데이터 분석, 코딩, 실험 등 실무적 병목 현상 밀착 튜터링",
    detail: "\"아이가 코딩을 못 해서/통계를 몰라서 멈췄어요\"라는 변명은 통하지 않습니다. 전담 TA가 학생의 부족한 기술적 역량을 1:1로 가르치며 실물 자산을 직접적으로 구현합니다. (실무 역량 부족 리스크 0%)",
  },
  {
    id: 3,
    role: "The Controller",
    subtitle: "전담 아카데믹 코디네이터",
    summary: "데드라인 통제, 멘탈 케어 및 학부모 리포팅",
    detail: "원장님이 중간에 개입하실 필요가 없습니다. 철저한 일정 관리와 멘탈 케어로 학생의 이탈을 방어하며, 원장님께는 학부모 상담용 '프로그레스 리포트'만 깔끔하게 제공됩니다. (중도 포기 리스크 0%)",
  }
];

export default function PipelineSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  // Grow glowing line based on scroll
  const glowHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section className="relative w-full bg-[#111111] py-32 overflow-hidden" id="pipeline" ref={containerRef}>
      <div className="max-w-7xl mx-auto px-6 md:px-16 flex flex-col items-center">
        
        {/* Section Header */}
        <div className="text-center mb-24 z-10">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-5xl font-serif font-bold text-white mb-6 leading-tight"
          >
            기획부터 실물 자산 구축까지: <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-champagneGold drop-shadow-[0_0_10px_rgba(0,229,255,0.3)]">
              99.2% 완주율
            </span>을 보장하는 무결점 공정
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 font-light"
          >
            학생의 역량 부족이나 이탈을 원천 차단하는 CRI만의 3중 아카데믹 안전망(Scaffolding)
          </motion.p>
        </div>

        {/* Pipeline Layout */}
        <div className="relative w-full max-w-4xl mx-auto h-[1200px] md:h-[900px] flex flex-col justify-between">
          
          {/* Default Dark Line */}
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-1 bg-white/10 md:-translate-x-1/2 z-0 rounded-full" />
          
          {/* Animated Glow Line */}
          <motion.div 
            style={{ height: glowHeight }}
            className="absolute left-6 md:left-1/2 top-0 w-1 bg-gradient-to-b from-[#00E5FF] to-champagneGold md:-translate-x-1/2 z-10 rounded-full shadow-[0_0_15px_rgba(212,175,55,0.8)]"
          />

          {steps.map((step, index) => {
            // Determine side for desktop (left, right, left)
            const isLeft = index % 2 === 0;
            
            return (
              <div 
                key={step.id} 
                className={`relative z-20 flex flex-col md:flex-row items-start md:items-center w-full my-8 ${isLeft ? "md:flex-row" : "md:flex-row-reverse"}`}
              >
                {/* Node Dot Container */}
                <div className="absolute left-6 md:left-1/2 w-8 h-8 -translate-x-[14px] md:-translate-x-1/2 flex items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.5, backgroundColor: "#333", borderColor: "#555" }}
                    whileInView={{ scale: 1, backgroundColor: "#D4AF37", borderColor: "#00E5FF" }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-5 h-5 rounded-full border-2 shadow-[0_0_15px_rgba(0,229,255,0.6)] z-20"
                  />
                </div>

                {/* Content Card */}
                <div className={`w-full md:w-1/2 pl-16 pr-0 md:px-12 flex ${isLeft ? "md:justify-end text-left md:text-right" : "md:justify-start text-left"}`}>
                  <motion.div 
                    initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="bg-deepCharcoal/80 backdrop-blur-sm border border-white/10 p-8 rounded-sm hover:border-champagneGold/50 transition-colors duration-500 w-full max-w-[400px]"
                  >
                    <p className="text-[#00E5FF] font-bold text-sm tracking-widest uppercase mb-2">Step {step.id}</p>
                    <h3 className="text-2xl font-serif text-white font-bold mb-1">{step.role}</h3>
                    <p className="text-champagneGold text-sm font-medium mb-6">[{step.subtitle}]</p>
                    <p className="text-white text-base font-medium mb-3 border-b border-white/10 pb-3">{step.summary}</p>
                    <p className="text-gray-400 text-sm leading-relaxed">{step.detail}</p>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
