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
 * Peer Discovery:
 * Returns a list of users the current student is allowed to message.
 * - Students can only message other students who share the exact same Program ID.
 * - Admins can message anyone.
 */
export async function getAvailableContacts() {
  const session = await requireAuth();

  // 1. Admins see everyone (For scalability, limit this or add search later. For now, pull all)
  if (session.user.role === "ADMIN") {
    return prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, image: true, role: true }
    });
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
  
  let peers = Array.from(uniquePeersMap.values());

  // Also include Admins automatically so students can always reach support
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, name: true, image: true, role: true }
  });

  return [...admins, ...peers];
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
