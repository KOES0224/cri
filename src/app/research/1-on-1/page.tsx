import { prisma } from "@/lib/prisma";
import ResearchProgramsClient from "../_components/ResearchProgramsClient";

// Force dynamic rendering since we are fetching from DB
export const dynamic = "force-dynamic";

export default async function OneOnOneResearchPage() {
  const programs = await prisma.program.findMany({
    where: { category: "1-on-1" },
    include: { professors: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }]
  });

  return (
    <ResearchProgramsClient 
      programs={programs}
      title="1-on-1 Advanced Mentorship"
      description="Work directly with a leading researcher to produce a publication-ready thesis over 12-24 weeks. Highly personalized and rigorous."
      categoryFilter="1-on-1"
    />
  );
}
