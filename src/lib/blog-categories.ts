/** Blog categories shown as filters on /blog. The admin form offers exactly these. */
export const BLOG_CATEGORIES = [
  "Programs & Faculty",
  "Admissions Insights",
  "Research & Writing",
  "Competitions & Activities",
  "Majors & Careers",
  "Inside CRI",
  "Science & Discovery",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
