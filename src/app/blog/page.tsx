import { prisma } from "@/lib/prisma";
import BlogClientPage from "./BlogClientPage";
import { curatedPosts } from "@/lib/curated-blog";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// Force dynamic rendering since we are fetching from DB
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Institute Blog | CRI",
  description:
    "Articles, news and insights from CRI scholars and mentors on student research, publication and competitions.",
  path: "/blog",
});

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" }
  });

  const curated = curatedPosts.map((post) => ({
    ...post,
    publishedAt: new Date(post.publishedAt),
    createdAt: new Date(post.createdAt),
  }));

  return <BlogClientPage posts={[...curated, ...posts]} />;
}
