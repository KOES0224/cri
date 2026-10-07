"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fullName, splitEmails, validEmail } from "@/lib/contacts";
import { contactWhere, parseContactFilters, type ContactFilters } from "@/lib/contact-query";

async function admin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN" || !session.user.id) throw new Error("Administrator access required.");
  return { id: session.user.id, name: session.user.name || session.user.email || "Admin" };
}

const editSchema = z.object({
  studentLevel: z.enum(["SCHOOL", "UNIVERSITY"]).nullable(),
  gradYear: z.number().int().min(2000).max(2045).nullable(),
  school: z.string().trim().max(200),
  pinnedNote: z.string().trim().max(2000),
  markReviewed: z.boolean(),
});

export async function updateContact(id: string, input: unknown) {
  const actor = await admin();
  const parsed = editSchema.safeParse(input);
  if (!parsed.success) return { error: "Check the level, year and note before saving." };
  const current = await prisma.contact.findUnique({ where: { id }, select: { studentLevel: true, gradYear: true } });
  if (!current) return { error: "This customer no longer exists." };
  const d = parsed.data;
  const levelChanged = d.studentLevel !== current.studentLevel || d.gradYear !== current.gradYear;
  await prisma.contact.update({ where: { id }, data: {
    studentLevel: d.studentLevel, gradYear: d.gradYear, school: d.school || null, pinnedNote: d.pinnedNote || null,
    ...(levelChanged ? { levelSource: "MANUAL" } : {}),
    ...(d.markReviewed || levelChanged ? { reviewNeeded: false, reviewReason: null, reviewedAt: new Date(), reviewedBy: actor.name } : {}),
  } });
  revalidatePath("/dashboard/contacts");
  return { ok: true };
}

export async function setOptOut(id: string, optOut: boolean) {
  await admin();
  await prisma.contact.update({ where: { id }, data: { emailOptOutAt: optOut ? new Date() : null } });
  revalidatePath("/dashboard/contacts");
  return { ok: true };
}

/** Confirms the given contacts as one family; reuses an existing household id when one of them already has one. */
export async function linkHousehold(ids: string[]) {
  await admin();
  const clean = [...new Set(ids.filter(v => typeof v === "string" && v.length < 64))];
  if (clean.length < 2) return { error: "Pick at least two people to link." };
  const rows = await prisma.contact.findMany({ where: { id: { in: clean } }, select: { id: true, householdId: true } });
  const householdId = rows.find(r => r.householdId)?.householdId ?? `hh_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  await prisma.contact.updateMany({ where: { id: { in: rows.map(r => r.id) } }, data: { householdId } });
  revalidatePath("/dashboard/contacts");
  return { ok: true };
}

export async function unlinkHousehold(id: string) {
  await admin();
  await prisma.contact.update({ where: { id }, data: { householdId: null } });
  revalidatePath("/dashboard/contacts");
  return { ok: true };
}

/* ---------- Resend audiences ---------- */

export type Recipient = { contactId: string; email: string; firstName: string; lastName: string };
const RECIPIENTS = ["STUDENT", "PARENT", "BOTH"] as const;

function resendClient() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

/** Creates an empty Resend audience for the filtered contacts and returns the de-duplicated recipients to push. */
export async function startAudienceSync(input: { filters: Record<string, string>; recipient: string; name: string }) {
  const actor = await admin();
  const resend = resendClient();
  if (!resend) return { error: "RESEND_API_KEY is not set on the server, so audiences cannot be created." };
  const recipient = (RECIPIENTS as readonly string[]).includes(input.recipient) ? input.recipient as (typeof RECIPIENTS)[number] : "STUDENT";
  const name = String(input.name || "").trim().slice(0, 120) || `CRI customers ${new Date().toISOString().slice(0, 10)}`;
  const filters: ContactFilters = parseContactFilters(input.filters || {});
  const where = await contactWhere(filters);
  const contacts = await prisma.contact.findMany({ where: { AND: [where, { emailOptOutAt: null, emailBouncedAt: null }] }, select: { id: true, email: true, firstName: true, lastName: true, parentEmail: true, parentName: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] });
  const seen = new Set<string>();
  const recipients: Recipient[] = [];
  for (const c of contacts) {
    if (recipient !== "PARENT" && validEmail(c.email) && !seen.has(c.email)) { seen.add(c.email); recipients.push({ contactId: c.id, email: c.email, firstName: c.firstName, lastName: c.lastName }); }
    if (recipient !== "STUDENT") {
      const parent = splitEmails(c.parentEmail).primary;
      if (parent && !seen.has(parent)) { seen.add(parent); recipients.push({ contactId: c.id, email: parent, firstName: c.parentName || `Parent of ${fullName(c.firstName, c.lastName)}`, lastName: "" }); }
    }
  }
  if (!recipients.length) return { error: "No mailable people match these filters (opted-out and bounced addresses are excluded)." };
  const created = await resend.audiences.create({ name });
  if (created.error || !created.data?.id) return { error: `Resend refused to create the audience: ${created.error?.message ?? "unknown error"}` };
  const log = await prisma.contactAudienceSync.create({ data: { name, recipient, filters, audienceId: created.data.id, total: recipients.length, createdBy: actor.name } });
  return { syncId: log.id, audienceId: created.data.id, recipients };
}

/** Adds a small batch of recipients to the audience; the browser loops over batches so no request runs long. */
export async function pushAudienceBatch(syncId: string, audienceId: string, batch: Recipient[]) {
  await admin();
  const resend = resendClient();
  if (!resend) return { error: "RESEND_API_KEY is not set." };
  let added = 0; const failed: string[] = [];
  for (const r of batch.slice(0, 10)) {
    if (!validEmail(r.email)) { failed.push(`${r.email}: invalid`); continue; }
    const res = await resend.contacts.create({ audienceId, email: r.email, firstName: r.firstName?.slice(0, 50) || undefined, lastName: r.lastName?.slice(0, 50) || undefined, unsubscribed: false });
    if (res.error && !/already exists/i.test(res.error.message)) failed.push(`${r.email}: ${res.error.message}`); else added++;
    await new Promise(resolve => setTimeout(resolve, 550)); // Resend allows ~2 requests per second
  }
  await prisma.contactAudienceSync.update({ where: { id: syncId }, data: { added: { increment: added }, failed: { increment: failed.length } } });
  return { added, failed };
}

export async function finishAudienceSync(syncId: string, status: "DONE" | "FAILED") {
  await admin();
  await prisma.contactAudienceSync.update({ where: { id: syncId }, data: { status } });
  revalidatePath("/dashboard/contacts");
  return { ok: true };
}
