import { getSiteContent } from "@/app/actions/siteContent";
import { getOpenPrograms } from "@/lib/open-programs";
import ResearchClient from "./ResearchClient";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 30;

export const metadata: Metadata = pageMetadata({
  title: "Research Programs | CRI",
  description:
    "Student-led research guided by university professors: in-person summer cohorts, an online winter program and 1-on-1 advanced research. Write your own paper.",
  path: "/research",
});

export default async function ResearchPage() {
  const [contentReq, openPrograms] = await Promise.all([getSiteContent("landing"), getOpenPrograms(9)]);
  const content = contentReq.data || {};

  return <ResearchClient content={content} openPrograms={openPrograms} />;
}
