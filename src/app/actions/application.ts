"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitApplication(programId: string, content: string) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user || !session.user.id) {
    return { error: "You must be logged in to apply." };
  }
  
  try {
    // Check for existing
    const existing = await prisma.application.findUnique({
      where: {
         userId_programId: {
            userId: session.user.id,
            programId
         }
      }
    });

    if (existing) {
       return { error: "You have already applied to this program." };
    }

    const app = await prisma.application.create({
      data: {
        userId: session.user.id,
        programId,
        content,
        status: "PENDING",
        expectedWaitDays: 7,
      }
    });
    
    // Add default tracking steps for the timeline
    await prisma.applicationStep.createMany({
       data: [
          { applicationId: app.id, title: "Application Submitted", status: "COMPLETED", order: 1, date: new Date() },
          { applicationId: app.id, title: "Initial Review", status: "IN_PROGRESS", order: 2 },
          { applicationId: app.id, title: "Admissions Interview", status: "UPCOMING", order: 3 },
          { applicationId: app.id, title: "Final Decision", status: "UPCOMING", order: 4 },
       ]
    });

    revalidatePath("/dashboard/applications");
    revalidatePath("/dashboard");
    return { success: true, applicationId: app.id };
  } catch (err: any) {
    console.error("Apply error:", err);
    return { error: "Failed to submit application. Please try again later." };
  }
}
