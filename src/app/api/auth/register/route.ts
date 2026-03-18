import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function generateStudentCode() {
  return Math.floor(10000000 + Math.random() * 90000000).toString(); // 8 digit random string
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return new NextResponse("Missing Info", { status: 400 });
    }

    if (role !== "STUDENT" && role !== "PARENT") {
      return new NextResponse("Invalid Role", { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return new NextResponse("Email already exists", { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

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

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        studentCode,
      },
    });

    return NextResponse.json({ id: user.id, email: user.email, role: user.role, studentCode: user.studentCode });
  } catch (error: any) {
    console.error("REGISTRATION_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
