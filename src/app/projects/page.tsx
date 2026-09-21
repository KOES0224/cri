import { getSiteContent } from "@/app/actions/siteContent";
import ProjectsClient from "./ProjectsClient";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Projects | CRI",
  description:
    "Independent research projects, group builds, preparation for ISEF, Conrad Challenge and iGEM, and a gallery of student work at CRI.",
  path: "/projects",
});

export default async function ProjectsPage() {
  const contentReq = await getSiteContent("landing");
  const content = contentReq.data || {};
  
  return <ProjectsClient content={content} />;
}
