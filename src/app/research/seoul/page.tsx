import { prisma } from "@/lib/prisma";
import ResearchProgramsClient from "../_components/ResearchProgramsClient";

// Force dynamic rendering since we are fetching from DB
export const dynamic = "force-dynamic";

export default async function SeoulResearchPage() {
  const programs = await prisma.program.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }]
  });

  return (
    <ResearchProgramsClient 
      programs={programs}
      title="Seoul Summer Program"
      description="An immersive 8-week intensive research camp based in Seoul, South Korea. Join a selective cohort of scholars."
      categoryFilter="seoul"
    />
  );
}
