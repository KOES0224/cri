import { prisma } from "@/lib/prisma";
import BlogClientPage from "./BlogClientPage";

// Force dynamic rendering since we are fetching from DB
export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <BlogClientPage posts={posts} />
  );
}
