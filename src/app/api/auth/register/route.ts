import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { allowRequest } from "@/lib/request-limit";
import { validNewPassword } from "@/lib/password-policy";
import * as z from "zod";
import { sendMetaEvent } from "@/lib/meta/capi";

/**
 * Error responses are plain-text stable codes (not sentences) so the client can show them in the visitor's language.
 * Codes: name | nameLong | email | password | role | form | rate | exists | server — see `auth.register.errors` in src/i18n.
 */
function generateStudentCode() {
  return Math.floor(10000000 + Math.random() * 90000000).toString(); // 8 digit random string
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const registerSchema = z.object({
      name: z.string().trim().min(2, "name").max(100, "nameLong"),
      email: z.string().trim().toLowerCase().email("email").max(254, "email"),
      password: z.string().refine(validNewPassword, "password"),
      role: z.enum(["STUDENT", "PARENT"], { message: "role" }),
    });

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      // Tell the person which field to fix instead of a generic validation error.
      return new NextResponse(parsed.error.issues[0]?.message || "form", { status: 400 });
    }

    const { name, email, password, role } = parsed.data;

    if (!await allowRequest("register", email, 5, 900)) return new NextResponse("rate", { status: 429 });
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return new NextResponse("exists", { status: 409 });
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

    const [firstName, ...rest] = name.split(/\s+/);
    const { data: tracking } = await sendMetaEvent({ name: "CompleteRegistration", eventId: user.id, person: { email, firstName, lastName: rest.join(" "), externalId: user.id }, data: { content_name: role.toLowerCase(), status: true } });
    // The new user id is the Meta event id; the browser fires CompleteRegistration with it.
    return NextResponse.json({ id: user.id, email: user.email, role: user.role, studentCode: user.studentCode, tracking, eventId: user.id });
  } catch (error: any) {
    console.error("REGISTRATION_ERROR", error);
    return new NextResponse("server", { status: 500 });
  }
}
