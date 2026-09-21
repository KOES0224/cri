export type CuratedPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  imageUrl: string | null;
  externalLink: string;
  publishedAt: string;
  createdAt: string;
};

export type CuratedSuccessStory = {
  id: string;
  slug: string;
  name: string;
  university: string;
  major: string;
  projectTitle: string;
  description: string;
  imageUrl: string | null;
  externalLink: string;
  createdAt: string;
  updatedAt: string;
};

const ieeeImage = "https://postfiles.pstatic.net/MjAyNjA1MThfNDYg/MDAxNzc5MDg0MzkwODcy.4N0x9t00Nj87-Iw37a1cQxOscOq3PNkENkpWeAYjyb0g.7ewaClZOJ8v0R56-ZTbUd1uIKtx0al3ByY52_6otl6og.JPEG/KakaoTalk_Photo_2025-11-10-11-45-29_004_%281%29.jpeg?type=w966";

export const curatedPosts: CuratedPost[] = [
  {
    id: "naver-224388364206",
    slug: "from-interest-to-research-and-real-world-projects",
    title: "From Interest to Research—and Real-World Projects",
    excerpt: "CRI begins with a student's curiosity and follows the question wherever rigorous research leads.",
    category: "CRI & Research",
    author: "CRI Editorial",
    imageUrl: null,
    externalLink: "https://blog.naver.com/cri_official/224388364206",
    publishedAt: "2026-08-24T00:00:00.000Z",
    createdAt: "2026-08-24T00:00:00.000Z",
    content: "CRI is often introduced as a student research program. Research is the starting point rather than a fixed endpoint.\n\nStudents begin with something they care about, then work with faculty and teaching assistants to turn that interest into a researchable question. They learn to find evidence, analyze data, revise an argument, and complete a paper that reflects their own thinking.\n\nWhat happens next depends on the student. A paper may lead to a journal submission, a conference presentation, a competition project, a working website, or a business idea. There is no predetermined paper for students to reproduce and no guaranteed outcome.\n\nThat path captures CRI's approach: interest, question, research, and the next step.",
  },
  {
    id: "naver-224289220647",
    slug: "from-high-school-research-to-ieee-embs-poster-presentation",
    title: "From High-School Research to an IEEE EMBS Poster Presentation",
    excerpt: "A CRI student research team presented work developed with Northwestern faculty at an international biomedical engineering conference.",
    category: "Student Success",
    author: "CRI Editorial",
    imageUrl: ieeeImage,
    externalLink: "https://blog.naver.com/cri_official/224289220647",
    publishedAt: "2026-05-18T00:00:00.000Z",
    createdAt: "2026-05-18T00:00:00.000Z",
    content: "During a CRI Seoul Research Program, high-school students developed biomedical engineering research with Northwestern University's Nabil Alshurafa. The work progressed from research design and sensor data to an academic poster and an IEEE EMBS presentation.\n\nThe students presented alongside university researchers and explained their methods and findings in English. The outcome described here is a conference poster presentation; it is not a claim that every participant received an award or publication.\n\nThe experience shows the work required before a public presentation: a focused question, a defensible method, careful analysis, and the ability to answer questions about the evidence.",
  },
  {
    id: "naver-224075921009",
    slug: "student-authored-psychology-research-published-in-ijhsr",
    title: "Student-Authored Psychology Research Published in IJHSR",
    excerpt: "A psychology study developed with Oxford faculty moved through formal review and was published in the International Journal of High School Research.",
    category: "Student Success",
    author: "CRI Editorial",
    imageUrl: null,
    externalLink: "https://blog.naver.com/cri_official/224075921009",
    publishedAt: "2025-10-14T00:00:00.000Z",
    createdAt: "2025-10-14T00:00:00.000Z",
    content: "K, a student at an international school, developed a psychology study with Oxford faculty during CRI's 2024 Winter Research Program. The project examined whether emotional cues can influence how observers judge another person's agency and likely outcomes.\n\nThe student designed an online experiment, analyzed the results, and revised the manuscript with faculty feedback. The completed paper was published in the International Journal of High School Research after its editorial review process.\n\nCRI supported the research process and manuscript development; publication remained subject to the journal's independent review.",
  },
  {
    id: "naver-224078682732",
    slug: "a-hotel-housekeeping-question-becomes-an-economics-paper",
    title: "A Hotel Housekeeping Question Becomes an Economics Paper",
    excerpt: "A student's everyday observation became a formal information-economics model and an NYU Early admission story.",
    category: "Admissions Insights",
    author: "CRI Editorial",
    imageUrl: null,
    externalLink: "https://blog.naver.com/cri_official/224078682732",
    publishedAt: "2025-10-20T00:00:00.000Z",
    createdAt: "2025-10-20T00:00:00.000Z",
    content: "Y began with an everyday question: why do some hotels offer points to guests who decline housekeeping? With University of Chicago faculty, the student developed the question into a paper about screening, asymmetric information, and strategic service design.\n\nThe project connected sustainability, consumer behavior, and information economics through a question the student found genuinely interesting. The paper and research experience later became part of the student's NYU Early application story; the admission decision belongs to the university.",
  },
];

export const curatedSuccessStories: CuratedSuccessStory[] = [
  {
    id: "success-ksef-isef",
    slug: "ksef-gold-and-isef-qualification",
    name: "CRI Student",
    university: "KSEF Gold Award · ISEF Qualification",
    major: "Student Research & Competition",
    projectTitle: "A research project that earned a KSEF gold award and qualified for ISEF.",
    description: "The student developed and presented an original research project with CRI guidance and earned a gold award at KSEF, followed by qualification for ISEF. The public account does not disclose confidential project details or claim an ISEF award.",
    imageUrl: null,
    externalLink: "https://blog.naver.com/cri_official/224168717503",
    createdAt: "2026-02-02T00:00:00.000Z",
    updatedAt: "2026-02-02T00:00:00.000Z",
  },
  {
    id: "success-ieee-embs",
    slug: "ieee-embs-poster-presentation",
    name: "CRI Student Research Team",
    university: "IEEE EMBS",
    major: "Biomedical Engineering",
    projectTitle: "High-school researchers presented biomedical engineering work at an international conference.",
    description: "With Northwestern faculty guidance, CRI students developed biomedical engineering research, built an academic poster, and presented their work at IEEE EMBS. The story does not disclose confidential project materials or promise a repeat result.",
    imageUrl: ieeeImage,
    externalLink: "https://blog.naver.com/cri_official/224289220647",
    createdAt: "2026-05-18T00:00:00.000Z",
    updatedAt: "2026-05-18T00:00:00.000Z",
  },
  {
    id: "success-ijhsr-psychology",
    slug: "psychology-research-published-in-ijhsr",
    name: "K Student",
    university: "International Journal of High School Research",
    major: "Psychology & Cognition",
    projectTitle: "An experimental psychology paper developed with Oxford faculty and published after journal review.",
    description: "K developed an original psychology question, designed an online experiment, analyzed the evidence, and revised the manuscript with faculty guidance. The completed student-authored paper was published in IJHSR after the journal's review process.",
    imageUrl: null,
    externalLink: "https://blog.naver.com/cri_official/224075921009",
    createdAt: "2025-10-14T00:00:00.000Z",
    updatedAt: "2025-10-14T00:00:00.000Z",
  },
];
