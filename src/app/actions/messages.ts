"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Validates the session and returns the user object.
 */
async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Checks if the user is enrolled in any active program.
 * Admins inherently bypass this check.
 */
export async function checkHasActiveEnrollments() {
  const session = await requireAuth();
  
  // Admins always have access to messaging
  if (session.user.role === "ADMIN") return true;

  const count = await prisma.enrollment.count({
    where: {
      userId: session.user.id,
      status: "ONGOING"
    }
  });

  return count > 0;
}

/**
 * Returns the TOTAL number of unread messages for the logged-in user.
 */
export async function getGlobalUnreadCount() {
  const session = await requireAuth();
  
  const count = await prisma.message.count({
    where: {
      receiverId: session.user.id,
      read: false
    }
  });

  return count;
}

/**
 * Peer Discovery:
 * Returns a list of users the current student is allowed to message.
 * - Students can only message other students who share the exact same Program ID.
 * - Admins can message anyone.
 */
export async function getAvailableContacts() {
  const session = await requireAuth();

  // Helper to fetch unread counts mapped by senderId
  const unreadMessagesData = await prisma.message.groupBy({
    by: ['senderId'],
    where: {
      receiverId: session.user.id,
      read: false
    },
    _count: {
      id: true
    }
  });

  const unreadMap = new Map();
  unreadMessagesData.forEach(entry => {
    unreadMap.set(entry.senderId, entry._count.id);
  });

  // 1. Admins see everyone (For scalability, limit this or add search later. For now, pull all)
  if (session.user.role === "ADMIN") {
    const allUsers = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { 
        id: true, 
        name: true,
        email: true,
        image: true, 
        role: true,
        enrollments: {
          where: { status: "ONGOING" },
          select: { program: { select: { id: true, title: true } } }
        }
      }
    });
    return allUsers.map(u => ({ ...u, unreadCount: unreadMap.get(u.id) || 0 }));
  }

  // 2. Students & Parents logic
  // Fetch programs the user is enrolled in
  const userEnrollments = await prisma.enrollment.findMany({
    where: { userId: session.user.id, status: "ONGOING" },
    select: { programId: true }
  });

  if (userEnrollments.length === 0) {
    return []; // Access gate backup: No programs means no contacts.
  }

  const programIds = userEnrollments.map(e => e.programId);

  // Fetch all users who share any of these programIds, extracting unique users
  const peerEnrollments = await prisma.enrollment.findMany({
    where: {
      programId: { in: programIds },
      status: "ONGOING",
      userId: { not: session.user.id } // exclude self
    },
    include: {
      user: { select: { id: true, name: true, image: true, role: true } }
    }
  });

  // Deduplicate peers (in case they share multiple classes)
  const uniquePeersMap = new Map();
  for (const record of peerEnrollments) {
    if (record.user) {
      uniquePeersMap.set(record.user.id, record.user);
    }
  }
  
  let peers = Array.from(uniquePeersMap.values()).map((p: any) => ({
    ...p,
    unreadCount: unreadMap.get(p.id) || 0
  }));

  // Also include Admins automatically so students can always reach support
  // PER USER REQUEST: Limit Admin visibility exclusively to "support@cri.kr"
  const admins = await prisma.user.findMany({
    where: { 
      role: "ADMIN",
      email: "support@cri.kr"
    },
    select: { id: true, name: true, image: true, role: true }
  });

  const processedAdmins = admins.map(a => ({
    ...a,
    unreadCount: unreadMap.get(a.id) || 0
  }));

  return [...processedAdmins, ...peers];
}

/**
 * Fetch the exact chat history between the logged-in user and a specific contact.
 */
export async function getConversation(contactId: string) {
  const session = await requireAuth();

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id, receiverId: contactId },
        { senderId: contactId, receiverId: session.user.id }
      ]
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  // Mark all unread messages sent TO the active user from this contact as read
  await prisma.message.updateMany({
    where: {
      senderId: contactId,
      receiverId: session.user.id,
      read: false
    },
    data: {
      read: true
    }
  });

  return messages;
}

/**
 * Send a new raw message from the currently authenticated user to a receiver.
 */
export async function sendMessage(receiverId: string, content: string) {
  const session = await requireAuth();
  
  if (!content.trim()) return { success: false, error: "Empty message" };

  try {
    await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content
      }
    });

    revalidatePath("/dashboard/messages");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Send a message to multiple users simultaneously.
 * Admin only.
 */
export async function sendGroupMessage(receiverIds: string[], content: string) {
  const session = await requireAuth();
  
  if (session.user.role !== "ADMIN") return { success: false, error: "Unauthorized" };
  if (!content.trim() || receiverIds.length === 0) return { success: false, error: "Empty message or no recipients" };

  try {
    const messages = receiverIds.map(id => ({
      senderId: session.user.id,
      receiverId: id,
      content
    }));

    await prisma.message.createMany({
      data: messages
    });

    revalidatePath("/dashboard/messages");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
