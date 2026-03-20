"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getLeads() {
  await requireAdmin();
  return prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });
}

export async function getLeadDetails(id: string) {
  await requireAdmin();
  return prisma.lead.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true, studentCode: true },
      },
      activities: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function updateLeadStatus(id: string, status: string) {
  const session = await requireAdmin();

  const currentLead = await prisma.lead.findUnique({ where: { id } });
  if (!currentLead) throw new Error("Lead not found");

  if (currentLead.status === status) return { success: true };

  await prisma.lead.update({
    where: { id },
    data: {
      status,
      activities: {
        create: {
          action: "STATUS_CHANGE",
          adminName: session.user.name || "Admin",
          content: `Status updated from ${currentLead.status} to ${status}`,
        },
      },
    },
  });

  revalidatePath(`/dashboard/leads/${id}`);
  revalidatePath("/dashboard/leads");
  return { success: true };
}

export async function addLeadNote(id: string, note: string) {
  const session = await requireAdmin();

  if (!note.trim()) return { success: false, error: "Note cannot be empty" };

  await prisma.lead.update({
    where: { id },
    data: {
      activities: {
        create: {
          action: "NOTE_ADDED",
          adminName: session.user.name || "Admin",
          content: note,
        },
      },
    },
  });

  revalidatePath(`/dashboard/leads/${id}`);
  return { success: true };
}
