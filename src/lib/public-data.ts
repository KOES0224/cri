import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Cross-request cache for the public site's database reads. Public pages render dynamically
 * (the layout reads the locale cookie), so without this every visit paid for a round trip to the
 * database. Entries live for CACHE_SECONDS or until an admin action calls revalidateTag() with one
 * of the tags below. Admission state and dates are still computed at request time from the cached
 * rows, so "open / closed" stays correct to the day.
 */
export const CACHE_SECONDS = 60;
export const TAGS = { programs: "programs", siteContent: "site-content", professors: "professors" } as const;

type ProgramWithFaculty = Prisma.ProgramGetPayload<{ include: { professors: true } }>;

// unstable_cache stores JSON, so Date columns come back as ISO strings; restore them so callers
// (sorting, formatting, admission checks) see the same shapes Prisma returns.
const DATE_KEYS = ["startDate", "endDate", "createdAt", "updatedAt"] as const;
function reviveDates<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = { ...row };
  for (const key of DATE_KEYS) if (typeof out[key] === "string") out[key] = new Date(out[key] as string);
  return out as T;
}
function reviveProgram(program: ProgramWithFaculty): ProgramWithFaculty {
  return { ...reviveDates(program), professors: program.professors.map((p) => reviveDates(p)) };
}

const cachedPublishedPrograms = unstable_cache(
  async () => prisma.program.findMany({
    where: { isPublished: true },
    include: { professors: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  }),
  ["published-programs"],
  { revalidate: CACHE_SECONDS, tags: [TAGS.programs, TAGS.professors] },
);

const cachedProgramById = unstable_cache(
  async (id: string) => prisma.program.findUnique({ where: { id }, include: { professors: true } }),
  ["program-by-id"],
  { revalidate: CACHE_SECONDS, tags: [TAGS.programs, TAGS.professors] },
);

/** All published programs with their faculty, newest first (used by the research hubs). */
export async function getPublishedPrograms(): Promise<ProgramWithFaculty[]> {
  return (await cachedPublishedPrograms()).map(reviveProgram);
}

/** One program with faculty, or null. Unpublished programs are returned too; callers check isPublished. */
export async function getProgramById(id: string): Promise<ProgramWithFaculty | null> {
  const program = await cachedProgramById(id);
  return program ? reviveProgram(program) : null;
}

/** Key → value dictionary of CMS text for a page (e.g. "landing"). */
export const getSiteContentDictionary = unstable_cache(
  async (page: string) => {
    const rows = await prisma.siteContent.findMany({ where: { page } });
    return Object.fromEntries(rows.map((row) => [row.key, row.value])) as Record<string, string>;
  },
  ["site-content"],
  { revalidate: CACHE_SECONDS, tags: [TAGS.siteContent] },
);
