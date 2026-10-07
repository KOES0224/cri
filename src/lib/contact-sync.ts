import { prisma } from "@/lib/prisma";
import { parseGradYear, phoneKey, reviewReasons, splitEmails } from "@/lib/contacts";

/**
 * Mirrors an enrolled portal application into the customer directory. Best effort and idempotent:
 * manual edits on an existing contact are kept, blanks are filled, and the program row is upserted
 * by application id.
 */
export async function syncContactFromApplication(applicationId: string) {
  const app = await prisma.application.findUnique({ where: { id: applicationId }, include: { program: { select: { id: true, title: true } }, user: { select: { id: true, email: true } }, student: { select: { id: true, email: true } } } });
  if (!app) return;
  let form: Record<string, unknown> = {};
  try { form = JSON.parse(app.content || "{}"); } catch {}
  const str = (k: string) => (typeof form[k] === "string" ? (form[k] as string).trim() : "");
  const email = splitEmails(str("studentEmail")).primary ?? (app.student?.email ?? app.user.email).toLowerCase();
  if (!email) return;
  const studentLevel = str("studentLevel") === "UNIVERSITY" ? "UNIVERSITY" : str("studentLevel") === "SCHOOL" ? "SCHOOL" : null;
  const gradYear = parseGradYear(str("gradYear"));
  const school = str("school") || null;
  const reasons = reviewReasons({ school, studentLevel, gradYear, levelConfident: !!studentLevel, email });
  const base = { gender: str("gender") || null, phone: str("studentPhone") || null, parentName: `${str("parentFirstName")} ${str("parentLastName")}`.trim() || null, parentEmail: splitEmails(str("parentEmail")).primary, parentPhone: str("parentPhone") || null, parentPhoneKey: phoneKey(str("parentPhone")), school, howLearned: str("howLearned") || null, userId: app.student?.id ?? app.user.id };
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
  const row = { cohortKey: `program:${app.program.id}`, cohortLabel: app.program.title, professor: app.finalRegisteredCourse || str("firstChoiceProfessor") || null, status: "ENROLLED", appliedAt: app.createdAt, areaOfInterest: str("areaOfInterest") || null, topic: str("initialTopicIdeas") || null, resumeUrl: str("resumeDriveUrl") || str("resumeUrl") || null, applicationId: app.id };
  await prisma.contactProgram.upsert({ where: { contactId_cohortKey: { contactId, cohortKey: row.cohortKey } }, create: { contactId, ...row }, update: { professor: row.professor ?? undefined, status: row.status, areaOfInterest: row.areaOfInterest ?? undefined, topic: row.topic ?? undefined, resumeUrl: row.resumeUrl ?? undefined, applicationId: row.applicationId } });
}
