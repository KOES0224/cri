"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSuccessStories() {
  try {
    return await prisma.successStory.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch success stories:", error);
    throw new Error("Failed to fetch success stories.");
  }
}

export async function createSuccessStory(data: {
  slug?: string | null;
  name: string;
  university: string;
  major: string;
  projectTitle: string;
  description?: string | null;
  imageUrl?: string | null;
  externalLink?: string | null;
}) {
  try {
    const story = await prisma.successStory.create({
      data,
    });
    revalidatePath("/dashboard/cms/success");
    revalidatePath("/success");
    return { success: true, story };
  } catch (error) {
    console.error("Failed to create success story:", error);
    return { success: false, error: "Failed to create success story." };
  }
}

export async function updateSuccessStory(
  id: string,
  data: Partial<{
    slug?: string | null;
    name: string;
    university: string;
    major: string;
    projectTitle: string;
    description?: string | null;
    imageUrl?: string | null;
    externalLink?: string | null;
  }>
) {
  try {
    const story = await prisma.successStory.update({
      where: { id },
      data,
    });
    revalidatePath("/dashboard/cms/success");
    revalidatePath("/success");
    return { success: true, story };
  } catch (error) {
    console.error("Failed to update success story:", error);
    return { success: false, error: "Failed to update success story." };
  }
}

export async function deleteSuccessStory(id: string) {
  try {
    await prisma.successStory.delete({
      where: { id },
    });
    revalidatePath("/dashboard/cms/success");
    revalidatePath("/success");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete success story:", error);
    return { success: false, error: "Failed to delete success story." };
  }
}
