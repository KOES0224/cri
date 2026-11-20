/**
 * Database side of program slugs (rules and address helpers: src/lib/program-slug.ts).
 *
 * ProgramSlug holds every slug a program answers on: the current one, mirrored in Program.slug for cheap reads, and
 * earlier ones, which redirect. Its primary key is what keeps a slug from pointing at two programs, so every
 * change goes through assignSlug inside a transaction. The client is passed in: admin actions hand over their
 * transaction, scripts their own PrismaClient.
 */
import type { Prisma, PrismaClient } from "@prisma/client";
import { MAX_SLUG_LENGTH, firstFreeSlug, isValidSlug } from "./program-slug";

type Db = PrismaClient | Prisma.TransactionClient;

/** A slug problem the admin can fix; `message` is shown as is in the dashboard and by the script. */
export class SlugError extends Error {}

/** The program that has or had `slug` (or whose id it equals), if any. */
async function slugOwner(db: Db, slug: string): Promise<string | null> {
  const row = await db.programSlug.findUnique({ where: { slug }, select: { programId: true } });
  if (row) return row.programId;
  return (await db.program.findUnique({ where: { id: slug }, select: { id: true } }))?.id ?? null;
}

/**
 * `base` if this program can have it (nobody has it, or it is one of the program's own), otherwise `base-2`,
 * `base-3`… Pass no `programId` for a program that does not exist yet.
 */
export async function availableSlug(db: Db, base: string, programId?: string): Promise<string> {
  const rows = await db.programSlug.findMany({ where: { slug: { startsWith: base } }, select: { slug: true, programId: true } });
  const takenByOthers = new Set(rows.filter((row) => row.programId !== programId).map((row) => row.slug));
  return firstFreeSlug(base, (slug) => takenByOthers.has(slug));
}

/**
 * Makes `slug` the address of the program: records it in ProgramSlug (unless the program already had it) and sets
 * Program.slug. The slug it had before stays in ProgramSlug, so the old address keeps redirecting.
 * Throws SlugError for a malformed slug or one another program has or had. Call inside a transaction.
 */
export async function assignSlug(tx: Prisma.TransactionClient, programId: string, slug: string) {
  if (!isValidSlug(slug)) {
    throw new SlugError(`"${slug}" cannot be a page address. Use lowercase letters, numbers and hyphens, 3 to ${MAX_SLUG_LENGTH} characters.`);
  }
  const owner = await slugOwner(tx, slug);
  if (owner && owner !== programId) throw new SlugError(`Another program already uses the page address "${slug}". Choose a different one.`);
  if (!owner) await tx.programSlug.create({ data: { slug, programId } });
  return tx.program.update({ where: { id: programId }, data: { slug } });
}
