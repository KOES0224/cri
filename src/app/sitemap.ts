import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/seo";
import { hasKoreanContent, localizedPath } from "@/i18n/routing";

// Re-generate at most once an hour; DB failures fall back to static routes only.
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

const STATIC_ROUTES: Array<[path: string, priority: number, changeFrequency: Entry["changeFrequency"]]> = [
  ["/", 1.0, "weekly"],
  ["/research", 0.9, "weekly"],
  ["/research/summer-camp", 0.9, "weekly"],
  ["/research/winter", 0.9, "weekly"],
  ["/research/1-on-1", 0.9, "weekly"],
  ["/projects", 0.7, "monthly"],
  ["/projects/competitions", 0.7, "monthly"],
  ["/projects/gallery", 0.6, "monthly"],
  ["/projects/group", 0.6, "monthly"],
  ["/projects/personal", 0.6, "monthly"],
  ["/intern", 0.7, "weekly"],
  ["/success", 0.7, "weekly"],
  ["/blog", 0.7, "weekly"],
  ["/contact", 0.6, "yearly"],
  ["/admissions", 0.8, "monthly"],
  ["/privacy", 0.3, "yearly"],
  ["/refunds", 0.3, "yearly"],
];

const abs = (path: string) => `${SITE_URL}${path}`;

/**
 * Pages with Korean content are listed at both URLs, each naming the other as its hreflang alternate.
 * Pages whose body is English only are listed once; their /ko copy canonicalizes to the English URL.
 */
function withKorean(entry: Entry): Entry[] {
  const path = entry.url.slice(SITE_URL.length) || "/";
  if (!hasKoreanContent(path)) return [entry];
  const en = abs(path);
  const ko = abs(localizedPath(path, "ko"));
  const alternates = { languages: { en, ko, "x-default": en } };
  return [
    { ...entry, url: en, alternates },
    { ...entry, url: ko, alternates },
  ];
}

/** Run a DB query for the sitemap; on any failure log and contribute nothing. */
async function safely(label: string, query: () => Promise<Entry[]>): Promise<Entry[]> {
  try {
    return await query();
  } catch (error) {
    console.error(`[sitemap] ${label} skipped:`, error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: Entry[] = STATIC_ROUTES.map(([path, priority, changeFrequency]) => ({
    url: abs(path),
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const [programs, posts, stories] = await Promise.all([
    safely("programs", async () => {
      const rows = await prisma.program.findMany({
        where: { isPublished: true },
        select: { id: true, category: true, updatedAt: true },
      });
      return rows.map((p) => ({
        url: abs(p.category === "Internship" ? `/intern/${p.id}` : `/research/program/${p.id}`),
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }),
    safely("posts", async () => {
      // Post has no boolean flag; the dashboard treats a null publishedAt as a draft.
      const rows = await prisma.post.findMany({
        where: { publishedAt: { not: null } },
        select: { id: true, slug: true, updatedAt: true },
      });
      return rows.map((p) => ({
        url: abs(`/blog/${p.slug ?? p.id}`),
        lastModified: p.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      }));
    }),
    safely("success stories", async () => {
      const rows = await prisma.successStory.findMany({ select: { slug: true, updatedAt: true } });
      return rows.map((s) => ({
        url: abs(`/success/${s.slug}`),
        lastModified: s.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.5,
      }));
    }),
  ]);

  // De-duplicate by URL (a post may be reachable by both slug and id).
  const seen = new Set<string>();
  return [...staticEntries, ...programs, ...posts, ...stories].flatMap(withKorean).filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}
