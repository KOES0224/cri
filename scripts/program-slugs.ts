/**
 * Gives programs a readable page address (slug): /research/program/oxford-psychology instead of the database id.
 * Programs saved in the dashboard get one on their own; this is for the ones that existed before slugs.
 *
 *   npx tsx scripts/program-slugs.ts                       list every program and the address it would get, no change
 *   npx tsx scripts/program-slugs.ts --apply               save them
 *   npx tsx scripts/program-slugs.ts --set <id>=<slug>     use this slug for that program instead of the one made from
 *                                                          its title (repeatable; also renames a program that has one)
 *
 * Nothing breaks for visitors: the id address and any earlier slug keep working and redirect to the current one
 * (within about a minute, once the site's 60-second data cache turns over). Afterwards resubmit the sitemap:
 * npx tsx scripts/indexnow-submit.ts --apply
 *
 * Uses DATABASE_URL from .env, i.e. the live database. Re-running is safe: programs that have a slug are left alone.
 */
import { PrismaClient } from "@prisma/client";
import { firstFreeSlug, normalizeSlug, programPath, slugFromTitle } from "../src/lib/program-slug";
import { SlugError, assignSlug } from "../src/lib/program-slug-store";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const overrides = new Map<string, string>();
for (let i = 0; i < args.length; i++) {
  if (args[i] !== "--set") continue;
  const [id, slug] = (args[++i] ?? "").split("=");
  if (!id || !slug) {
    console.error("Usage: --set <program id>=<slug>");
    process.exit(1);
  }
  overrides.set(id, normalizeSlug(slug));
}

const db = new PrismaClient();

async function main() {
  const target = new URL(process.env.DATABASE_URL ?? "postgresql://unknown/unknown");
  console.log(`Database: ${target.hostname}${target.pathname}`);

  // Published programs first, oldest first, so a live page gets the plain slug before a draft with the same title.
  const programs = await db.program.findMany({
    select: { id: true, slug: true, title: true, category: true, isPublished: true },
    orderBy: [{ isPublished: "desc" }, { createdAt: "asc" }],
  });
  const unknown = [...overrides.keys()].filter((id) => !programs.some((p) => p.id === id));
  if (unknown.length) throw new SlugError(`No program with id ${unknown.join(", ")}.`);

  // slug → the program that has or had it.
  const owners = new Map((await db.programSlug.findMany({ select: { slug: true, programId: true } })).map((row) => [row.slug, row.programId]));
  const takenByOther = (slug: string, programId: string) => (owners.get(slug) ?? programId) !== programId;

  const plan: { program: (typeof programs)[number]; slug: string }[] = [];
  // Hand-picked slugs first, so the automatic ones work around them.
  for (const program of programs) {
    const slug = overrides.get(program.id);
    if (!slug || slug === program.slug) continue;
    if (takenByOther(slug, program.id)) throw new SlugError(`"${slug}" already belongs to program ${owners.get(slug)}.`);
    owners.set(slug, program.id);
    plan.push({ program, slug });
  }
  const noSlugPossible: typeof programs = [];
  for (const program of programs) {
    if (program.slug || overrides.has(program.id)) continue;
    const base = slugFromTitle(program.title);
    if (!base) {
      noSlugPossible.push(program);
      continue;
    }
    const slug = firstFreeSlug(base, (candidate) => takenByOther(candidate, program.id));
    owners.set(slug, program.id);
    plan.push({ program, slug });
  }

  for (const { program, slug } of plan) {
    console.log(`${program.isPublished ? "live " : "draft"}  ${programPath(program)}\n   ->  ${programPath({ ...program, slug })}   (${program.title})`);
  }
  for (const program of noSlugPossible) {
    console.log(`kept   ${programPath(program)}   (${program.title}: no Latin letters to make a slug from; pass --set ${program.id}=<slug>)`);
  }
  const unchanged = programs.length - plan.length - noSlugPossible.length;
  console.log(`${plan.length} to change, ${unchanged} already have an address, ${noSlugPossible.length} kept on their id.`);

  if (!plan.length) return;
  if (!apply) {
    console.log("Preview only. Re-run with --apply to save.");
    return;
  }
  // All or nothing, so a refused slug leaves no half-renamed catalogue.
  await db.$transaction(
    async (tx) => {
      for (const { program, slug } of plan) await assignSlug(tx, program.id, slug);
    },
    { timeout: 60_000 },
  );
  console.log(`Saved ${plan.length} addresses. Old addresses redirect within about a minute.`);
  console.log("Next: npx tsx scripts/indexnow-submit.ts --apply");
}

main()
  .catch((error) => {
    // P2021 / P2022: the table or column is not there yet. The site's build (prisma db push) adds them.
    const notDeployed = ["P2021", "P2022"].includes((error as { code?: string })?.code ?? "");
    console.error(notDeployed ? "This database has no slug column yet. Deploy the site first; its build adds it." : error instanceof SlugError ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
