import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

function generateStudentCode() {
  return Math.floor(10000000 + Math.random() * 90000000).toString(); // 8 digit random string
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { role } = body;

    if (role !== "STUDENT" && role !== "PARENT") {
      return new NextResponse("Invalid Role", { status: 400 });
    }

    let studentCode = null;
    if (role === "STUDENT") {
      let isUnique = false;
      while (!isUnique) {
        studentCode = generateStudentCode();
        const checkExistingCode = await prisma.user.findUnique({
          where: { studentCode },
        });
        if (!checkExistingCode) {
          isUnique = true;
        }
      }
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        role,
        studentCode,
      },
    });

    return NextResponse.json({ success: true, role, studentCode });
  } catch (error: any) {
    console.error("ONBOARDING_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
