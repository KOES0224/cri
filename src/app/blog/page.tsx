import BlogClientPage from "./BlogClientPage";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getPublishedPostCards } from "@/lib/public-data";

// Force dynamic rendering since we are fetching from DB
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Institute Blog | CRI",
  description:
    "Program news, faculty spotlights, admissions insights and practical research guides from CRI's scholars and mentors.",
  path: "/blog",
});

export default async function BlogPage() {
  return <BlogClientPage posts={await getPublishedPostCards()} />;
}
