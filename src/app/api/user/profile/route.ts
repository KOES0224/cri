import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name, password } = await req.json();

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    
    if (password && password.trim().length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    }

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
