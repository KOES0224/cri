import { prisma } from "@/lib/prisma";
import { admissionState, programFacts, programDate, programKind, type ProgramKind } from "@/lib/program-policy";

/** Plain, serialisable card data for cohorts that are accepting applications right now. */
export type OpenProgramCard = {
  id: string;
  title: string;
  description: string;
  season: string;
  format: string;
  /** Program kind plus raw ISO dates so client components can localize season/format/dateLabel. */
  kind: ProgramKind;
  startDate: string | null;
  endDate: string | null;
  capacity: number | null;
  dateLabel: string | null;
  tuition: number | null;
  professor: {
    name: string;
    role: string;
    university: string | null;
    imageUrl: string | null;
    universityLogo: string | null;
  } | null;
};

export async function getOpenPrograms(limit = 6): Promise<OpenProgramCard[]> {
  try {
    const programs = await prisma.program.findMany({
      where: { isPublished: true, status: "OPEN" },
      include: { professors: true },
      orderBy: [{ startDate: "asc" }, { order: "asc" }, { createdAt: "desc" }],
    });
    const now = new Date();
    return programs
      .filter((p) => !p.category.toLowerCase().includes("intern"))
      .filter((p) => admissionState(p, now) === "OPEN")
      .slice(0, limit)
      .map((p) => {
        const facts = programFacts(p);
        const prof = p.professors[0] ?? null;
        const individual = programKind(p.category) === "individual";
        const dateLabel = individual
          ? "Flexible start · typically 2–4 months"
          : p.startDate
            ? `${programDate(p.startDate)}${p.endDate ? ` – ${programDate(p.endDate)}` : ""}`
            : null;
        return {
          id: p.id,
          title: p.title,
          description: p.description,
          season: facts.name,
          format: facts.format,
          kind: facts.kind,
          startDate: p.startDate ? new Date(p.startDate).toISOString() : null,
          endDate: p.endDate ? new Date(p.endDate).toISOString() : null,
          capacity: facts.capacity ?? null,
          dateLabel,
          tuition: p.tuition ?? null,
          professor: prof
            ? {
                name: prof.name,
                role: prof.role,
                university: prof.university ?? null,
                imageUrl: prof.imageUrl ?? null,
                universityLogo: prof.universityLogo ?? null,
              }
            : null,
        };
      });
  } catch (error) {
    console.error("Failed to load open programs:", error);
    return [];
  }
}
