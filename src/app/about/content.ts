import type { Locale } from "@/i18n";

/** Facts the About page, the organization JSON-LD and llms.txt share. Owner-approved 2026-11-18. */
export const ABOUT_FACTS = {
  foundingYear: 2020,
  foundingName: "California Research Institute",
} as const;

type Stage = { label: string; title: string; body: string; core?: boolean };

type AboutCopy = {
  metaTitle: string;
  description: string;
  eyebrow: string;
  title: string;
  lead: string;
  story: { heading: string; body: string[] };
  middle: { heading: string; stages: Stage[]; body: string[] };
  teaching: { heading: string; points: Array<{ title: string; body: string }> };
  goal: { heading: string; body: string[] };
  ctaPrograms: string;
  ctaStories: string;
};

export const ABOUT: Record<Locale, AboutCopy> = {
  en: {
    metaTitle: "About CRI | Research education with university professors",
    description:
      "CRI is a research education institution founded in California in 2020 and now run from Korea. Students learn how research is really done with professors from top-30 US and UK universities.",
    eyebrow: "Since 2020",
    title: "About CRI",
    lead:
      "CRI is a research education institution. We pair students with university professors so they can learn how research is really done: asking a question of their own, working through it, and writing it up.",
    story: {
      heading: "Our story",
      body: [
        "CRI began in California in 2020, founded as California Research Institute by our founder and a partner who believed young people can do real research when real researchers teach them.",
        "Today we operate from Korea and work with students and faculty around the world. That is why our home is criglobal.org.",
      ],
    },
    middle: {
      heading: "What matters most to us: the middle",
      stages: [
        { label: "Beginning", title: "Curiosity", body: "A question the student truly wants to answer." },
        { label: "Middle", title: "The research", body: "Reading, choosing a method, getting stuck, revising.", core: true },
        { label: "End", title: "The paper", body: "A paper, a presentation or a publication." },
      ],
      body: [
        "Every research project has a beginning, a middle and an end. It begins with curiosity and ends with a paper, a presentation or a publication.",
        "The middle is everything in between: reading what others have found, choosing a method, getting stuck, revising, and slowly understanding a problem better than before. It is the hardest part, and we believe it is the most valuable. This is where students learn to think as researchers, so this is where we put our care.",
      ],
    },
    teaching: {
      heading: "How we teach",
      points: [
        { title: "Curriculum first", body: "Each program is built around how its field actually works, so students learn the methods, not only the topic." },
        { title: "Who teaches, and how", body: "Our faculty come from top-30 universities in the US and UK, and more than 90% are full professors. We choose them as much for how they guide students as for their research." },
        { title: "Close guidance", body: "Students work in small groups or one-on-one, with a teaching assistant alongside the professor." },
        { title: "The student's own work", body: "The question and the paper always belong to the student." },
      ],
    },
    goal: {
      heading: "What we hope students take with them",
      body: [
        "Our goal is not a particular university. It is for each student to take something they care about, develop it through honest and rigorous work, and come to understand both the subject and themselves more deeply.",
        "Students tell us they love this work, and many find it strengthens their university applications as well. We see that as a result of good learning, not its purpose.",
      ],
    },
    ctaPrograms: "Explore programs",
    ctaStories: "Read student stories",
  },
  ko: {
    metaTitle: "CRI 소개 | 대학 교수와 함께하는 연구 교육",
    description:
      "CRI는 2020년 미국 캘리포니아에서 시작해 지금은 한국에서 운영하는 연구 교육 기관입니다. 미국·영국 상위 30개 대학 교수진과 함께 연구가 실제로 어떻게 이루어지는지 배웁니다.",
    eyebrow: "Since 2020",
    title: "CRI 소개",
    lead:
      "CRI는 연구 교육 기관입니다. 학생이 대학 교수와 함께 스스로 질문을 세우고, 끝까지 탐구하고, 논문으로 정리하며 연구가 실제로 어떻게 이루어지는지 배웁니다.",
    story: {
      heading: "시작",
      body: [
        "CRI는 2020년 미국 캘리포니아에서 'California Research Institute'라는 이름으로 시작했습니다. 진짜 연구자에게 배우면 학생도 진짜 연구를 할 수 있다고 믿은 창립자와 파트너가 함께 세웠습니다.",
        "지금은 한국에서 운영하며 세계 곳곳의 학생, 교수진과 함께합니다. 그래서 저희의 이름은 criglobal.org입니다.",
      ],
    },
    middle: {
      heading: "저희가 가장 중요하게 여기는 것: 과정",
      stages: [
        { label: "시작", title: "호기심", body: "정말로 답을 알고 싶은 질문" },
        { label: "과정", title: "연구", body: "읽고, 방법을 고르고, 막히고, 고쳐 쓰는 시간", core: true },
        { label: "끝", title: "논문", body: "논문, 발표, 출판" },
      ],
      body: [
        "모든 연구에는 시작과 과정과 끝이 있습니다. 시작은 호기심, 정말로 답을 알고 싶은 질문입니다. 끝은 논문이나 발표, 출판입니다.",
        "과정은 그 사이의 모든 시간입니다. 앞선 연구를 읽고, 방법을 고르고, 막히고, 고쳐 쓰면서 처음보다 문제를 조금씩 더 깊이 이해해 갑니다. 가장 어렵지만 가장 값진 시간이라고 믿습니다. 학생이 연구자처럼 생각하는 법을 배우는 곳이 바로 여기이기에, 저희는 이 과정에 가장 정성을 들입니다.",
      ],
    },
    teaching: {
      heading: "어떻게 가르치는가",
      points: [
        { title: "커리큘럼이 먼저입니다", body: "각 프로그램은 그 학문이 실제로 연구되는 방식에 맞춰 설계되어, 주제뿐 아니라 연구 방법을 배웁니다." },
        { title: "누가, 어떻게 가르치는지가 중요합니다", body: "교수진은 미국과 영국 상위 30개 대학 출신이며, 90% 이상이 정교수입니다. 연구 실적만큼이나 학생을 이끄는 방식을 보고 모십니다." },
        { title: "가까이에서 지도합니다", body: "소규모 그룹 또는 1:1로 진행하며, 교수와 함께 조교(TA)가 학생을 지도합니다." },
        { title: "학생의 연구입니다", body: "질문도, 논문도 언제나 학생의 것입니다." },
      ],
    },
    goal: {
      heading: "학생들이 가져가길 바라는 것",
      body: [
        "저희의 목표는 특정 대학 합격이 아닙니다. 학생이 자신이 좋아하는 것을 정직하고 깊이 있는 연구로 키워 가며, 그 분야와 자기 자신을 더 깊이 알게 되는 것입니다.",
        "학생들은 이 과정을 정말 즐거워하고, 많은 학생이 대입에서도 도움을 받습니다. 저희는 그것을 목적이 아니라 좋은 배움의 결과라고 생각합니다.",
      ],
    },
    ctaPrograms: "프로그램 보기",
    ctaStories: "학생 성과 보기",
  },
};
