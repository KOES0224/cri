/**
 * Point Post and SuccessStory rows at renamed editorial photos (scripts/editorial/image-renames.json maps
 * old path -> new path, e.g. the versions with student faces blurred). Only exact path strings change.
 *
 *   npx tsx scripts/update-editorial-image-paths.ts           preview, no writes
 *   npx tsx scripts/update-editorial-image-paths.ts --apply   write
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const apply = process.argv.includes("--apply");
const renames: Record<string, string> = JSON.parse(readFileSync(join(__dirname, "editorial", "image-renames.json"), "utf8"));

function rewrite(text: string | null): string | null {
  if (!text) return text;
  let out = text;
  for (const [from, to] of Object.entries(renames)) out = out.split(from).join(to);
  return out;
}

async function main() {
  const posts = await db.post.findMany({ select: { id: true, slug: true, imageUrl: true, content: true } });
  const stories = await db.successStory.findMany({ select: { id: true, slug: true, imageUrl: true, description: true } });
  const postChanges = posts
    .map((p) => ({ id: p.id, slug: p.slug, data: { imageUrl: rewrite(p.imageUrl), content: rewrite(p.content)! }, before: p }))
    .filter((c) => c.data.imageUrl !== c.before.imageUrl || c.data.content !== c.before.content);
  const storyChanges = stories
    .map((s) => ({ id: s.id, slug: s.slug, data: { imageUrl: rewrite(s.imageUrl), description: rewrite(s.description) }, before: s }))
    .filter((c) => c.data.imageUrl !== c.before.imageUrl || c.data.description !== c.before.description);

  console.log(`${Object.keys(renames).length} renamed photos; ${postChanges.length} posts and ${storyChanges.length} success stories reference them.`);
  if (!apply) return console.log("Preview only; run with --apply to write.");

  await db.$transaction([
    ...postChanges.map((c) => db.post.update({ where: { id: c.id }, data: c.data })),
    ...storyChanges.map((c) => db.successStory.update({ where: { id: c.id }, data: c.data })),
  ]);
  console.log("Updated.");
}

main().catch((error) => { console.error("Update failed:", error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(() => db.$disconnect());
