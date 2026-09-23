import { getPublishedPrograms } from "@/lib/public-data";
import ResearchProgramsClient from "../_components/ResearchProgramsClient";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getDictionary, getLocale } from "@/i18n";

// Force dynamic rendering since we are fetching from DB
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const meta = getDictionary(await getLocale()).system.meta.winter;
  return pageMetadata({ title: meta.title, description: meta.description, path: "/research/winter" });
}

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
