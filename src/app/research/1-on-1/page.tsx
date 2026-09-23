import { getPublishedPrograms } from "@/lib/public-data";
import ResearchProgramsClient from "../_components/ResearchProgramsClient";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getDictionary, getLocale } from "@/i18n";

// Force dynamic rendering since we are fetching from DB
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "1-on-1 Advanced Research Program | CRI",
  description:
    "Advanced research built around the student's interests and schedule, online or in person, with a university professor and TA. Typically 2–4 months.",
  path: "/research/1-on-1",
});

export default async function OneOnOneResearchPage() {
  const t = getDictionary(await getLocale()).hubPages.oneOnOne;
  const oneOnOneCategories = new Set(["1-on-1", "Research", "Mentorship", "1-on-1 Advanced Research Program"]);
  const programs = (await getPublishedPrograms()).filter((p) => oneOnOneCategories.has(p.category));

  return (
    <ResearchProgramsClient 
      programs={programs}
      title={t.title}
      description={t.description}
      categoryFilter={["1-on-1", "Research", "Mentorship"]}
    />
  );
}
