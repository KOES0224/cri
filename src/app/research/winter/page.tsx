import { getPublishedPrograms } from "@/lib/public-data";
import ResearchProgramsClient from "../_components/ResearchProgramsClient";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getDictionary, getLocale } from "@/i18n";

// Force dynamic rendering since we are fetching from DB
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Winter Online Research Program | CRI",
  description:
    "Online research during winter break for students in Grades 9–12; university students may also join. Up to 5 students per cohort, with 10 professor hours and 30 TA hours.",
  path: "/research/winter",
});

export default async function WinterResearchPage() {
  const t = getDictionary(await getLocale()).hubPages.winter;
  const programs = await getPublishedPrograms();

  return (
    <ResearchProgramsClient 
      programs={programs}
      title={t.title}
      description={t.description}
      categoryFilter={["Winter Online", "Winter"]}
    />
  );
}
