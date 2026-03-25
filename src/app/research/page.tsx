import { getSiteContent } from "@/app/actions/siteContent";
import ResearchClient from "./ResearchClient";

export default async function ResearchPage() {
  const contentReq = await getSiteContent("landing");
  const content = contentReq.data || {};
  
  return <ResearchClient content={content} />;
}
