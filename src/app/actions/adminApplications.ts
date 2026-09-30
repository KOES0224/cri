"use server";

import { requireAdmin } from "@/lib/admin";
import { changeApplication } from "@/lib/application-workflow";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { formatKST } from "@/lib/formatKST";

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

  if (!["COMPLETED", "IN_PROGRESS", "UPCOMING", "WAIVED"].includes(status)) return { success: false, error: "Invalid step status." };
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

export async function updateApplicationStatus(applicationId: string, status: string, expectedUpdatedAt?: Date | string) {
  try {
    const admin = await requireAdmin();
    const session = await getServerSession(authOptions);
    const updated = await changeApplication(applicationId, { status }, { id: admin.id, name: session?.user.name || "Administrator" }, expectedUpdatedAt);
    revalidatePath("/dashboard", "layout");
    return { success: true as const, ...updated };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Unable to save the decision." };
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
        content: `Scheduled an alarm: "${message}" for ${formatKST(dueDate, 'yyyy년 M월 d일')}`
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
        content: `Scheduled a Calendar Meeting: "${title}" for ${formatKST(startDateTime, 'yyyy년 M월 d일 (EEE) a h:mm')}.\nLink: ${conferenceLink || 'Check Calendar'}`
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

/**
 * Updates application tracking metadata from the spreadsheet view
 */
export async function updateApplicationProcessingFields(
  id: string,
  data: Partial<{ stage: string; finalRegisteredCourse: string; interviewDate: Date | null; paymentDeadline: Date | null; interviewComments: string; generalComments: string }>,
  expectedUpdatedAt?: Date | string,
  enrollmentConfirmed = false,
) {
  try {
    const admin = await requireAdmin();
    const session = await getServerSession(authOptions);
    const updated = await changeApplication(id, data, { id: admin.id, name: session?.user.name || "Administrator" }, expectedUpdatedAt, enrollmentConfirmed);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/applications-admin");
    // Avoid replacing the spreadsheet while a field is being edited.
    return { success: true as const, ...updated };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Unable to save changes." };
  }
}

/**
 * Permanently delete an application from the database.
 */
export async function deleteApplication(applicationId: string) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.application.delete({
      where: { id: applicationId }
    });
    
    revalidatePath("/dashboard/applications-admin");
    revalidatePath("/admin/applications-sheet");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete application" };
  }
}


