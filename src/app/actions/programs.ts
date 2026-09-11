"use server";

import { inventoryFacts } from "@/lib/program-policy";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPrograms() {
  await requireAdmin();
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
    return await prisma.program.findFirst({
      where: { id, isPublished: true },
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
  revalidatePath("/research", "layout");
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
  startDate?: Date | null;
  endDate?: Date | null;
  content?: string | null;
  teachingHoursProf?: string | null;
  teachingHoursTA?: string | null;
  courseSchedule?: string | null;
  locationFormat?: string | null;
  capacity?: number | null;
  professorIds?: string[];
}) {
  await requireAdmin();
  const { professorIds, ...rest } = data;
  try {
    const program = await prisma.program.create({
      data: {
        ...rest,
        ...inventoryFacts(rest.category!),
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
    startDate?: Date | null;
    endDate?: Date | null;
    content?: string | null;
    teachingHoursProf?: string | null;
    teachingHoursTA?: string | null;
    courseSchedule?: string | null;
    locationFormat?: string | null;
    capacity?: number | null;
    professorIds?: string[];
  }>
) {
  await requireAdmin();
  const { professorIds, ...rest } = data;
  const current = await prisma.program.findUnique({ where: { id } });
  if (!current) return { success: false, error: "Program not found." };
  try {
    const program = await prisma.program.update({
      where: { id },
      data: {
        ...rest,
        ...inventoryFacts(rest.category || current.category),
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
  await requireAdmin();
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
  await requireAdmin();
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
  await requireAdmin();
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

export async function getProgramInventory() {
  await requireAdmin();
  return prisma.program.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: { id: true, title: true, category: true, subCategory: true, tuition: true, order: true, status: true, isPublished: true, startDate: true, endDate: true, createdAt: true },
  });
}

export async function getAdminProgramForEdit(id: string) {
  await requireAdmin();
  return prisma.program.findUnique({ where: { id }, include: { professors: { select: { id: true, name: true } } } });
}

export async function getAdminProgramProfessors() {
  await requireAdmin();
  return prisma.professor.findMany({ orderBy: { name: "asc" } });
}
