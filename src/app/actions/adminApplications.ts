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

export async function scheduleUserNotification(userId: string, message: string, dueDate: Date) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return { success: false, error: "Unauthorized" };
  
  try {
    await prisma.notification.create({
      data: {
        userId,
        adminName: session.user.name || "Admin",
        message,
        dueDate,
      }
    });

    await prisma.userActivity.create({
      data: {
        userId,
        action: "NOTE_ADDED",
        adminName: session.user.name || "Admin",
        content: `Scheduled an alarm: "${message}" for ${dueDate.toLocaleDateString()}`
      }
    });

    revalidatePath(`/dashboard/users/${userId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function scheduleUserGoogleMeeting(userId: string, title: string, startDateTime: Date, durationMinutes: number) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return { success: false, error: "Unauthorized" };

  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return { success: false, error: "Google Calendar not fully configured." };
  }

  try {
    const { google } = require('googleapis');
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });

    const calendar = google.calendar({ version: 'v3', auth });
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

    const eventBody: any = {
      summary: title,
      start: { dateTime: startDateTime.toISOString() },
      end: { dateTime: endDateTime.toISOString() },
      conferenceData: {
        createRequest: {
          requestId: `req-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" }
        }
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventBody,
      conferenceDataVersion: 1,
    });

    const eventLink = response.data.htmlLink;
    let conferenceLink = response.data.hangoutLink;
    
    if (response.data.location?.includes('zoom.us')) conferenceLink = response.data.location;
    else if (response.data.conferenceData?.entryPoints) {
      const videoEntry = response.data.conferenceData.entryPoints.find((e: any) => e.entryPointType === 'video');
      if (videoEntry) conferenceLink = videoEntry.uri;
    }

    await prisma.userActivity.create({
      data: {
        userId,
        action: "NOTE_ADDED",
        adminName: session.user.name || "Admin",
        content: `Scheduled a Calendar Meeting: "${title}" for ${startDateTime.toLocaleString()}.\nLink: ${conferenceLink || 'Check Calendar'}`
      }
    });

    await prisma.notification.create({
      data: {
        userId,
        adminName: session.user.name || "Admin",
        message: `📅 Meeting Scheduled: ${title}`,
        dueDate: startDateTime,
      }
    });

    revalidatePath(`/dashboard/users/${userId}`);
    return { success: true, eventLink, conferenceLink };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAdminApplicationsExportData() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const applications = await prisma.application.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            studentCode: true, 
            activities: { orderBy: { createdAt: 'asc' } } 
          }
        },
        program: {
          select: { title: true, category: true }
        }
      }
    });

    return { success: true, data: applications };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Updates application tracking metadata from the spreadsheet view
 */
export async function updateApplicationProcessingFields(
  id: string,
  data: Partial<{
    stage: string;
    interviewDate: Date | null;
    paymentDeadline: Date | null;
    interviewComments: string;
    generalComments: string;
  }>
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return { success: false, error: "Unauthorized" };

  try {
    await prisma.application.update({
      where: { id },
      data
    });
    
    // We don't strictly revalidatePath here because it will disrupt the spreadsheet UI focus. 
    // The spreadsheet will handle optimistic UI updates.
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

