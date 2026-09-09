"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPrograms() {
  try {
    return await prisma.program.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: {
        professors: { select: { id: true, name: true } }
      }
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
      include: { professors: true },
    });
  } catch (error) {
    console.error(`Failed to fetch program with id ${id}:`, error);
    return null;
  }
}

const revalidateProgramPaths = () => {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/programs");
  revalidatePath("/research");
  revalidatePath("/research/winter");
  revalidatePath("/research/summer-camp");
  revalidatePath("/research/1-on-1");
};

export async function createProgram(data: {
  title: string;
  description: string;
  category: string;
  subCategory?: string | null;
  tuition?: number | null;
  status: string;
  isPublished?: boolean;
  startDate?: Date;
  endDate?: Date;
  content?: string | null;
  teachingHoursProf?: string | null;
  teachingHoursTA?: string | null;
  courseSchedule?: string | null;
  professorIds?: string[];
}) {
  const { professorIds, ...rest } = data;
  try {
    const program = await prisma.program.create({
      data: {
        ...rest,
        professors: professorIds ? { connect: professorIds.map((id) => ({ id })) } : undefined,
      },
    });
    revalidateProgramPaths();
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
    tuition?: number | null;
    status: string;
    isPublished?: boolean;
    startDate?: Date;
    endDate?: Date;
    content?: string | null;
    teachingHoursProf?: string | null;
    teachingHoursTA?: string | null;
    courseSchedule?: string | null;
    professorIds?: string[];
  }>
) {
  const { professorIds, ...rest } = data;
  try {
    const program = await prisma.program.update({
      where: { id },
      data: {
        ...rest,
        professors: professorIds ? { set: professorIds.map((id) => ({ id })) } : undefined,
      },
    });
    revalidateProgramPaths();
    return { success: true, program };
  } catch (error) {
    console.error("Failed to update program:", error);
    return { success: false, error: "Failed to update program." };
  }
}

export async function toggleProgramPublished(id: string, isPublished: boolean) {
  try {
    const program = await prisma.program.update({
      where: { id },
      data: { isPublished },
    });
    revalidateProgramPaths();
    return { success: true, program };
  } catch (error) {
    console.error("Failed to toggle program published status:", error);
    return { success: false, error: "Failed to toggle program visibility." };
  }
}

export async function deleteProgram(id: string) {
  try {
    await prisma.program.delete({
      where: { id },
    });
    revalidateProgramPaths();
    return { success: true };
  } catch (error) {
    console.error("Failed to delete program:", error);
    return { success: false, error: "Failed to delete program." };
  }
}

export async function updateProgramOrder(id: string, order: number) {
  try {
    const program = await prisma.program.update({
      where: { id },
      data: { order },
    });
    revalidateProgramPaths();
    return { success: true, program };
  } catch (error) {
    console.error("Failed to update program order:", error);
    return { success: false, error: "Failed to update program order." };
  }
}
