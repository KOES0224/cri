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
    <section className="w-full py-32 px-6 md:px-16" id="dilemma" style={{ background: 'radial-gradient(circle at center left, rgba(20,5,15,0.7), transparent 60%)' }}>
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Section Header */}
        <div className="text-center mb-20 max-w-4xl">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-tight tracking-tight"
          >
            3대 현실적 딜레마
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-300 font-medium tracking-wide font-sans mb-12 word-break-keep"
          >
            오직 CRI 프리미엄 인프라만이 해결할 수 있는 한계.
          </motion.p>
        </div>

        {/* 3D Flip Card Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-10 perspective-1000">
          {dilemmas.map((dilemma, index) => (
            <motion.div
              key={dilemma.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="group h-[380px] w-full"
              style={{ perspective: "1000px" }}
            >
              <div className="relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] cursor-pointer">
                
                {/* Front Side (Before) */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#1E1419] to-[#0F0F12] border border-[#ff5050]/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-10 flex flex-col justify-start [backface-visibility:hidden] rounded-[28px]">
                  <span className="text-[#ff8888] bg-[#ff5050]/10 px-4 py-1.5 rounded-full text-[0.95rem] font-bold inline-block mb-8 self-start">
                    {dilemma.title}
                  </span>
                  <h3 className="text-[1.5rem] text-white leading-relaxed font-semibold break-keep">
                    {dilemma.before}
                  </h3>
                  <div className="mt-auto text-[0.9rem] text-white/30 flex items-center justify-end gap-2 font-medium uppercase tracking-wider">
                    <span>Hover to Flip</span>
                    <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
                  </div>
                </div>

                {/* Back Side (After) */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#e5c384]/15 to-black/80 border border-[#e5c384]/40 shadow-[0_10px_40px_rgba(229,195,132,0.2)] p-10 flex flex-col justify-start text-left [transform:rotateY(180deg)] [backface-visibility:hidden] rounded-[28px]">
                  <span className="text-[#e5c384] bg-[#e5c384]/15 px-4 py-1.5 rounded-full text-[0.95rem] font-extrabold inline-block mb-8 self-start">
                    {dilemma.afterTitle}
                  </span>
                  <p className="text-[1.3rem] text-white/95 leading-[1.65] font-medium break-keep">
                    {dilemma.afterDesc}
                  </p>
                </div>

              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
