import { prisma } from "@/lib/prisma";

export type MentorUniversity = { name: string; logo: string | null };

/** Universities of the faculty attached to published programs, de-duplicated, logos first. */
export async function getMentorUniversities(limit = 12): Promise<MentorUniversity[]> {
  try {
    const professors = await prisma.professor.findMany({
      where: { university: { not: null }, programs: { some: { isPublished: true } } },
      select: { university: true, universityLogo: true },
    });
    const byName = new Map<string, MentorUniversity>();
    for (const professor of professors) {
      const name = professor.university?.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const existing = byName.get(key);
      if (!existing) byName.set(key, { name, logo: professor.universityLogo || null });
      else if (!existing.logo && professor.universityLogo) existing.logo = professor.universityLogo;
    }
    return Array.from(byName.values())
      .sort((a, b) => Number(Boolean(b.logo)) - Number(Boolean(a.logo)) || a.name.localeCompare(b.name))
      .slice(0, limit);
  } catch (error) {
    console.error("Failed to load mentor universities:", error);
    return [];
  }
}
