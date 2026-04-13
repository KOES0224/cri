"use client";

import { motion } from "framer-motion";
import { MessageCircle, FileText, CheckCircle2, ShieldCheck } from "lucide-react";

export default function WorkflowCTASection() {
  return (
    <section className="w-full bg-[#1A1A1A] py-32 px-6 md:px-16" id="cta-section">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Section Header */}
        <div className="text-center mb-24 max-w-4xl">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white mb-6 leading-tight whitespace-pre-line"
          >
            원장님을 위한 프라이빗 패스트트랙: <br className="hidden md:block" />
            귀원의 학생들을 위한 맞춤형 <span className="text-champagneGold">'연구 기획안'</span>부터 <br className="hidden md:block" />
            무상으로 받아보십시오.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 font-light font-serif tracking-wide"
          >
            완벽한 포트폴리오를 향한 마지막 퍼즐, CRI와의 프라이빗 파트너십
          </motion.p>
        </div>

        {/* 2-Column Layout */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Workflow */}
          <div className="flex flex-col space-y-12">
            {[ 
              { step: "Step 1", title: "키워드 전달", desc: "원장님은 학생의 막연한 관심사(전공, 취미 등) '키워드'만 당사로 전달해 주십시오.", icon: <MessageCircle className="w-6 h-6 text-champagneGold" /> },
              { step: "Step 2", title: "기획안 무상 수령", desc: "CRI의 석학들이 이를 하이엔드 주제로 격상시킨 '3가지 맞춤형 학술 기획안'을 무상으로 제안해 드립니다.", icon: <FileText className="w-6 h-6 text-champagneGold" /> },
              { step: "Step 3", title: "학부모 클로징", desc: "이 기획안을 무기 삼아 클로징을 진행하십시오. 결제가 완료된 후 프로젝트가 가동됩니다.", icon: <CheckCircle2 className="w-6 h-6 text-champagneGold" /> }
            ].map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="flex items-start gap-6 group"
              >
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full border border-white/20 bg-deepNavy flex items-center justify-center group-hover:border-champagneGold group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all duration-300">
                    {item.icon}
                  </div>
                  {/* Line connector */}
                  {index !== 2 && <div className="w-[1px] h-16 bg-white/10 mt-4 group-hover:bg-champagneGold/50 transition-colors duration-300" />}
                </div>
                <div className="pt-2">
                  <p className="text-champagneGold font-bold text-sm uppercase tracking-widest mb-1">{item.step}</p>
                  <h4 className="text-2xl font-serif text-white font-bold mb-2">{item.title}</h4>
                  <p className="text-gray-400 font-medium leading-relaxed max-w-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Column: Lead Form & Trust Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="w-full bg-[#111111] border border-white/10 p-10 md:p-14 rounded-sm flex flex-col items-center text-center relative"
          >
            {/* Trust Badge */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-deepNavy border border-champagneGold px-6 py-3 rounded-full flex items-center gap-3 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              <ShieldCheck className="w-5 h-5 text-champagneGold" />
              <span className="text-white font-serif font-bold text-sm md:text-base tracking-wide whitespace-nowrap">B2B Exclusive R&D Partnership</span>
            </div>

            <p className="text-gray-300 text-base md:text-lg leading-relaxed mt-8 mb-12 max-w-md">
              "원장님은 <span className="text-white font-bold">'입시 기획'</span>에, <br/>
              CRI는 <span className="text-white font-bold">'학술 증거 생산'</span>에 집중합니다.<br/><br/>
              철저한 역할 분담을 통해 귀원만의 <br/>독점적인 아카데믹 포트폴리오를 완성하십시오."
            </p>

            {/* Kakao CTA Button */}
            <a 
              href="http://pf.kakao.com/_xhdzxln/chat" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full relative group inline-block"
            >
              {/* Pulsing Glow behind button */}
              <div className="absolute -inset-1 bg-champagneGold/50 blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse rounded-sm"></div>
              
              <div className="relative w-full bg-[#FFE812] hover:bg-[#F4DF00] transition-colors duration-300 px-8 py-5 rounded-sm flex items-center justify-center gap-3 cursor-pointer">
                {/* Simulated Kakao Icon */}
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#3A1D1D]">
                  <path d="M12 3c-5.523 0-10 3.582-10 8 0 2.862 1.83 5.358 4.606 6.745-.226.797-.817 2.875-.845 2.993-.035.15.05.148.106.113.076-.048 2.457-1.637 3.447-2.327.852.235 1.75.362 2.686.362 5.523 0 10-3.582 10-8s-4.477-8-10-8z"/>
                </svg>
                <span className="text-[#3A1D1D] font-bold text-lg md:text-xl tracking-tight">파트너십 전담 디렉터와 즉시 상담하기</span>
              </div>
            </a>
            
            <p className="text-gray-500 text-xs mt-6">
              * 상담 접수 시, 영업일 기준 1시간 이내에 프라이빗 디렉터가 배정됩니다.
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
