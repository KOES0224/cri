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

export async function createLead(name: string, email?: string) {
  const session = await requireAdmin();
  if (!name.trim()) return { success: false, error: "Name is required" };

  try {
    const lead = await prisma.lead.create({
      data: {
        name,
        email: email || null,
        activities: {
          create: {
            action: "NOTE_ADDED",
            adminName: session.user.name || "Admin",
            content: "Lead manually created in CRM.",
          }
        }
      }
    });
    revalidatePath("/dashboard/leads");
    return { success: true, leadId: lead.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
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
      notifications: {
        orderBy: { dueDate: "asc" },
      }
    },
  });
}

export async function updateLeadDetails(id: string, data: any) {
  const session = await requireAdmin();
  try {
    await prisma.lead.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        age: data.age ? parseInt(data.age) : null,
        interest: data.interest,
        institution: data.institution,
        agencyName: data.agencyName,
        parentName: data.parentName,
        kakaoId: data.kakaoId,
      }
    });
    revalidatePath(`/dashboard/leads/${id}`);
    revalidatePath("/dashboard/leads");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
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

export async function scheduleNotification(leadId: string, message: string, dueDate: Date) {
  const session = await requireAdmin();
  
  try {
    await prisma.notification.create({
      data: {
        leadId,
        adminName: session.user.name || "Admin",
        message,
        dueDate,
      }
    });

    // Also drop a note in the timeline automatically
    await prisma.leadActivity.create({
      data: {
        leadId,
        action: "NOTE_ADDED",
        adminName: session.user.name || "Admin",
        content: `Scheduled an alarm: "${message}" for ${dueDate.toLocaleDateString()}`
      }
    });

    revalidatePath(`/dashboard/leads/${leadId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getActiveNotifications() {
  await requireAdmin();
  // Fetch unread notifications due today or in the future
  return prisma.notification.findMany({
    where: {
       isRead: false,
    },
    orderBy: { dueDate: "asc" },
    include: {
      lead: {
        select: { name: true, id: true, status: true }
      }
    }
  });
}

export async function markNotificationRead(id: string) {
  await requireAdmin();
  await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  });
  revalidatePath("/dashboard");
}

export async function getRecentLeadActivities(limit: number = 15) {
  await requireAdmin();
  return prisma.leadActivity.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      lead: {
        select: { id: true, name: true }
      }
    }
  });
}
