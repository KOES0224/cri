"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  try {
    return await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw new Error("Failed to fetch users.");
  }
}

export async function updateUserRole(userId: string, activeRole: string) {
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

export async function deleteUser(userId: string) {
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
