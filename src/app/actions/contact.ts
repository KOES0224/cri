"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function submitContactForm(data: {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}) {
  if (!data.firstName || !data.email || !data.message) {
    return { success: false, error: "Please fill in all required fields." };
  }

  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return { success: false, error: "You must be signed in to submit an inquiry." };
  }

  try {
    const fullName = `${data.firstName} ${data.lastName}`.trim();

    await prisma.lead.create({
      data: {
        userId: session.user.id, // Link to the authenticated user
        name: fullName,
        email: data.email,
        notes: data.message,
        status: "NEW", // Explicitly setting though it's default
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return { success: false, error: "An unexpected error occurred. Please manually email us at Admin@cri.kr" };
  }
}
