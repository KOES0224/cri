"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { allowRequest } from "@/lib/request-limit";
import { sendStudentAccountWelcome } from "@/lib/notify";

/**
 * Guardian ↔ student linking.
 * A student account carries `parentId` pointing at one parent or agency account. A guardian sees the
 * programs, assignments and feedback of every linked student. An application submitted by a guardian
 * is attached to the student account through `Application.studentId`, so the enrollment (and everything
 * that hangs off it) belongs to the student, not the guardian.
 */

type Tx = Prisma.TransactionClient;
const GUARDIAN = { id: true, name: true, email: true, isAgency: true, agencyName: true } as const;
const STUDENT = { id: true, name: true, email: true, role: true, studentCode: true, parentId: true } as const;

function ok<T extends object>(data: T) { return { success: true as const, ...data }; }
function fail(error: string) { return { success: false as const, error }; }
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;

async function currentGuardian() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "PARENT") return null;
  return session.user;
}

async function uniqueStudentCode(tx: Tx) {
  for (;;) {
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    if (!await tx.user.findUnique({ where: { studentCode: code }, select: { id: true } })) return code;
  }
}

/** Find a student by 8-digit code, email or id. */
async function findStudent(tx: Tx, identifier: string) {
  const value = identifier.trim();
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  const student = digits.length === 8 && digits === value.replace(/[\s-]/g, "")
    ? await tx.user.findUnique({ where: { studentCode: digits }, select: STUDENT })
    : validEmail(value.toLowerCase())
      ? await tx.user.findUnique({ where: { email: value.toLowerCase() }, select: STUDENT })
      : await tx.user.findUnique({ where: { id: value }, select: STUDENT });
  return student?.role === "STUDENT" ? student : null;
}

/** Attach a student account to an application; link the guardian; move any enrollment to the student. */
async function attachStudent(tx: Tx, applicationId: string, student: { id: string; parentId: string | null }, actorName: string) {
  const application = await tx.application.findUniqueOrThrow({ where: { id: applicationId }, include: { user: { select: { id: true, role: true, email: true } }, program: { select: { title: true } } } });
  await tx.application.update({ where: { id: applicationId }, data: { studentId: student.id } });
  if (application.user.role === "PARENT" && !student.parentId) {
    await tx.user.update({ where: { id: student.id }, data: { parentId: application.user.id } });
  }
  const guardianEnrollment = await tx.enrollment.findUnique({ where: { userId_programId: { userId: application.userId, programId: application.programId } } });
  const studentEnrollment = await tx.enrollment.findUnique({ where: { userId_programId: { userId: student.id, programId: application.programId } } });
  if (guardianEnrollment && !studentEnrollment && application.userId !== student.id) {
    await tx.enrollment.update({ where: { id: guardianEnrollment.id }, data: { userId: student.id } });
    await tx.assignmentSubmission.updateMany({ where: { enrollmentId: guardianEnrollment.id }, data: { userId: student.id } });
  }
  await tx.userActivity.create({ data: { userId: student.id, adminName: actorName, action: "ACCOUNT_LINKED", content: `Linked to application ${applicationId} (${application.program.title}) submitted by ${application.user.email}.` } });
  return application;
}

function revalidateLinking(...userIds: string[]) {
  revalidatePath("/dashboard", "layout");
  for (const id of userIds) revalidatePath(`/dashboard/users/${id}`);
}

// ---------- Guardian self-service ----------

export async function linkStudentByCode(codeInput: string) {
  const me = await currentGuardian();
  if (!me) return fail("Sign in with a parent or agency account.");
  const code = String(codeInput || "").replace(/\D/g, "");
  if (code.length !== 8) return fail("Enter the 8-digit student code shown on the student's profile page.");
  try {
    if (!await allowRequest("link-student", me.id, 10, 900)) return fail("Too many attempts. Please try again in 15 minutes.");
    const student = await prisma.user.findUnique({ where: { studentCode: code }, select: STUDENT });
    if (!student || student.role !== "STUDENT") return fail("No student account matches that code. Check the digits with your student.");
    if (student.parentId === me.id) return ok({ studentName: student.name || student.email, already: true });
    if (student.parentId) return fail("This student is already linked to another guardian account. Contact admissions to change it.");
    await prisma.$transaction([
      prisma.user.update({ where: { id: student.id }, data: { parentId: me.id } }),
      prisma.userActivity.create({ data: { userId: student.id, adminName: me.name || "Guardian", action: "ACCOUNT_LINKED", content: `Linked to guardian account ${me.email} using the student code.` } }),
    ]);
    revalidateLinking(student.id, me.id);
    return ok({ studentName: student.name || student.email, already: false });
  } catch { return fail("The link could not be saved. Please try again."); }
}

export async function unlinkStudent(studentId: string) {
  const me = await currentGuardian();
  if (!me) return fail("Sign in with a parent or agency account.");
  try {
    const result = await prisma.user.updateMany({ where: { id: studentId, parentId: me.id }, data: { parentId: null } });
    if (result.count !== 1) return fail("This student is not linked to your account.");
    await prisma.userActivity.create({ data: { userId: studentId, adminName: me.name || "Guardian", action: "ACCOUNT_UNLINKED", content: `Guardian account ${me.email} removed the link.` } });
    revalidateLinking(studentId, me.id);
    return ok({});
  } catch { return fail("The link could not be removed. Please try again."); }
}

// ---------- Administrators ----------

/** Set (or clear, with null) the guardian of a student account, by the guardian's email. */
export async function adminSetGuardian(studentId: string, guardianEmail: string | null) {
  const admin = await requireAdmin();
  try {
    const student = await prisma.user.findUnique({ where: { id: studentId }, select: STUDENT });
    if (!student || student.role !== "STUDENT") return fail("Choose a student account.");
    let guardian: { id: string; email: string } | null = null;
    if (guardianEmail) {
      const email = guardianEmail.trim().toLowerCase();
      if (!validEmail(email)) return fail("Enter the guardian's email address.");
      const found = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true, role: true } });
      if (!found || found.role !== "PARENT") return fail("No parent or agency account uses that email. Ask them to register first, or change their role under People.");
      guardian = found;
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: student.id }, data: { parentId: guardian?.id ?? null } }),
      prisma.userActivity.create({ data: { userId: student.id, adminName: "Administrator", action: guardian ? "ACCOUNT_LINKED" : "ACCOUNT_UNLINKED", content: guardian ? `Guardian set to ${guardian.email} by administrator ${admin.id}.` : `Guardian link removed by administrator ${admin.id}.` } }),
    ]);
    revalidateLinking(student.id, ...(guardian ? [guardian.id] : []), ...(student.parentId ? [student.parentId] : []));
    return ok({ guardianEmail: guardian?.email ?? null });
  } catch { return fail("Unable to update the guardian link."); }
}

/** Add a student (by code, email or id) to a guardian account. */
export async function adminAddChild(guardianId: string, studentIdentifier: string) {
  const admin = await requireAdmin();
  try {
    const guardian = await prisma.user.findUnique({ where: { id: guardianId }, select: GUARDIAN });
    const guardianRole = await prisma.user.findUnique({ where: { id: guardianId }, select: { role: true } });
    if (!guardian || guardianRole?.role !== "PARENT") return fail("Choose a parent or agency account.");
    const student = await prisma.$transaction(tx => findStudent(tx, studentIdentifier));
    if (!student) return fail("No student account matches that code or email.");
    if (student.parentId && student.parentId !== guardian.id) return fail("This student is linked to a different guardian. Remove that link first.");
    await prisma.$transaction([
      prisma.user.update({ where: { id: student.id }, data: { parentId: guardian.id } }),
      prisma.userActivity.create({ data: { userId: student.id, adminName: "Administrator", action: "ACCOUNT_LINKED", content: `Linked to guardian ${guardian.email} by administrator ${admin.id}.` } }),
    ]);
    revalidateLinking(student.id, guardian.id);
    return ok({ studentName: student.name || student.email, studentId: student.id });
  } catch { return fail("Unable to link the student."); }
}

/** Attach an existing student account (by code, email or id) to an application, or detach with null. */
export async function adminLinkApplicationStudent(applicationId: string, studentIdentifier: string | null) {
  const admin = await requireAdmin();
  try {
    if (studentIdentifier === null) {
      await prisma.application.update({ where: { id: applicationId }, data: { studentId: null } });
      revalidateLinking();
      return ok({ student: null });
    }
    const student = await prisma.$transaction(async tx => {
      const found = await findStudent(tx, studentIdentifier);
      if (!found) throw new Error("NOT_FOUND");
      await attachStudent(tx, applicationId, found, `Administrator ${admin.id}`);
      return found;
    });
    revalidateLinking(student.id);
    return ok({ student: { id: student.id, name: student.name, studentCode: student.studentCode } });
  } catch (error) {
    return fail(error instanceof Error && error.message === "NOT_FOUND" ? "No student account matches that code or email." : "Unable to link the application to a student account.");
  }
}

/**
 * Create a student account from the details in a guardian-submitted application (or link the existing
 * account that already uses the student's email), attach it to the application and to the guardian.
 * Returns a one-time temporary password for admissions to pass on when email is not configured.
 */
export async function adminCreateStudentFromApplication(applicationId: string) {
  const admin = await requireAdmin();
  try {
    const application = await prisma.application.findUnique({ where: { id: applicationId }, include: { user: { select: { id: true, name: true, role: true, email: true } }, program: { select: { title: true } } } });
    if (!application) return fail("Application not found.");
    if (application.studentId) return fail("This application is already linked to a student account.");
    let form: Record<string, unknown> = {};
    try { form = JSON.parse(application.content || "{}"); } catch {}
    const email = String(form.studentEmail || "").trim().toLowerCase();
    const name = `${String(form.studentFirstName || "").trim()} ${String(form.studentLastName || "").trim()}`.trim() || null;
    if (!validEmail(email)) return fail("The application has no valid student email. Link an existing student account instead.");

    const existing = await prisma.user.findUnique({ where: { email }, select: STUDENT });
    if (existing) {
      if (existing.role !== "STUDENT") return fail(`The student email ${email} belongs to a ${existing.role.toLowerCase()} account. Link a different student account or ask the family for the student's own email.`);
      await prisma.$transaction(tx => attachStudent(tx, applicationId, existing, `Administrator ${admin.id}`));
      const welcome = await sendStudentAccountWelcome({ to: email, studentName: existing.name || "", programTitle: application.program.title, guardianName: application.user.role === "PARENT" ? application.user.name : null, created: false });
      revalidateLinking(existing.id, application.user.id);
      return ok({ created: false, studentId: existing.id, studentName: existing.name || email, studentCode: existing.studentCode, tempPassword: null, emailed: welcome.sent });
    }

    const tempPassword = randomBytes(9).toString("base64url");
    const hashed = await bcrypt.hash(tempPassword, 12);
    const student = await prisma.$transaction(async tx => {
      const created = await tx.user.create({ data: { name, email, role: "STUDENT", password: hashed, studentCode: await uniqueStudentCode(tx), parentId: application.user.role === "PARENT" ? application.user.id : null }, select: STUDENT });
      await attachStudent(tx, applicationId, created, `Administrator ${admin.id}`);
      await tx.userActivity.create({ data: { userId: created.id, adminName: "Administrator", action: "ACCOUNT_CREATED", content: `Student account created from application ${applicationId} by administrator ${admin.id}.` } });
      return created;
    });
    const welcome = await sendStudentAccountWelcome({ to: email, studentName: name || "", programTitle: application.program.title, guardianName: application.user.role === "PARENT" ? application.user.name : null, created: true });
    revalidateLinking(student.id, application.user.id);
    return ok({ created: true, studentId: student.id, studentName: student.name || email, studentCode: student.studentCode, tempPassword, emailed: welcome.sent });
  } catch { return fail("Unable to create the student account."); }
}
