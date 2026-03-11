"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPrograms() {
  try {
    return await prisma.program.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch programs:", error);
    throw new Error("Failed to fetch programs.");
  }
}

export async function getProgramById(id: string) {
  try {
    return await prisma.program.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error(`Failed to fetch program with id ${id}:`, error);
    return null;
  }
}

export async function createProgram(data: {
  title: string;
  description: string;
  category: string;
  subCategory?: string | null;
  status: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const program = await prisma.program.create({
      data,
    });
    revalidatePath("/dashboard");
    revalidatePath("/research");
    return { success: true, program };
  } catch (error) {
    console.error("Failed to create program:", error);
    return { success: false, error: "Failed to create program." };
  }
}

export async function updateProgram(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    category: string;
    subCategory?: string | null;
    status: string;
    startDate?: Date;
    endDate?: Date;
  }>
) {
  try {
    const program = await prisma.program.update({
      where: { id },
      data,
    });
    revalidatePath("/dashboard");
    revalidatePath("/research");
    return { success: true, program };
  } catch (error) {
    console.error("Failed to update program:", error);
    return { success: false, error: "Failed to update program." };
  }
}

export async function deleteProgram(id: string) {
  try {
    await prisma.program.delete({
      where: { id },
    });
    revalidatePath("/dashboard");
    revalidatePath("/research");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete program:", error);
    return { success: false, error: "Failed to delete program." };
  }
}
