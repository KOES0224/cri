import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { allowRequest } from "@/lib/request-limit";
import { validNewPassword } from "@/lib/password-policy";
import * as z from "zod";

function generateStudentCode() {
  return Math.floor(10000000 + Math.random() * 90000000).toString(); // 8 digit random string
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const registerSchema = z.object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().toLowerCase().email().max(254),
      password: z.string().refine(validNewPassword, "Use at least 12 characters, up to 72 bytes"),
      role: z.enum(["STUDENT", "PARENT"]),
    });

    const parsed = registerSchema.safeParse(body);
    
    if (!parsed.success) {
      return new NextResponse("Validation Error: Invalid Input", { status: 400 });
    }

    const { name, email, password, role } = parsed.data;

    if (!await allowRequest("register", email, 5, 900)) return new NextResponse("Please try again later.", { status: 429 });
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return new NextResponse("Unable to create this account. Try signing in or recovering your account.", { status: 409 });
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
