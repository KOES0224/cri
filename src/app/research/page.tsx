import { getSiteContentDictionary } from "@/lib/public-data";
import { getOpenPrograms } from "@/lib/open-programs";
import ResearchClient from "./ResearchClient";
import type { Metadata } from "next";
import { getDictionary, getLocale } from "@/i18n";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  const meta = getDictionary(await getLocale()).system.meta.research;
  return pageMetadata({ title: meta.title, description: meta.description, path: "/research" });
}

export default async function ResearchPage() {
  const [content, openPrograms] = await Promise.all([getSiteContentDictionary("landing"), getOpenPrograms(9)]);

  return <ResearchClient content={content} openPrograms={openPrograms} />;
}
