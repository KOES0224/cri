import { prisma } from "@/lib/prisma";
import { parseGradYear, phoneKey, reviewReasons, splitEmails } from "@/lib/contacts";

export type ProgramStatus = "APPLIED" | "ENROLLED" | "CANCELLED";

/**
 * Keeps the customer directory and portal accounts in step.
 *
 * - linkContactToUser: on sign-up / sign-in, attach the account to the directory record with the same
 *   email (student) or the same parent email (guardian). Cheap, idempotent, safe to call every sign-in.
 * - syncContactFromApplication: mirrors an application into the directory. APPLIED when it is submitted,
 *   ENROLLED when admissions enrol it, CANCELLED when it is rejected before enrolment. Manual edits on an
 *   existing contact are kept and blanks are filled.
 */
export async function linkContactToUser(email: string | null | undefined, userId: string, role: string | null | undefined) {
  const e = (email ?? "").trim().toLowerCase();
  if (!e || !userId) return;
  if (role === "PARENT") await prisma.contact.updateMany({ where: { parentEmail: e, parentUserId: null }, data: { parentUserId: userId } });
  else await prisma.contact.updateMany({ where: { email: e, userId: null }, data: { userId } });
}

export async function linkContactToUserBestEffort(email: string | null | undefined, userId: string, role: string | null | undefined) {
  try { await linkContactToUser(email, userId, role); } catch (error) { console.error("[contacts] account link failed:", error instanceof Error ? error.message : error); }
}

export async function syncContactFromApplication(applicationId: string, status: ProgramStatus) {
  const app = await prisma.application.findUnique({ where: { id: applicationId }, include: { program: { select: { id: true, title: true } }, user: { select: { id: true, email: true, role: true } }, student: { select: { id: true, email: true } } } });
  if (!app) return;
  if (status === "CANCELLED") {
    await prisma.contactProgram.updateMany({ where: { applicationId, status: { not: "ENROLLED" } }, data: { status: "CANCELLED" } });
    return;
  }
  let form: Record<string, unknown> = {};
  try { form = JSON.parse(app.content || "{}"); } catch {}
  const str = (k: string) => (typeof form[k] === "string" ? (form[k] as string).trim() : "");
  const guardianApplied = app.user.role === "PARENT";
  const email = splitEmails(str("studentEmail")).primary ?? (app.student?.email ?? (guardianApplied ? "" : app.user.email)).toLowerCase();
  if (!email) return;
  const studentLevel = str("studentLevel") === "UNIVERSITY" ? "UNIVERSITY" : str("studentLevel") === "SCHOOL" ? "SCHOOL" : null;
  const gradYear = parseGradYear(str("gradYear"));
  const school = str("school") || null;
  const reasons = reviewReasons({ school, studentLevel, gradYear, levelConfident: !!studentLevel, email });
  const base = {
    gender: str("gender") || null, phone: str("studentPhone") || null,
    parentName: `${str("parentFirstName")} ${str("parentLastName")}`.trim() || null, parentEmail: splitEmails(str("parentEmail")).primary, parentPhone: str("parentPhone") || null, parentPhoneKey: phoneKey(str("parentPhone")),
    school, howLearned: str("howLearned") || null,
    userId: app.student?.id ?? (guardianApplied ? null : app.user.id), parentUserId: guardianApplied ? app.user.id : null,
  };
  const existing = await prisma.contact.findUnique({ where: { email } });
  let contactId: string;
  if (!existing) {
    const created = await prisma.contact.create({ data: { email, firstName: str("studentFirstName") || "Student", lastName: str("studentLastName") || "", ...base, studentLevel, gradYear, levelSource: "APPLICATION", channel: "Website", reviewNeeded: reasons.length > 0, reviewReason: reasons.join("; ") || null } });
    contactId = created.id;
  } else {
    const fill: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(base)) if (v && !(existing as Record<string, unknown>)[k]) fill[k] = v;
    if (existing.levelSource !== "MANUAL") { if (!existing.studentLevel && studentLevel) { fill.studentLevel = studentLevel; fill.levelSource = "APPLICATION"; } if (!existing.gradYear && gradYear) fill.gradYear = gradYear; }
    if (Object.keys(fill).length) await prisma.contact.update({ where: { id: existing.id }, data: fill });
    contactId = existing.id;
  }
  const row = { cohortKey: `program:${app.program.id}`, cohortLabel: app.program.title, professor: app.finalRegisteredCourse || str("firstChoiceProfessor") || null, agencyRaw: null as string | null, appliedAt: app.createdAt, areaOfInterest: str("areaOfInterest") || null, topic: str("initialTopicIdeas") || null, resumeUrl: str("resumeDriveUrl") || str("resumeUrl") || null, applicationId: app.id };
  const current = await prisma.contactProgram.findUnique({ where: { contactId_cohortKey: { contactId, cohortKey: row.cohortKey } }, select: { status: true } });
  // Never demote: an enrolled row stays enrolled even if the application is re-mirrored as APPLIED.
  const nextStatus = current?.status === "ENROLLED" ? "ENROLLED" : status;
  await prisma.contactProgram.upsert({ where: { contactId_cohortKey: { contactId, cohortKey: row.cohortKey } }, create: { contactId, ...row, status: nextStatus }, update: { professor: row.professor ?? undefined, status: nextStatus, areaOfInterest: row.areaOfInterest ?? undefined, topic: row.topic ?? undefined, resumeUrl: row.resumeUrl ?? undefined, applicationId: row.applicationId } });
}

/** Call sites must never fail a payment, enrollment or sign-in because the directory could not be updated. */
export async function syncContactFromApplicationBestEffort(applicationId: string, status: ProgramStatus) {
  try { await syncContactFromApplication(applicationId, status); } catch (error) { console.error("[contacts] application mirror failed:", error instanceof Error ? error.message : error); }
}
