"use server";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  await requireAdmin();
  try {
    return await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, studentCode: true, isAgency: true, agencyName: true, createdAt: true }
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw new Error("Failed to fetch users.");
  }
}

export async function updateUserRole(userId: string, activeRole: string) {
  const admin = await requireAdmin();
  if (!["ADMIN", "STUDENT", "PARENT"].includes(activeRole)) return { success: false, error: "Invalid role." };
  if (admin.id === userId && activeRole !== "ADMIN") return { success: false, error: "Ask another administrator to change your role." };
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: activeRole },
    });
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to update user role:", error);
    return { success: false, error: "Failed to update user role." };
  }
}

export async function updateUserAgency(userId: string, isAgency: boolean, agencyName: string | null) {
  await requireAdmin();
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isAgency, agencyName },
    });
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to update user agency details:", error);
    return { success: false, error: "Failed to update agency status." };
  }
}

export async function deleteUser(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) return { success: false, error: "You cannot delete your own administrator account." };
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, error: "Failed to delete user." };
  }
}

export async function getUserDetails(id: string) {
  await requireAdmin();
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            program: true,
            steps: { orderBy: { order: 'asc' } }
          },
          orderBy: { createdAt: 'desc' }
        },
        activities: {
          orderBy: { createdAt: 'desc' }
        },
        notifications: {
          orderBy: { dueDate: 'asc' }
        },
        enrollments: { include: { program: { select: { title: true } } } },
        leads: {
          include: {
            notifications: { orderBy: { dueDate: "asc" } },
            activities: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });
    if (!user) return null;
    const { password, sessionVersion, ...safeUser } = user;
    return { ...safeUser, notifications: Array.from(new Map([...safeUser.notifications, ...safeUser.leads.flatMap(lead => lead.notifications)].map(item => [item.id,item])).values()).sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime()) };
  } catch (error) {
    console.error("Failed to fetch user details:", error);
    return null;
  }
}

