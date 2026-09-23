import articles from "@/content/naver-articles.json";

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

export const curatedPosts: CuratedPost[] = [
  {
    id: "naver-224388364206",
    slug: "from-interest-to-research-and-real-world-projects",
    title: "From Interest to Research—and Real-World Projects",
    excerpt: "CRI begins with a student's curiosity and follows the question wherever rigorous research leads.",
    category: "CRI & Research",
    author: "CRI Editorial",
    imageUrl: articles["224388364206"].imageUrl,
    externalLink: "https://blog.naver.com/cri_official/224388364206",
    publishedAt: "2026-08-24T00:00:00.000Z",
    createdAt: "2026-08-24T00:00:00.000Z",
    content: articles["224388364206"].content,
  },
  {
    id: "naver-224289220647",
    slug: "from-high-school-research-to-ieee-embs-poster-presentation",
    title: "From High-School Research to an IEEE EMBS Poster Presentation",
    excerpt: "A CRI student research team presented work developed with Northwestern faculty at an international biomedical engineering conference.",
    category: "Student Success",
    author: "CRI Editorial",
    imageUrl: articles["224289220647"].imageUrl,
    externalLink: "https://blog.naver.com/cri_official/224289220647",
    publishedAt: "2026-05-18T00:00:00.000Z",
    createdAt: "2026-05-18T00:00:00.000Z",
    content: articles["224289220647"].content,
  },
  {
    id: "naver-224075921009",
    slug: "student-authored-psychology-research-published-in-ijhsr",
    title: "Student-Authored Psychology Research Published in IJHSR",
    excerpt: "A psychology study developed with Oxford faculty moved through formal review and was published in the International Journal of High School Research.",
    category: "Student Success",
    author: "CRI Editorial",
    imageUrl: articles["224075921009"].imageUrl,
    externalLink: "https://blog.naver.com/cri_official/224075921009",
    publishedAt: "2025-11-14T00:00:00.000Z",
    createdAt: "2025-11-14T00:00:00.000Z",
    content: articles["224075921009"].content,
  },
  {
    id: "naver-224078682732",
    slug: "a-hotel-housekeeping-question-becomes-an-economics-paper",
    title: "A Hotel Housekeeping Question Becomes an Economics Paper",
    excerpt: "A student's everyday observation became a formal information-economics model and an NYU Early admission story.",
    category: "Admissions Insights",
    author: "CRI Editorial",
    imageUrl: articles["224078682732"].imageUrl,
    externalLink: "https://blog.naver.com/cri_official/224078682732",
    publishedAt: "2025-11-17T00:00:00.000Z",
    createdAt: "2025-11-17T00:00:00.000Z",
    content: articles["224078682732"].content,
  },
  {
    id: "naver-224168717503",
    slug: "ksef-gold-and-isef-qualification",
    title: "KSEF Gold and Qualification for ISEF",
    excerpt: "A CRI student earned a KSEF gold award and qualified for ISEF after developing and presenting an original research project.",
    category: "Competitions",
    author: "CRI Editorial",
    imageUrl: articles["224168717503"].imageUrl,
    externalLink: "https://blog.naver.com/cri_official/224168717503",
    publishedAt: "2026-02-02T00:00:00.000Z",
    createdAt: "2026-02-02T00:00:00.000Z",
    content: articles["224168717503"].content,
  },
  {
    id: "naver-224050165825",
    slug: "what-is-isef-a-guide-to-the-worlds-largest-high-school-science-fair",
    title: "ISEF: A Guide to the World’s Largest High-School Science Fair",
    excerpt: "A practical introduction to the research standards, project development, and public presentation involved in ISEF.",
    category: "Competitions",
    author: "CRI Editorial",
    imageUrl: articles["224050165825"].imageUrl,
    externalLink: "https://blog.naver.com/cri_official/224050165825",
    publishedAt: "2025-10-23T00:00:00.000Z",
    createdAt: "2025-10-23T00:00:00.000Z",
    content: articles["224050165825"].content,
  },
  {
    id: "naver-223920478444",
    slug: "why-write-a-research-paper",
    title: "Why Write a Research Paper?",
    excerpt: "A paper is a disciplined way to turn a question into evidence, reasoning, and a contribution that others can evaluate.",
    category: "Research & Writing",
    author: "CRI Editorial",
    imageUrl: articles["223920478444"].imageUrl,
    externalLink: "https://blog.naver.com/cri_official/223920478444",
    publishedAt: "2025-07-04T00:00:00.000Z",
    createdAt: "2025-07-04T00:00:00.000Z",
    content: articles["223920478444"].content,
  },
  {
    id: "naver-224056636069",
    slug: "winter-online-research-program",
    title: "Winter Online Research Program",
    excerpt: "An online winter program connecting students with faculty guidance, TA support, and a student-authored research manuscript.",
    category: "Programs & Faculty",
    author: "CRI Editorial",
    imageUrl: articles["224056636069"].imageUrl,
    externalLink: "https://blog.naver.com/cri_official/224056636069",
    publishedAt: "2025-10-28T00:00:00.000Z",
    createdAt: "2025-10-28T00:00:00.000Z",
    content: articles["224056636069"].content,
  },
  {
    id: "naver-224052005886",
    slug: "research-continues-after-the-srp",
    title: "Research Continues After the SRP",
    excerpt: "An extension pathway can help students develop a group research experience into a more focused individual project.",
    category: "Programs & Faculty",
    author: "CRI Editorial",
    imageUrl: articles["224052005886"].imageUrl,
    externalLink: "https://blog.naver.com/cri_official/224052005886",
    publishedAt: "2025-10-24T00:00:00.000Z",
    createdAt: "2025-10-24T00:00:00.000Z",
    content: articles["224052005886"].content,
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
    description: articles["224168717503"].content,
    imageUrl: articles["224168717503"].imageUrl,
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
    description: articles["224289220647"].content,
    imageUrl: articles["224289220647"].imageUrl,
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
    description: articles["224075921009"].content,
    imageUrl: articles["224075921009"].imageUrl,
    externalLink: "https://blog.naver.com/cri_official/224075921009",
    createdAt: "2025-11-14T00:00:00.000Z",
    updatedAt: "2025-11-14T00:00:00.000Z",
  },
  {
    id: "success-nyu-economics",
    slug: "economics-research-and-nyu-early-admission",
    name: "Y Student",
    university: "New York University · Early Admission",
    major: "Economics",
    projectTitle: "A question about hotel housekeeping became an information-economics paper.",
    description: articles["224078682732"].content,
    imageUrl: articles["224078682732"].imageUrl,
    externalLink: "https://blog.naver.com/cri_official/224078682732",
    createdAt: "2025-11-17T00:00:00.000Z",
    updatedAt: "2025-11-17T00:00:00.000Z",
  },
];
