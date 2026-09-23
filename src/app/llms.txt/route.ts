import { getDictionary } from "@/i18n/config";
import { SITE_URL, summarize } from "@/lib/seo";
import { getPublishedPostCards, getPublishedPrograms, getSuccessStoryCards } from "@/lib/public-data";
import { admissionLabel, admissionState, programDate, programFacts } from "@/lib/program-policy";

// A plain-Markdown map of the site for AI assistants and answer engines (https://llmstxt.org).
export const revalidate = 3600;

const url = (path: string) => `${SITE_URL}${path}`;
const line = (text: string | null | undefined) => (text ?? "").replace(/\s+/g, " ").trim();

async function safely<T>(label: string, read: () => Promise<T[]>): Promise<T[]> {
  try {
    return await read();
  } catch (error) {
    console.error(`[llms.txt] ${label} skipped:`, error);
    return [];
  }
}

export async function GET() {
  const t = getDictionary("en");
  const meta = t.system.meta;
  const [programs, posts, stories] = await Promise.all([
    safely("programs", getPublishedPrograms),
    safely("posts", getPublishedPostCards),
    safely("stories", getSuccessStoryCards),
  ]);

  const current = programs.filter((p) => p.category !== "Internship" && admissionState(p) !== "ENDED");
  const programLines = current.map((p) => {
    const facts = programFacts(p);
    const dates = p.startDate ? `${programDate(p.startDate)}${p.endDate ? ` – ${programDate(p.endDate)}` : ""}` : null;
    const tuition = p.tuition != null ? `$${p.tuition.toLocaleString("en-US")} USD` : null;
    const details = [facts.name, facts.format, dates, tuition, admissionLabel(p)].filter(Boolean).join(" · ");
    return `- [${line(p.title)}](${url(`/research/program/${p.id}`)}): ${details}. ${summarize(p.description, 220)}`;
  });

  const body = [
    "# CRI",
    "",
    `> ${line(t.system.site.description)}`,
    "",
    "CRI (CRI Global, operated by Elite Research Co., Ltd.) is based in Seoul, Korea. Students in Grades 9–12, and some university students, research a question of their own with a university professor and a teaching assistant, and write their own paper. The site is in English, with Korean program and admissions pages under https://criglobal.org/ko. Articles are in English, adapted from CRI's Korean Naver blog.",
    "",
    "## Programs",
    "",
    `- [Research programs overview](${url("/research")}): ${meta.research.description}`,
    `- [Seoul & Global Research Program (summer, in person)](${url("/research/summer-camp")}): ${meta.summer.description}`,
    `- [Winter Online Research Program](${url("/research/winter")}): ${meta.winter.description}`,
    `- [1-on-1 Advanced Research Program](${url("/research/1-on-1")}): ${meta.oneOnOne.description}`,
    ...(programLines.length ? ["", "### Program listings", "", ...programLines] : []),
    "",
    "## Admissions",
    "",
    `- [Application guide and fees](${url("/admissions")}): ${meta.admissions.description}`,
    `- [Refund policy](${url("/refunds")})`,
    `- [Contact admissions](${url("/contact")}): ${meta.contact.description}`,
    "",
    "## Student outcomes",
    "",
    ...stories.map((s) => `- [${line(s.projectTitle)}](${url(`/success/${s.slug}`)}): ${line(s.university)}`),
    "",
    "## Guides and articles",
    "",
    ...posts.map((p) => `- [${line(p.title)}](${url(`/blog/${p.slug ?? p.id}`)})${p.excerpt ? `: ${summarize(p.excerpt, 200)}` : ""}`),
    "",
    "## Contact",
    "",
    "- Email: support@cri.kr",
    "- Phone: +82 2-6203-8999",
    `- Address: ${t.footer.address}`,
    "- Korean-language articles: https://blog.naver.com/cri_official",
    "",
  ].join("\n");

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
