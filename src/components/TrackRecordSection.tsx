"use client";

import { motion } from "framer-motion";

const records = [
  {
    id: 1,
    beforeQuote: "원장님, 우리 애가 심리학이나 뇌과학 쪽에 관심은 있다는데 아직 전공은 못 정했어요.",
    beforeDesc: "(막연한 관심사만으로 최상위권의 뾰족한 학술 훅을 뽑아내야 하는 막막함)",
    afterMentor: "Oxford 인지심리학 Robin Murphy 교수팀의 학술 설계",
    afterDesc: "막연한 관심을 '통제된 심리 실험(참가자 40명)'으로 구체화. '눈물이 무기력함 인지와 사회적 지원 행동을 유발하는 기전'을 통계적으로 입증한 실증 논문 도출.",
    result: "제주 NLCS 4년 만의 스탠포드(Stanford) 합격!"
  },
  {
    id: 2,
    beforeQuote: "의대 지망생이고 가족 병력 스토리는 에세이로 기획했는데, 고등학생이라 병원 랩실(Lab) 인턴십도 없고 학술적으로 증명할 스펙이 없네요.",
    beforeDesc: "(실증적 스펙 부재)",
    afterMentor: "Harvard/UCSF Jason Sello 교수팀의 실물 자산 구축",
    afterDesc: "랩실이 없어도 가능한 최고 수준의 'In-silico(컴퓨터 시뮬레이션 기반) 연구'로 전환. 에세이를 완벽히 증명하는 '자폐 스펙트럼(ASD) 치료제 재창출 분자 기전도' 학술 증거 구축.",
    result: "하버드(Harvard) 전액 장학생 합격 및 교수 직속 추천서 확보!"
  },
  {
    id: 3,
    beforeQuote: "컴공 지망생인데 코딩 동아리에서 앱 몇 개 만들어본 게 전부예요. 최상위권 공대 애들은 다 하는 수준이라 사정관 눈에 띌 무기가 없습니다.",
    beforeDesc: "(단순 스펙의 한계)",
    afterMentor: "영국 Durham 대학교 우주론 연구원의 하이엔드 로직 이식",
    afterDesc: "단순 코딩을 '천체물리학'과 결합하여 '슈퍼컴퓨터 데이터를 활용한 초기 우주 은하 예측 AI 알고리즘'이라는 거대한 융합 연구 자산으로 격상.",
    result: "최고 권위 국제과학경진대회(ISEF) 한국 국가대표 선발!"
  }
];

export default function TrackRecordSection() {
  return (
    <section className="w-full bg-[#F9F9F9] py-32 px-6 md:px-16" id="track-record">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Section Header */}
        <div className="text-center mb-20 max-w-4xl">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-obsidianBlack mb-6 leading-tight"
          >
            원장님의 책상에 놓인 막연한 고민들, <br className="hidden md:block" />
            CRI의 석학들이 <span className="text-champagneGold">'압도적 학술 증거'</span>로 돌파합니다.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-500 font-medium tracking-wide font-sans"
          >
            단순한 기획을 넘어, 사정관이 요구하는 하이엔드 실물 자산(논문/AI/통계)을 구축해 낸 실제 레퍼런스
          </motion.p>
        </div>

        {/* 3D Flip Card Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 perspective-1000">
          {records.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="group h-[450px] w-full"
              style={{ perspective: "1000px" }}
            >
              <div className="relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] shadow-xl rounded-sm">
                
                {/* Front Side (Before) */}
                <div className="absolute inset-0 bg-white border border-gray-200 p-8 flex flex-col justify-center [backface-visibility:hidden] rounded-sm">
                  <div className="text-4xl text-gray-300 font-serif mb-4">"</div>
                  <p className="text-lg text-gray-600 italic font-serif leading-relaxed mb-6">
                    {record.beforeQuote}
                  </p>
                  <p className="text-sm text-gray-400">
                    {record.beforeDesc}
                  </p>
                </div>

                {/* Back Side (After) */}
                <div className="absolute inset-0 bg-deepNavy text-white p-8 flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden] rounded-sm border border-champagneGold/30">
                  <div>
                    <h4 className="text-champagneGold font-bold text-sm uppercase tracking-widest mb-4 inline-block border-b border-champagneGold/30 pb-2">
                      [{record.afterMentor}]
                    </h4>
                    <p className="text-base text-gray-200 mt-2 font-medium leading-relaxed font-sans mb-6">
                      {record.afterDesc}
                    </p>
                  </div>
                  
                  <div className="relative mt-auto border-t border-white/20 pt-6">
                    <p className="text-champagneGold font-bold text-lg font-serif animate-pulse drop-shadow-[0_0_10px_rgba(212,175,55,0.6)]">
                      🏆 {record.result}
                    </p>
                  </div>
                </div>

              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
