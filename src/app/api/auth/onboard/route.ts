import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeEventId, sendMetaEvent } from "@/lib/meta/capi";

// Error responses are plain-text stable codes (unauthorized | role | server) mapped to `auth.onboarding.errors` in src/i18n.
function generateStudentCode() {
  return Math.floor(10000000 + Math.random() * 90000000).toString(); // 8 digit random string
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { role, eventId } = body;

    if (role !== "STUDENT" && role !== "PARENT") {
      return new NextResponse("role", { status: 400 });
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

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        role,
        studentCode,
      },
    });

    // Google sign-ups complete registration here; the browser fires the same event id.
    const [firstName, ...rest] = (user.name || "").split(/\s+/);
    const { data: tracking } = await sendMetaEvent({ name: "CompleteRegistration", eventId: safeEventId(eventId), person: { email: user.email, firstName, lastName: rest.join(" "), externalId: user.id }, data: { content_name: role.toLowerCase(), status: true } });
    return NextResponse.json({ success: true, role, studentCode, tracking });
  } catch (error: any) {
    console.error("ONBOARDING_ERROR", error);
    return new NextResponse("server", { status: 500 });
  }
}
