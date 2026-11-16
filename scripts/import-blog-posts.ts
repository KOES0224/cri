/**
 * Adds blog posts from a JSON file to the Post table. Insert-only by slug: a post whose slug already exists is left
 * alone, so edits made later in /dashboard/cms are never overwritten. Public pages pick new posts up within a minute
 * (the posts cache lives 60 seconds, src/lib/public-data.ts).
 *
 *   npx tsx scripts/import-blog-posts.ts scripts/editorial/research-ideas-2026-11.json            preview, no writes
 *   npx tsx scripts/import-blog-posts.ts scripts/editorial/research-ideas-2026-11.json --apply    create the new rows
 *
 * Images referenced by the posts must be deployed (public/editorial/...) before running --apply.
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { BLOG_CATEGORIES } from "../src/lib/blog-categories";

type PostSeed = {
  slug: string; title: string; excerpt: string; content: string; category: string; author: string;
  imageUrl: string | null; externalLink: string | null; publishedAt: string;
};

const file = process.argv[2];
const apply = process.argv.includes("--apply");
if (!file || file.startsWith("--")) {
  console.error("Usage: npx tsx scripts/import-blog-posts.ts <file.json> [--apply]");
  process.exit(1);
}

const db = new PrismaClient();

async function main() {
  const posts: PostSeed[] = JSON.parse(readFileSync(file, "utf8"));
  const problems: string[] = [];
  for (const p of posts) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) problems.push(`${p.slug}: slug must be lowercase words joined by hyphens`);
    if (!(BLOG_CATEGORIES as readonly string[]).includes(p.category)) problems.push(`${p.slug}: unknown category "${p.category}"`);
    if (Number.isNaN(new Date(p.publishedAt).getTime())) problems.push(`${p.slug}: publishedAt is not a date`);
    if (!p.title.trim() || !p.content.trim()) problems.push(`${p.slug}: title and content are required`);
  }
  if (new Set(posts.map((p) => p.slug)).size !== posts.length) problems.push("duplicate slugs in the file");
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exitCode = 1;
    return;
  }

  const existing = new Set((await db.post.findMany({ where: { slug: { in: posts.map((p) => p.slug) } }, select: { slug: true } })).map((p) => p.slug));
  const create = posts.filter((p) => !existing.has(p.slug));
  console.log(`${create.length} new, ${posts.length - create.length} already on the site (left as they are).`);
  for (const p of create) console.log(`  + /blog/${p.slug}  ${p.title}`);
  if (!apply) return console.log("Preview only; run with --apply to write.");

  await db.$transaction(async (tx) => {
    for (const p of create) {
      const date = new Date(p.publishedAt);
      await tx.post.create({
        data: { slug: p.slug, title: p.title, excerpt: p.excerpt, content: p.content, category: p.category, author: p.author, imageUrl: p.imageUrl, externalLink: p.externalLink, publishedAt: date, createdAt: date },
      });
    }
  }, { timeout: 60_000 });
  console.log(`Added ${create.length} posts.`);
}

main()
  .catch((error) => { console.error("Import failed:", error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
