"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSiteContent(page: string) {
  try {
    const contents = await prisma.siteContent.findMany({
      where: { page },
    });

    // Reduce into a dictionary format: { "hero_title": "Welcome", ... }
    const dictionary = contents.reduce((acc: Record<string, string>, item: any) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    return { success: true, data: dictionary };
  } catch (error) {
    console.error("Failed to fetch site content:", error);
    return { success: false, data: {} };
  }
}

export async function saveSiteContent(page: string, data: Record<string, string>) {
  try {
    // We will upsert each key provided.
    const promises = Object.entries(data).map(([key, value]) => {
      const safeValue = typeof value === 'string' ? value : String(value || "");
      return prisma.siteContent.upsert({
        where: { key },
        update: { value: safeValue },
        create: { key, value: safeValue, page, type: "text" },
      });
    });

    await prisma.$transaction(promises);

    revalidatePath("/");
    revalidatePath(`/dashboard/cms/${page}`);

    return { success: true };
  } catch (error: any) {
    console.error("Failed to save site content:", error);
    return { success: false, error: error.message };
  }
}
