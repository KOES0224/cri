import { prisma } from "@/lib/prisma";
import ResearchProgramsClient from "../_components/ResearchProgramsClient";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// Force dynamic rendering since we are fetching from DB
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "1-on-1 Advanced Research Program | CRI",
  description:
    "Advanced research built around the student's interests and schedule, online or in person, with a university professor and TA. Typically 2–4 months.",
  path: "/research/1-on-1",
});

export default async function OneOnOneResearchPage() {
  const programs = await prisma.program.findMany({
    where: { 
      isPublished: true,
      category: { in: ["1-on-1", "Research", "Mentorship", "1-on-1 Advanced Research Program"] }
    },
    include: { professors: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }]
  });

  return (
    <ResearchProgramsClient 
      programs={programs}
      title="1-on-1 Advanced Research Program"
      description="Advanced research built around the student’s interests and schedule, online or in person. Typically 2–4 months; some projects finish within a month and others take longer. Contact us to discuss readiness, mentorship hours and your research plan."
      categoryFilter={["1-on-1", "Research", "Mentorship"]}
    />
  );
}
