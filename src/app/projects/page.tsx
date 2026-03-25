import { getSiteContent } from "@/app/actions/siteContent";
import ProjectsClient from "./ProjectsClient";

export default async function ProjectsPage() {
  const contentReq = await getSiteContent("landing");
  const content = contentReq.data || {};
  
  return <ProjectsClient content={content} />;
}
