/**
 * Adds blog posts from a JSON file to the Post table, or updates posts it added earlier. Public pages pick changes up
 * within a minute (the posts cache lives 60 seconds, src/lib/public-data.ts).
 *
 *   npx tsx scripts/import-blog-posts.ts <file.json>                       preview, no writes
 *   npx tsx scripts/import-blog-posts.ts <file.json> --apply               create the posts whose slug is new
 *   npx tsx scripts/import-blog-posts.ts <file.json> --update --expect <previous.json> [--apply]
 *       replace title, excerpt and content of existing posts, but only where the live row still matches
 *       <previous.json>, so an edit made in /dashboard/cms in the meantime is never overwritten
 *
 * Insert mode never touches existing rows. Images referenced by the posts must be deployed (public/editorial/...)
 * before running --apply.
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { BLOG_CATEGORIES } from "../src/lib/blog-categories";

type PostSeed = {
  slug: string; title: string; excerpt: string; content: string; category: string; author: string;
  imageUrl: string | null; externalLink: string | null; publishedAt: string;
};

const args = process.argv.slice(2);
const file = args[0];
const apply = args.includes("--apply");
const update = args.includes("--update");
const expectFile = args.includes("--expect") ? args[args.indexOf("--expect") + 1] : null;
if (!file || file.startsWith("--") || (update && !expectFile)) {
  console.error("Usage: npx tsx scripts/import-blog-posts.ts <file.json> [--update --expect <previous.json>] [--apply]");
  process.exit(1);
}

const db = new PrismaClient();
const read = (path: string): PostSeed[] => JSON.parse(readFileSync(path, "utf8"));

function validate(posts: PostSeed[]) {
  const problems: string[] = [];
  for (const p of posts) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) problems.push(`${p.slug}: slug must be lowercase words joined by hyphens`);
    if (!(BLOG_CATEGORIES as readonly string[]).includes(p.category)) problems.push(`${p.slug}: unknown category "${p.category}"`);
    if (Number.isNaN(new Date(p.publishedAt).getTime())) problems.push(`${p.slug}: publishedAt is not a date`);
    if (!p.title.trim() || !p.content.trim()) problems.push(`${p.slug}: title and content are required`);
  }
  if (new Set(posts.map((p) => p.slug)).size !== posts.length) problems.push("duplicate slugs in the file");
  return problems;
}

async function insert(posts: PostSeed[]) {
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

async function replace(posts: PostSeed[], previous: PostSeed[]) {
  const before = new Map(previous.map((p) => [p.slug, p]));
  const rows = new Map((await db.post.findMany({ where: { slug: { in: posts.map((p) => p.slug) } }, select: { id: true, slug: true, title: true, excerpt: true, content: true } })).map((r) => [r.slug, r]));
  const plan: { id: string; post: PostSeed }[] = [];
  for (const p of posts) {
    const row = rows.get(p.slug);
    const old = before.get(p.slug);
    if (!row) { console.log(`  ? /blog/${p.slug}  not on the site, skipped`); continue; }
    if (!old || row.title !== old.title || row.excerpt !== old.excerpt || row.content !== old.content) {
      console.log(`  ! /blog/${p.slug}  changed on the site since the previous version, skipped`);
      continue;
    }
    if (row.title === p.title && row.excerpt === p.excerpt && row.content === p.content) { console.log(`  = /blog/${p.slug}  already up to date`); continue; }
    plan.push({ id: row.id, post: p });
    console.log(`  ~ /blog/${p.slug}  ${p.title}`);
  }
  console.log(`${plan.length} to update.`);
  if (!apply) return console.log("Preview only; run with --apply to write.");

  await db.$transaction(async (tx) => {
    for (const { id, post } of plan) {
      await tx.post.update({ where: { id }, data: { title: post.title, excerpt: post.excerpt, content: post.content } });
    }
  }, { timeout: 60_000 });
  console.log(`Updated ${plan.length} posts.`);
}

async function main() {
  const posts = read(file);
  const problems = validate(posts);
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exitCode = 1;
    return;
  }
  if (update) await replace(posts, read(expectFile!));
  else await insert(posts);
}

main()
  .catch((error) => { console.error("Import failed:", error instanceof Error ? error.message : error); process.exitCode = 1; })
  .finally(() => db.$disconnect());
