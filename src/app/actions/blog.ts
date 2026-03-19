"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPosts() {
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
    const post = await prisma.post.create({
      data,
    });
    revalidatePath("/dashboard/cms/blog");
    revalidatePath("/blog");
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
    const post = await prisma.post.update({
      where: { id },
      data,
    });
    revalidatePath("/dashboard/cms/blog");
    revalidatePath("/blog");
    return { success: true, post };
  } catch (error) {
    console.error("Failed to update post:", error);
    return { success: false, error: "Failed to update post." };
  }
}

export async function deletePost(id: string) {
  try {
    await prisma.post.delete({
      where: { id },
    });
    revalidatePath("/dashboard/cms/blog");
    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete post:", error);
    return { success: false, error: "Failed to delete post." };
  }
}
