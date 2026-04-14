"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getAdminApplications(limit: number = 5) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const applications = await prisma.application.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true, studentCode: true }
      },
      program: {
        select: { id: true, title: true }
      },
      steps: {
        orderBy: { order: 'asc' }
      }
    }
  });

  return applications;
}

export async function updateApplicationStepStatus(stepId: string, status: string) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.applicationStep.update({
      where: { id: stepId },
      data: { status }
    });
    
    revalidatePath("/dashboard/applications-admin");
    revalidatePath("/dashboard/users/[id]");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update step" };
  }
}

export async function updateApplicationStatus(applicationId: string, status: string) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status }
    });
    
    // Also update enrollment status if accepted/enrolled
    if (status === "ACCEPTED") {
       await prisma.enrollment.upsert({
         where: {
            userId_programId: {
               userId: updated.userId,
               programId: updated.programId
            }
         },
         create: {
            userId: updated.userId,
            programId: updated.programId,
            status: "ONGOING"
         },
         update: {
            status: "ONGOING"
         }
       });
    }

    revalidatePath("/dashboard/applications-admin");
    revalidatePath("/dashboard/users/[id]");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update application" };
  }
}

export async function addUserComment(userId: string, content: string) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.userActivity.create({
      data: {
        userId,
        adminName: session.user.name || "Admin",
        action: "NOTE_ADDED",
        content
      }
    });

    revalidatePath("/dashboard/users/[id]");
    revalidatePath("/dashboard/applications-admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to add comment" };
  }
}
