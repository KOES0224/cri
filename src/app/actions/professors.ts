"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProfessors() {
  try {
    return await prisma.professor.findMany({
      include: { programs: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch professors:", error);
    throw new Error("Failed to fetch professors.");
  }
}

export async function createProfessor(data: {
  name: string;
  role: string;
  university?: string | null;
  bio: string;
  imageUrl?: string | null;
  acceptingMentees?: boolean;
  publications?: number;
  programIds?: string[];
  courseTitle?: string | null;
  courseDescription?: string | null;
  idealStudents?: string | null;
  potentialTopics?: string | null;
  relatedMajor?: string | null;
  keywords?: string | null;
}) {
  const { programIds, ...rest } = data;
  try {
    const prof = await prisma.professor.create({
      data: {
        ...rest,
        programs: {
          connect: programIds?.map(id => ({ id })) || []
        }
      },
    });
    revalidatePath("/dashboard/cms/professors");
    revalidatePath("/professors");
    return { success: true, prof };
  } catch (error) {
    console.error("Failed to create professor:", error);
    return { success: false, error: "Failed to create professor." };
  }
}

export async function updateProfessor(
  id: string,
  data: Partial<{
    name: string;
    role: string;
    university?: string | null;
    bio: string;
    imageUrl?: string | null;
    acceptingMentees?: boolean;
    publications?: number;
    programIds?: string[];
    courseTitle?: string | null;
    courseDescription?: string | null;
    idealStudents?: string | null;
    potentialTopics?: string | null;
    relatedMajor?: string | null;
    keywords?: string | null;
  }>
) {
  const { programIds, ...rest } = data;
  try {
    const prof = await prisma.professor.update({
      where: { id },
      data: {
        ...rest,
        programs: programIds ? {
          set: programIds.map(pid => ({ id: pid }))
        } : undefined
      },
    });
    revalidatePath("/dashboard/cms/professors");
    revalidatePath("/professors");
    return { success: true, prof };
  } catch (error) {
    console.error("Failed to update professor:", error);
    return { success: false, error: "Failed to update professor." };
  }
}

export async function deleteProfessor(id: string) {
  try {
    await prisma.professor.delete({
      where: { id },
    });
    revalidatePath("/dashboard/cms/professors");
    revalidatePath("/professors");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete professor:", error);
    return { success: false, error: "Failed to delete professor." };
  }
}
