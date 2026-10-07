"use server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { allowRequest } from "@/lib/request-limit";
import { WEBINAR, webinarDedupeKey, webinarRegistrationOpen } from "@/lib/webinar";
import { webinarRegistrationSchema, type WebinarRegistrationInput } from "@/lib/webinar-validation";
import { notifyWebinarRegistration, sendWebinarConfirmation } from "@/lib/notify";
import { applicantTypeFromRole, type MetaCustomData } from "@/lib/meta/config";
import { sendMetaEvent } from "@/lib/meta/capi";
import { getLocale } from "@/i18n";

export type WebinarResult =
  | { success: true; alreadyRegistered: boolean; eventId: string; tracking: MetaCustomData }
  | { success: false; code: string; field?: string };

/** Saves a sign-up (one per person per webinar), tells admissions, confirms by email when one was given. */
export async function registerForWebinar(input: WebinarRegistrationInput): Promise<WebinarResult> {
  if (!webinarRegistrationOpen()) return { success: false, code: "closed" };
  const parsed = webinarRegistrationSchema.safeParse(input);
  if (!parsed.success) { const issue = parsed.error.issues[0]; return { success: false, code: issue?.message || "failed", field: String(issue?.path[0] ?? "form") }; }
  const data = parsed.data;
  const dedupeKey = webinarDedupeKey(data);
  if (!dedupeKey) return { success: false, code: "contact", field: "contact" };
  try {
    // Per person (plus-tags collapsed so one mailbox cannot mint fresh buckets) and per webinar overall, which also
    // bounds the outbound confirmation emails.
    const limiterKey = dedupeKey.replace(/^email:([^+@]+)\+[^@]*@/, "email:$1@");
    if (!(await allowRequest("webinar", limiterKey, 5, 600)) || !(await allowRequest("webinar-all", WEBINAR.key, 300, 3600))) return { success: false, code: "rate" };
    const [session, locale] = await Promise.all([getServerSession(authOptions), getLocale()]);
    const existing = await prisma.webinarRegistration.findUnique({ where: { webinarKey_dedupeKey: { webinarKey: WEBINAR.key, dedupeKey } }, select: { id: true } });
    if (existing) return { success: true, alreadyRegistered: true, eventId: existing.id, tracking: {} };
    const registration = await prisma.webinarRegistration.create({ data: {
      webinarKey: WEBINAR.key, name: data.name, role: data.role, phone: data.phone || null, email: data.email ? data.email.toLowerCase() : null,
      kakaoId: data.kakaoId || null, question: data.question || null, locale, userId: session?.user?.id || null, dedupeKey,
    } });
    // Best effort: the registration is saved whatever happens to the emails or the ad event.
    await Promise.all([
      notifyWebinarRegistration({ ...data, id: registration.id, locale }),
      data.email ? sendWebinarConfirmation({ to: data.email, locale }) : Promise.resolve(),
    ]).catch((error) => console.error("webinar notifications failed", error instanceof Error ? error.message : error));
    const [firstName, ...rest] = data.name.split(/\s+/);
    const { data: tracking } = await sendMetaEvent({
      name: "Lead", eventId: registration.id,
      person: { email: data.email || null, phone: data.phone || null, firstName, lastName: rest.join(" "), externalId: session?.user?.id },
      data: { content_name: `Webinar ${WEBINAR.key}`, content_category: "webinar", applicant_type: data.role === "OTHER" ? undefined : applicantTypeFromRole(data.role) },
    });
    return { success: true, alreadyRegistered: false, eventId: registration.id, tracking };
  } catch (error) {
    // A race on the unique key means the person is registered; everything else is a real failure.
    if ((error as { code?: string }).code === "P2002") {
      const existing = await prisma.webinarRegistration.findUnique({ where: { webinarKey_dedupeKey: { webinarKey: WEBINAR.key, dedupeKey } }, select: { id: true } }).catch(() => null);
      if (existing) return { success: true, alreadyRegistered: true, eventId: existing.id, tracking: {} };
    }
    console.error("webinar registration failed", error instanceof Error ? error.message : error);
    return { success: false, code: "failed" };
  }
}
