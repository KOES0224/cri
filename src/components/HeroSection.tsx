"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";

const Counter = ({ from, to, duration = 2, suffix = "" }: { from: number, to: number, duration?: number, suffix?: string }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true, margin: "-50px" });
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (!inView) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      setValue(Math.floor(progress * (to - from) + from));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setValue(to);
      }
    };
    window.requestAnimationFrame(step);
  }, [inView, from, to, duration]);

  // Format with decimal if to has decimal (e.g., 99.2)
  const isFloat = to % 1 !== 0;
  const displayValue = isFloat ? (value * (to / to)).toFixed(1) : value;

  return <span ref={nodeRef}>{displayValue}{suffix}</span>;
};

export default function HeroSection() {
  const scrollToCTA = () => {
    document.getElementById("cta-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative w-full h-screen flex flex-col justify-between overflow-hidden bg-deepNavy">
      {/* Background Image & Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Harvard_University_Widener_Library.jpg/2560px-Harvard_University_Widener_Library.jpg')] bg-cover bg-center grayscale"
      />
      <div className="absolute inset-0 z-0 bg-black/70 mix-blend-multiply" />

      {/* Sticky GNB */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav px-8 py-4 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-serif font-bold tracking-wider text-white">CRI</span>
          <span className="text-[10px] font-bold tracking-widest text-obsidianBlack bg-champagneGold px-2 py-0.5 rounded-sm">
            PRIVATE ONLY
          </span>
        </div>
        <button 
          onClick={scrollToCTA}
          className="bg-champagneGold text-obsidianBlack text-sm font-semibold px-6 py-2.5 rounded-sm hover:bg-white hover:text-obsidianBlack transition-colors duration-300 shadow-[0_0_15px_rgba(212,175,55,0.3)]"
        >
          프라이빗 미팅 예약
        </button>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: "easeOut" }}
          className="mb-8 px-5 py-2 border border-white/20 rounded-full bg-white/5 backdrop-blur-md"
        >
          <span className="text-xs md:text-sm text-gray-300 font-light tracking-wide font-sans">
            🏆 최근 실적: <strong className="text-white font-medium">NLCS 제주</strong>에서 <strong className="text-champagneGold font-semibold drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]">스탠포드(Stanford) 합격생</strong> 배출
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-7xl font-serif font-bold leading-tight max-w-5xl tracking-tight"
        >
          진짜 연구가 만드는 <br className="hidden md:block"/>
          <span className="text-champagneGold drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]">
            압도적 격차
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          className="mt-8 text-lg md:text-xl text-gray-300 font-light max-w-3xl font-serif tracking-wide"
        >
          글로벌 명문대 진학을 위한 귀원만의 하이엔드 아카데믹 R&D 파트너
        </motion.p>
        
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.6 }}
          onClick={scrollToCTA}
          className="mt-12 group flex items-center gap-2 text-white border border-white/30 px-8 py-4 rounded-sm hover:bg-white hover:text-obsidianBlack transition-all duration-300 font-medium tracking-wide"
        >
          파트너십 워크플로우 확인하기
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </motion.button>
      </div>

      {/* Data Ticker */}
      <div className="relative z-10 w-full bg-gradient-to-t from-deepNavy to-transparent pb-12 pt-20 px-8 md:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10">
          <div className="flex flex-col items-center justify-center text-center pt-8 md:pt-0">
            <h3 className="text-4xl md:text-5xl font-bold font-serif mb-3 text-white">
              <Counter from={0} to={250} duration={2} suffix="+" />
            </h3>
            <p className="text-sm md:text-base text-gray-400 font-light max-w-[200px]">
              글로벌 탑티어 대학 <br/>종신 교수 및 수석 연구원
            </p>
          </div>
          <div className="flex flex-col items-center justify-center text-center pt-8 md:pt-0">
            <h3 className="text-4xl md:text-5xl font-bold font-serif mb-3 text-white">
              <Counter from={0} to={99.2} duration={2} suffix="%" />
            </h3>
            <p className="text-sm md:text-base text-gray-400 font-light max-w-[200px]">
              3중 아카데믹 디렉팅이 <br/>증명하는 무결점 완주율
            </p>
          </div>
          <div className="flex flex-col items-center justify-center text-center pt-8 md:pt-0">
            <h3 className="text-4xl md:text-5xl font-bold font-serif mb-3 text-white">
              <Counter from={0} to={100} duration={2} suffix="%" />
            </h3>
            <p className="text-sm md:text-base text-gray-400 font-light max-w-[200px]">
              논문, 웹서비스 등 <br/>사정관을 압도할 실물 자산 구축
            </p>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 z-10"
      >
        <span className="text-[10px] uppercase tracking-widest text-white/70">Scroll Down</span>
        <div className="h-8 border-l border-white/30 relative">
          <ChevronDown className="absolute -bottom-3 -left-[7px] w-3 h-3 text-white/50" />
        </div>
      </motion.div>
    </section>
  );
}
