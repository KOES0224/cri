import { getSiteContent } from "@/app/actions/siteContent";
import { getOpenPrograms } from "@/lib/open-programs";
import ResearchClient from "./ResearchClient";

export const revalidate = 30;

export default async function ResearchPage() {
  const [contentReq, openPrograms] = await Promise.all([getSiteContent("landing"), getOpenPrograms(9)]);
  const content = contentReq.data || {};

  return <ResearchClient content={content} openPrograms={openPrograms} />;
}
