import { prisma } from "@/lib/prisma";
import ResearchProgramsClient from "../_components/ResearchProgramsClient";

// Force dynamic rendering since we are fetching from DB
export const dynamic = "force-dynamic";

export default async function SeoulResearchPage() {
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
      title="Seoul Research Program & Global Research Program"
      description="In-person summer research for rising Grade 9 through university students. Each cohort has up to 10 students, with 30 hours of professor instruction and 20 hours of TA guidance."
      categoryFilter={["Summer Camp", "Seoul Research Program", "Global Research Program", "seoul", "global", "camp"]}
    />
  );
}
