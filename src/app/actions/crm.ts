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
    let linkedUserId = null;
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) linkedUserId = existingUser.id;
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email: email || null,
        userId: linkedUserId,
        createdBy: session.user.id,
        activities: {
          create: {
            action: "NOTE_ADDED",
            adminName: session.user.name || "Admin",
            content: linkedUserId 
               ? "Lead manually created in CRM. Automatically linked to existing portal account via email." 
               : "Lead manually created in CRM.",
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
    let linkedUserId = undefined;
    if (data.email) {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser) linkedUserId = existingUser.id;
    }

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
        ...(linkedUserId ? { userId: linkedUserId } : {}),
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

// ----------------------------------------------------------------------
// USER LINKING & DELETION
// ----------------------------------------------------------------------

export async function manuallyLinkLeadToUser(leadId: string, emailOrCode: string) {
  const session = await requireAdmin();
  
  if (!emailOrCode.trim()) return { success: false, error: "Email or Student Code is required" };

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrCode },
          { studentCode: emailOrCode }
        ]
      }
    });

    if (!user) return { success: false, error: "No user found matching that email or code." };

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        userId: user.id,
        activities: {
          create: {
            action: "NOTE_ADDED",
            adminName: session.user.name || "Admin",
            content: `Manually linked Lead to User Account: ${user.name} (${user.email}).`,
          }
        }
      }
    });

    revalidatePath(`/dashboard/leads/${leadId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteLead(leadId: string) {
  await requireAdmin();
  try {
    await prisma.lead.delete({
      where: { id: leadId }
    });
    revalidatePath("/dashboard/leads");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ----------------------------------------------------------------------
// MEETING & CALENDAR ACTIONS
// ----------------------------------------------------------------------

export async function scheduleGoogleMeeting(leadId: string, title: string, startDateTime: Date, durationMinutes: number, generateZoom: boolean = false) {
  const session = await requireAdmin();

  // 1) Verify Google Cloud Credentials
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return { 
      success: false, 
      error: "Google Calendar is not fully configured. Please ensure GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, and GOOGLE_CALENDAR_REFRESH_TOKEN are set." 
    };
  }

  try {
    // Dynamically import googleapis to keep the main bundle lighter if possible
    const { google } = require('googleapis');
    
    // 2) Configure OAuth2 Auth
    const auth = new google.auth.OAuth2(
      clientId,
      clientSecret
    );
    auth.setCredentials({ refresh_token: refreshToken });

    // Assuming we drop it into the primary calendar of the authenticated user
    const calendarId = "primary"; 
    const calendar = google.calendar({ version: 'v3', auth });
    
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

    // 3) Create Calendar Event Request Body
    const eventBody: any = {
      summary: title,
      start: {
        dateTime: startDateTime.toISOString(),
      },
      end: {
        dateTime: endDateTime.toISOString(),
      },
    };

    // If Zoom natively (or Google Meet) is desired:
    // Adding Google Meet automatically requires conferenceData.
    // If the user's workspace defaults to Zoom when Meet is requested, this might trigger it.
    // However, Zoom API integration typically requires separate zoom credentials. For now, we request hangout/meet or leave to the calendar's default.
    eventBody.conferenceData = {
      createRequest: {
        requestId: `req-${Date.now()}`,
        conferenceSolutionKey: {
          type: "hangoutsMeet" // We request standard meeting generation, which can be Zoom if the Workspace add-on enforces it, otherwise Google Meet.
        }
      }
    };

    // 4) Execute Insert
    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: eventBody,
      conferenceDataVersion: 1, // Needed to tell API we want to generate a meet link
    });

    const eventLink = response.data.htmlLink;
    let conferenceLink = response.data.hangoutLink;
    
    // Check if Zoom URL is generated in location
    if (response.data.location && response.data.location.includes('zoom.us')) {
      conferenceLink = response.data.location;
    } else if (response.data.conferenceData && response.data.conferenceData.entryPoints) {
      const videoEntry = response.data.conferenceData.entryPoints.find((e: any) => e.entryPointType === 'video');
      if (videoEntry) {
        conferenceLink = videoEntry.uri;
      }
    }

    // 5) Log the success into CRM Timeline
    await prisma.leadActivity.create({
      data: {
        leadId,
        action: "NOTE_ADDED",
        adminName: session.user.name || "Admin",
        content: `Scheduled a Calendar Meeting: "${title}" for ${startDateTime.toLocaleString()}.\nLink: ${conferenceLink || 'Check Calendar'}`
      }
    });

    // 6) Also log an active Alarm to the Dashboard
    await prisma.notification.create({
      data: {
        leadId,
        adminName: session.user.name || "Admin",
        message: `📅 Meeting Scheduled: ${title}`,
        dueDate: startDateTime,
      }
    });

    revalidatePath(`/dashboard/leads/${leadId}`);
    return { success: true, eventLink, conferenceLink };
  } catch (error: any) {
    console.error("Calendar API Error:", error);
    return { success: false, error: error.message };
  }
}

