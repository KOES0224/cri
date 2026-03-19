import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import * as z from "zod";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    const profileSchema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters").optional().or(z.literal("")),
      password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
    });

    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return new NextResponse("Validation Error: Invalid Input", { status: 400 });
    }

    const { name, password } = parsed.data;

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({ message: "Profile updated successfully", user: { name: updatedUser.name } });
  } catch (error) {
    console.error("Profile update error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
