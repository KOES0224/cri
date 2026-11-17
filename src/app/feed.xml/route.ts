import { getPublishedPostCards } from "@/lib/public-data";
import { SITE_URL } from "@/lib/seo";

// RSS 2.0 feed of the blog. Google, Bing and Naver Search Advisor accept a feed as a fast discovery channel
// next to the sitemap, and feed readers pick it up from the <link rel="alternate"> on the blog pages.
export const revalidate = 3600;

const FEED_SIZE = 50;

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export async function GET() {
  let posts: Awaited<ReturnType<typeof getPublishedPostCards>> = [];
  try {
    posts = (await getPublishedPostCards()).slice(0, FEED_SIZE);
  } catch (error) {
    console.error("[feed.xml] posts skipped:", error);
  }

  const items = posts.map((post) => {
    const url = `${SITE_URL}/blog/${post.slug || post.id}`;
    const date = new Date(post.publishedAt ?? post.createdAt).toUTCString();
    return [
      "    <item>",
      `      <title>${escape(post.title)}</title>`,
      `      <link>${url}</link>`,
      `      <guid isPermaLink="true">${url}</guid>`,
      `      <pubDate>${date}</pubDate>`,
      `      <category>${escape(post.category)}</category>`,
      post.excerpt ? `      <description>${escape(post.excerpt)}</description>` : "",
      "    </item>",
    ]
      .filter(Boolean)
      .join("\n");
  });

  const newest = posts[0] ? new Date(posts[0].publishedAt ?? posts[0].createdAt).toUTCString() : new Date(0).toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CRI Institute Blog</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Program news, faculty spotlights, admissions insights, and practical guides to doing real research in high school.</description>
    <language>en</language>
    <lastBuildDate>${newest}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=3600" },
  });
}
