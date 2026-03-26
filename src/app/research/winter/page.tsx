import { prisma } from "@/lib/prisma";
import ResearchProgramsClient from "../_components/ResearchProgramsClient";

// Force dynamic rendering since we are fetching from DB
export const dynamic = "force-dynamic";

export default async function WinterResearchPage() {
  const programs = await prisma.program.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }]
  });

  return (
    <ResearchProgramsClient 
      programs={programs}
      title="Winter Remote Cohort"
      description="Structure your methodology, conduct literature reviews, and begin your data collection over the winter holiday. Fully remote."
      categoryFilter="winter"
    />
  );
}
