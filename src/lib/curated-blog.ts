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
  {
    id: "naver-224168717503",
    slug: "ksef-gold-and-isef-qualification",
    title: "KSEF Gold and Qualification for ISEF",
    excerpt: "A CRI student earned a KSEF gold award and qualified for ISEF after developing and presenting an original research project.",
    category: "Competitions",
    author: "CRI Editorial",
    imageUrl: "https://postfiles.pstatic.net/MjAyNjAyMDlfMjM4/MDAxNzcwNTk5MjQ3NTE3.ffAvj5msM5pSKNbZt7TC82wTmBG-BO1Hc5rWU9m0yr8g.FPpcW-m5I1hhr_-f4Mll9VFCxPo9uzF4W5-gTSe-AhAg.JPEG/SE-9755a25b-543c-4908-ae2a-c39415fb72ca.jpg?type=w966",
    externalLink: "https://blog.naver.com/cri_official/224168717503",
    publishedAt: "2026-02-02T00:00:00.000Z",
    createdAt: "2026-02-02T00:00:00.000Z",
    content: "A CRI student earned a gold award at KSEF and qualified for ISEF. The project was prepared with guidance from Jinning, a doctoral researcher in the United Kingdom.\n\nThe public account emphasizes that competition research depends on more than effort. Students must define a clear question, choose evidence that can answer it, and explain the method and result in a way that reviewers can evaluate.\n\nThis page records the verified milestone: KSEF gold and ISEF qualification. It does not disclose confidential project materials or claim an ISEF award.",
  },
  {
    id: "naver-224050165825",
    slug: "what-is-isef-a-guide-to-the-worlds-largest-high-school-science-fair",
    title: "ISEF: A Guide to the World’s Largest High-School Science Fair",
    excerpt: "A practical introduction to the research standards, project development, and public presentation involved in ISEF.",
    category: "Competitions",
    author: "CRI Editorial",
    imageUrl: null,
    externalLink: "https://blog.naver.com/cri_official/224050165825",
    publishedAt: "2025-10-01T00:00:00.000Z",
    createdAt: "2025-10-01T00:00:00.000Z",
    content: "ISEF is a major international science and engineering fair for high-school researchers. Reaching that stage requires more than a polished display: a project needs a meaningful question, a defensible method, reliable evidence, and a clear explanation of limitations.\n\nCRI's competition support begins with the student's own research interests. Eligibility, submission rules, and review criteria change, so students should confirm current requirements with the official competition organizers before applying.",
  },
  {
    id: "naver-223920478444",
    slug: "why-write-a-research-paper",
    title: "Why Write a Research Paper?",
    excerpt: "A paper is a disciplined way to turn a question into evidence, reasoning, and a contribution that others can evaluate.",
    category: "Research & Writing",
    author: "CRI Editorial",
    imageUrl: null,
    externalLink: "https://blog.naver.com/cri_official/223920478444",
    publishedAt: "2025-09-20T00:00:00.000Z",
    createdAt: "2025-09-20T00:00:00.000Z",
    content: "Writing a research paper is not about collecting impressive vocabulary or copying a predetermined topic. It is a way to make a question precise, show how evidence was gathered, explain what the evidence means, and let another reader examine the reasoning.\n\nFor students, the process also makes learning visible. A strong paper shows what the student noticed, what they tested, where the evidence was limited, and how their thinking changed during revision.",
  },
  {
    id: "naver-224056636069",
    slug: "winter-online-research-program",
    title: "Winter Online Research Program",
    excerpt: "An online winter program connecting students with faculty guidance, TA support, and a student-authored research manuscript.",
    category: "Programs & Faculty",
    author: "CRI Editorial",
    imageUrl: null,
    externalLink: "https://blog.naver.com/cri_official/224056636069",
    publishedAt: "2025-11-01T00:00:00.000Z",
    createdAt: "2025-11-01T00:00:00.000Z",
    content: "CRI's Winter Online Research Program is delivered remotely during the winter break. Students begin with their interests, develop a research question with faculty guidance, and work with TAs on evidence, analysis, writing, and revision.\n\nThe program is designed around a student-authored manuscript. Publication, competition results, and university admission are separate steps and are never guaranteed. Current dates, faculty assignments, hours, and availability should be confirmed on the live program page.",
  },
  {
    id: "naver-224052005886",
    slug: "research-continues-after-the-srp",
    title: "Research Continues After the SRP",
    excerpt: "An extension pathway can help students develop a group research experience into a more focused individual project.",
    category: "Programs & Faculty",
    author: "CRI Editorial",
    imageUrl: null,
    externalLink: "https://blog.naver.com/cri_official/224052005886",
    publishedAt: "2025-10-02T00:00:00.000Z",
    createdAt: "2025-10-02T00:00:00.000Z",
    content: "A research program does not have to end when the first manuscript is complete. In an extension pathway, a student may narrow the question, deepen the analysis, improve the evidence, or develop an individual contribution from an earlier group project.\n\nThe appropriate next step depends on the student's interests, the state of the research, and the time available. CRI reviews those factors with the student instead of assigning the same continuation plan to everyone.",
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
