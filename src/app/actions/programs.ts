"use server";

import { inventoryFacts, programHref } from "@/lib/program-policy";
import { notifySearchEngines } from "@/lib/indexnow";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { TAGS } from "@/lib/public-data";
import type { Prisma } from "@prisma/client";
import { normalizeSlug, programPath, slugFromTitle } from "@/lib/program-slug";
import { SlugError, assignSlug, availableSlug } from "@/lib/program-slug-store";

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

/** Program detail plus the listing pages that show it, for IndexNow. */
const programPaths = (program: { id: string; slug: string | null; category: string }) =>
  program.category === "Internship"
    ? [programPath(program), "/intern"]
    : [programPath(program), "/research", programHref(program.category), "/"];

/**
 * Sets the program's page address inside the caller's transaction. A typed slug is used as given (normalized) and
 * refused if another program has or had it; an empty field means "make it from the title", with -2, -3… added
 * when the plain one is taken. A title with no usable letters leaves the program on its id address.
 */
async function saveSlug(tx: Prisma.TransactionClient, program: { id: string; slug: string | null; title: string }, typed: string | null | undefined) {
  const wanted = typed?.trim() ? normalizeSlug(typed) : slugFromTitle(program.title);
  if (typed?.trim() && !wanted) throw new SlugError("The page address needs lowercase letters or numbers.");
  if (!wanted || wanted === program.slug) return;
  await assignSlug(tx, program.id, typed?.trim() ? wanted : await availableSlug(tx, wanted, program.id));
}

const revalidateProgramPaths = () => {
  revalidateTag(TAGS.programs, "max");
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
  /** Page address; empty or missing makes one from the title. */
  slug?: string | null;
}) {
  await requireAdmin();
  const { professorIds, slug, ...rest } = data;
  try {
    const program = await prisma.$transaction(async (tx) => {
      const created = await tx.program.create({
        data: {
          ...rest,
          ...inventoryFacts(rest.category!),
          professors: professorIds ? { connect: professorIds.map((id) => ({ id })) } : undefined,
        },
      });
      await saveSlug(tx, created, slug);
      return tx.program.findUniqueOrThrow({ where: { id: created.id } });
    });
    revalidateProgramPaths();
    notifySearchEngines(programPaths(program));
    return { success: true, program };
  } catch (error) {
    if (error instanceof SlugError) return { success: false, error: error.message };
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
    /** Page address. Leave the key out to keep it; an empty value makes one from the title. */
    slug?: string | null;
  }>
) {
  await requireAdmin();
  const { professorIds, slug, ...rest } = data;
  const current = await prisma.program.findUnique({ where: { id } });
  if (!current) return { success: false, error: "Program not found." };
  try {
    const program = await prisma.$transaction(async (tx) => {
      const updated = await tx.program.update({
        where: { id },
        data: {
          ...rest,
          ...inventoryFacts(rest.category || current.category),
          professors: professorIds ? { set: professorIds.map((id) => ({ id })) } : undefined,
        },
      });
      if (slug !== undefined) await saveSlug(tx, updated, slug);
      return tx.program.findUniqueOrThrow({ where: { id } });
    });
    revalidateProgramPaths();
    // When the address changed, the old one now redirects: have the engines look at it too.
    const moved = programPath(current) !== programPath(program);
    notifySearchEngines([...programPaths(program), ...(moved ? [programPath(current)] : [])]);
    return { success: true, program };
  } catch (error) {
    if (error instanceof SlugError) return { success: false, error: error.message };
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
    notifySearchEngines(programPaths(program));
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
