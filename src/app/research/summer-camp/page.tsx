import { getPublishedPrograms } from "@/lib/public-data";
import ResearchProgramsClient from "../_components/ResearchProgramsClient";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getDictionary, getLocale } from "@/i18n";

// Force dynamic rendering since we are fetching from DB
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Seoul & Global Research Program | CRI",
  description:
    "In-person summer research for rising Grade 9 through university students. Cohorts of up to 10, with 30 hours of professor instruction and 20 hours of TA guidance.",
  path: "/research/summer-camp",
});

export default async function SeoulResearchPage() {
  const t = getDictionary(await getLocale()).hubPages.summer;
  const programs = await getPublishedPrograms();

  return (
    <ResearchProgramsClient 
      programs={programs}
      title={t.title}
      description={t.description}
      categoryFilter={["Summer Camp", "Seoul Research Program", "Global Research Program", "seoul", "global", "camp"]}
    />
  );
}
