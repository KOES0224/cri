/**
 * One-time import of the English editions of CRI's Naver blog (scripts/editorial/*.json) into Post and
 * SuccessStory. After import the database is the source of truth: edit posts in /dashboard/cms, not the JSON.
 *
 *   npx tsx scripts/seed-editorial-content.ts             preview, no writes
 *   npx tsx scripts/seed-editorial-content.ts --apply     create rows whose slug does not exist yet
 *   ... --apply --overwrite                                also replace rows with the same slug (discards admin edits)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

type PostSeed = {
  slug: string; title: string; excerpt: string; content: string; category: string; author: string;
  imageUrl: string | null; externalLink: string | null; publishedAt: string;
};
type StorySeed = {
  slug: string; name: string; university: string; major: string; projectTitle: string; description: string;
  imageUrl: string | null; externalLink: string | null; date: string;
};

const db = new PrismaClient();
const apply = process.argv.includes("--apply");
const overwrite = process.argv.includes("--overwrite");
const dir = join(__dirname, "editorial");
const read = <T,>(file: string): T[] => JSON.parse(readFileSync(join(dir, file), "utf8"));

async function main() {
  const posts = read<PostSeed>("posts.json");
  const stories = read<StorySeed>("success-stories.json");
  const existingPosts = new Set((await db.post.findMany({ select: { slug: true } })).map((p) => p.slug));
  const existingStories = new Set((await db.successStory.findMany({ select: { slug: true } })).map((s) => s.slug));

  const plan = {
    posts: { create: posts.filter((p) => !existingPosts.has(p.slug)), update: overwrite ? posts.filter((p) => existingPosts.has(p.slug)) : [] },
    stories: { create: stories.filter((s) => !existingStories.has(s.slug)), update: overwrite ? stories.filter((s) => existingStories.has(s.slug)) : [] },
  };
  console.log(`Posts: ${plan.posts.create.length} new, ${plan.posts.update.length} to replace, ${posts.length - plan.posts.create.length - plan.posts.update.length} left as they are.`);
  console.log(`Success stories: ${plan.stories.create.length} new, ${plan.stories.update.length} to replace, ${stories.length - plan.stories.create.length - plan.stories.update.length} left as they are.`);
  if (!apply) return console.log("Preview only; run with --apply to write.");

  await db.$transaction(async (tx) => {
    for (const p of [...plan.posts.create, ...plan.posts.update]) {
      const date = new Date(p.publishedAt);
      const data = { title: p.title, excerpt: p.excerpt, content: p.content, category: p.category, author: p.author, imageUrl: p.imageUrl, externalLink: p.externalLink, publishedAt: date };
      await tx.post.upsert({ where: { slug: p.slug }, create: { slug: p.slug, ...data, createdAt: date }, update: data });
    }
    for (const s of [...plan.stories.create, ...plan.stories.update]) {
      const data = { name: s.name, university: s.university, major: s.major, projectTitle: s.projectTitle, description: s.description, imageUrl: s.imageUrl, externalLink: s.externalLink };
      await tx.successStory.upsert({ where: { slug: s.slug }, create: { slug: s.slug, ...data, createdAt: new Date(s.date) }, update: data });
    }
  }, { timeout: 60_000 });
  console.log("Import complete.");
}

main().catch((error) => { console.error("Editorial import failed:", error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(() => db.$disconnect());
