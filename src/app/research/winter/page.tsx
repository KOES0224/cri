import { prisma } from "@/lib/prisma";
import ResearchProgramsClient from "../_components/ResearchProgramsClient";

// Force dynamic rendering since we are fetching from DB
export const dynamic = "force-dynamic";

export default async function WinterResearchPage() {
  const programs = await prisma.program.findMany({
    where: {
      isPublished: true,
    },
    include: { professors: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }]
  });

  return (
    <ResearchProgramsClient 
      programs={programs}
      title="Winter Online Research Program"
      description="Online research during winter break, recommended for students in Grades 9–12; university students may also participate. Up to 5 students per cohort, with 10 professor hours and 30 TA hours."
      categoryFilter={["Winter Online", "Winter"]}
    />
  );
}
