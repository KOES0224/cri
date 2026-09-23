"use server";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { TAGS } from "@/lib/public-data";
import { notifySearchEngines } from "@/lib/indexnow";

export async function getPosts() {
  // Outside the try: Next's dynamic-rendering signal (headers) and the auth error must propagate unchanged.
  await requireAdmin();
  try {
    return await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    throw new Error("Failed to fetch posts.");
  }
}

export async function createPost(data: {
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  content: string;
  category?: string;
  author?: string;
  imageUrl?: string | null;
  externalLink?: string | null;
  publishedAt?: Date | null;
}) {
  try {
    await requireAdmin();
    const post = await prisma.post.create({
      data,
    });
    revalidatePath("/dashboard/cms/blog");
    revalidatePath("/blog");
    revalidateTag(TAGS.posts, "max");
    notifySearchEngines([`/blog/${post.slug ?? post.id}`, "/blog"]);
    return { success: true, post };
  } catch (error) {
    console.error("Failed to create post:", error);
    return { success: false, error: "Failed to create post." };
  }
}

export async function updatePost(
  id: string,
  data: Partial<{
    title: string;
    slug?: string | null;
    excerpt?: string | null;
    content: string;
    category?: string;
    author?: string;
    imageUrl?: string | null;
    externalLink?: string | null;
    publishedAt?: Date | null;
  }>
) {
  try {
    await requireAdmin();
    const post = await prisma.post.update({
      where: { id },
      data,
    });
    revalidatePath("/dashboard/cms/blog");
    revalidatePath("/blog");
    revalidateTag(TAGS.posts, "max");
    notifySearchEngines([`/blog/${post.slug ?? post.id}`, "/blog"]);
    return { success: true, post };
  } catch (error) {
    console.error("Failed to update post:", error);
    return { success: false, error: "Failed to update post." };
  }
}

export async function deletePost(id: string) {
  try {
    await requireAdmin();
    await prisma.post.delete({
      where: { id },
    });
    revalidatePath("/dashboard/cms/blog");
    revalidatePath("/blog");
    revalidateTag(TAGS.posts, "max");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete post:", error);
    return { success: false, error: "Failed to delete post." };
  }
}
