"use client";

import { motion } from "framer-motion";

const dilemmas = [
  {
    id: 1,
    title: "[프로필 1]",
    before: "방학 중 해외 썸머 캠프 참가와 SAT/AP 수강 사이에서 양자택일을 고민하는 학생",
    afterTitle: "[교수진 직접 방한]",
    afterDesc: "출국없이 강남 대면 지도로 학원 스케줄과 리서치 100% 병행"
  },
  {
    id: 2,
    title: "[프로필 2]",
    before: "에세이 스토리는 기획되었으나, 사정관을 압도할 '대학원급 실물 데이터'가 부재한 학생",
    afterTitle: "[스펙의 무한 연쇄]",
    afterDesc: "맞춤형 논문 출판 후 교수 회사 인턴십, 대회 준비, 개인 프로젝트로 연결"
  },
  {
    id: 3,
    title: "[프로필 3]",
    before: "흔한 스펙만 보유하여, '프리미엄 컨설팅 패키지' 최종 등록을 망설이는 학부모",
    afterTitle: "[독보적 프리미엄 스펙 장착]",
    afterDesc: "'아이비리그 정교수 1:1 연구'라는 독보적 자산을 결합하여, 프리미엄 컨설팅 패키지 가치 극대화"
  }
];

export default function DilemmaSection() {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 px-5 md:px-8 lg:px-16" id="dilemma" style={{ background: 'radial-gradient(circle at center left, rgba(20,5,15,0.7), transparent 60%)' }}>
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-20 max-w-4xl">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-4 lg:mb-6 leading-tight tracking-tight"
          >
            3대 현실적 딜레마
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base md:text-lg lg:text-xl text-gray-300 font-medium tracking-wide font-sans mb-8 lg:mb-12 word-break-keep"
          >
            오직 CRI 프리미엄 인프라만이 해결할 수 있는 한계.
          </motion.p>
        </div>

        {/* Flat List Grid (Visible at a glance) */}
        <div className="w-full flex flex-col gap-6 lg:gap-8 max-w-6xl">
          {dilemmas.map((dilemma, index) => (
            <motion.div
              key={dilemma.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="group grid grid-cols-1 xl:grid-cols-[1fr_auto_1.2fr] items-center gap-8 xl:gap-12 bg-[#0F0F12]/60 border border-white/5 rounded-[24px] xl:rounded-[28px] p-8 md:p-10 xl:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.3)] hover:-translate-y-1 hover:border-[#e5c384]/30 hover:shadow-[0_15px_50px_rgba(0,0,0,0.5)] transition-all duration-300"
            >
              
              {/* Before Section */}
              <div className="flex flex-col justify-center border-l-4 border-l-[#ff5050]/40 pl-5 md:pl-6 h-full">
                <span className="text-[#ff8888] text-[0.85rem] lg:text-[0.95rem] font-bold mb-3 md:mb-4 tracking-widest uppercase inline-block w-max">
                  {dilemma.title} 학생 케이스
                </span>
                <h3 className="text-[1.1rem] md:text-[1.25rem] xl:text-[1.3rem] text-white/90 leading-[1.65] font-semibold break-keep m-0">
                  {dilemma.before}
                </h3>
              </div>

              {/* Connecting Arrow */}
              <div className="flex justify-center items-center text-[#e5c384]/40 border border-[#e5c384]/20 p-3 md:p-4 rounded-full bg-[#e5c384]/5 xl:transform-none transform rotate-90 self-center w-max mx-auto xl:mx-0 shadow-inner">
                <svg className="w-5 h-5 md:w-6 md:h-6 stroke-current" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M5 12h14m-7-7l7 7-7 7" />
                </svg>
              </div>

              {/* After Section */}
              <div className="flex flex-col justify-center border-l-4 border-l-[#e5c384] pl-5 md:pl-6 h-full">
                <span className="text-[#e5c384] text-[0.85rem] lg:text-[0.95rem] font-extrabold mb-3 md:mb-4 tracking-widest uppercase inline-block w-max">
                  {dilemma.afterTitle} CRI 솔루션
                </span>
                <p className="text-[1.2rem] md:text-[1.35rem] xl:text-[1.45rem] text-white font-bold leading-[1.65] m-0 break-keep">
                  {dilemma.afterDesc}
                </p>
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
