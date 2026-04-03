import { prisma } from "@/lib/prisma";
import ResearchProgramsClient from "../_components/ResearchProgramsClient";

// Force dynamic rendering since we are fetching from DB
export const dynamic = "force-dynamic";

export default async function SeoulResearchPage() {
  const programs = await prisma.program.findMany({
    include: { professors: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }]
  });

  return (
    <ResearchProgramsClient 
      programs={programs}
      title="Summer Camp"
      description="An immersive 2-week onsite intensive research program held in major global hubs including Seoul, NYC, and more. Join a selective cohort of scholars."
      categoryFilter={["Summer Camp", "Seoul Research Program", "seoul"]}
    />
  );
}
