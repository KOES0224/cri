"use server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { allowRequest } from "@/lib/request-limit";
import { WEBINAR, koreanMobile, webinarDedupeKey, webinarJoinInfo, webinarKakaoNoticesOpen, webinarKakaoOpen, webinarRegistrationOpen, webinarReminderTimes } from "@/lib/webinar";
import { webinarPhoneLink, webinarPhoneToken, webinarPhoneTokenValid } from "@/lib/webinar-phone";
import { webinarRegistrationSchema, type WebinarRegistrationInput } from "@/lib/webinar-validation";
import { notifyWebinarRegistration, sendWebinarConfirmation, sendWebinarReminder } from "@/lib/notify";
import { applicantTypeFromRole, type MetaCustomData } from "@/lib/meta/config";
import { sendMetaEvent } from "@/lib/meta/capi";
import { getLocale } from "@/i18n";

export type WebinarResult =
  | {
    success: true; alreadyRegistered: boolean; eventId: string; tracking: MetaCustomData;
    /** KakaoTalk notices: "ask" = offer to add a Korean mobile (with phoneToken), "channel" = remind to add the channel. */
    kakaoNotices: "ask" | "channel" | null;
    phoneToken: string | null;
  }
  | { success: false; code: string; field?: string; live?: boolean };

/** Saves a sign-up (one per person per webinar), tells admissions, confirms by email when one was given. */
const SITE_URL = (process.env.NEXTAUTH_URL || "https://criglobal.org").replace(/\/$/, "");

export type WebinarPhoneResult = { success: true } | { success: false; code: "phone" | "mobile" | "closed" | "link" | "rate" | "failed" };

/**
 * Adds a phone number to one sign-up, from the success screen or the emailed link (a signed token stands in for an
 * account). Only for the current webinar; an existing number is replaced so a typo can be fixed.
 */
export async function addWebinarPhone(input: { id: string; token: string; phone: string }): Promise<WebinarPhoneResult> {
  const raw = String(input.phone || "").trim().slice(0, 40);
  if (raw.replace(/\D/g, "").length < 8) return { success: false, code: "phone" };
  // KakaoTalk friend groups take Korean mobiles only; after the list is exported a number no longer helps.
  const phone = koreanMobile(raw);
  if (!phone) return { success: false, code: "mobile" };
  if (!webinarKakaoNoticesOpen()) return { success: false, code: "closed" };
  if (!webinarPhoneTokenValid(String(input.id || ""), String(input.token || ""))) return { success: false, code: "link" };
  try {
    if (!(await allowRequest("webinar-phone", input.id, 10, 3600))) return { success: false, code: "rate" };
    const row = await prisma.webinarRegistration.findUnique({ where: { id: input.id }, select: { webinarKey: true } });
    if (!row || row.webinarKey !== WEBINAR.key) return { success: false, code: "link" };
    await prisma.webinarRegistration.update({ where: { id: input.id }, data: { phone } });
    return { success: true };
  } catch (error) {
    console.error("webinar phone update failed", error instanceof Error ? error.message : error);
    return { success: false, code: "failed" };
  }
}

/** After the evening-before email has gone, a new sign-up gets the join link straight away ("soon" after 09:30). */
async function sendLateReminder(to: string, locale: string, registrationId: string) {
  const now = Date.now();
  const times = webinarReminderTimes();
  if (now < times.dayBefore.getTime() - 20 * 60_000) return;
  const join = webinarJoinInfo();
  if (!join) return;
  await sendWebinarReminder({ kind: now >= times.soon.getTime() - 20 * 60_000 ? "soon" : "dayBefore", to, locale, join, registrationId, webinarKey: WEBINAR.key });
}

export async function registerForWebinar(input: WebinarRegistrationInput): Promise<WebinarResult> {
  // Closed: tell the page whether the seminar is on right now, so it shows the KakaoTalk route instead of "over".
  if (!webinarRegistrationOpen()) return { success: false, code: "closed", live: webinarKakaoOpen() };
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
    const noticesOpen = webinarKakaoNoticesOpen();
    const existing = await prisma.webinarRegistration.findUnique({ where: { webinarKey_dedupeKey: { webinarKey: WEBINAR.key, dedupeKey } }, select: { id: true, phone: true } });
    if (existing) {
      // Signing up again with a mobile number adds it to the first sign-up (that is how people answer "leave a number").
      // No phone token here: knowing someone's email must not let a stranger change their number later.
      let mobile = koreanMobile(existing.phone);
      if (!mobile && koreanMobile(data.phone)) {
        await prisma.webinarRegistration.update({ where: { id: existing.id }, data: { phone: data.phone } });
        mobile = koreanMobile(data.phone);
      }
      return { success: true, alreadyRegistered: true, eventId: existing.id, tracking: {}, kakaoNotices: noticesOpen && mobile ? "channel" : null, phoneToken: null };
    }
    const mobile = koreanMobile(data.phone);
    const registration = await prisma.webinarRegistration.create({ data: {
      webinarKey: WEBINAR.key, name: data.name, role: data.role, phone: data.phone || null, email: data.email ? data.email.toLowerCase() : null,
      kakaoId: data.kakaoId || null, question: data.question || null, locale, userId: session?.user?.id || null, dedupeKey,
    } });
    // Best effort: the registration is saved whatever happens to the emails or the ad event.
    await Promise.all([
      notifyWebinarRegistration({ ...data, id: registration.id, locale }),
      data.email ? sendWebinarConfirmation({ to: data.email, locale, kakaoNotices: noticesOpen ? (mobile ? "channel" : "ask") : null, phoneLink: noticesOpen && !mobile ? webinarPhoneLink(SITE_URL, registration.id) : null }) : Promise.resolve(),
      // Signed up after a reminder email went out: the join link goes now (same idempotency key as the cron).
      data.email ? sendLateReminder(data.email, locale, registration.id) : Promise.resolve(),
    ]).catch((error) => console.error("webinar notifications failed", error instanceof Error ? error.message : error));
    const [firstName, ...rest] = data.name.split(/\s+/);
    const { data: tracking } = await sendMetaEvent({
      name: "Lead", eventId: registration.id,
      person: { email: data.email || null, phone: data.phone || null, firstName, lastName: rest.join(" "), externalId: session?.user?.id },
      data: { content_name: `Webinar ${WEBINAR.key}`, content_category: "webinar", applicant_type: data.role === "OTHER" ? undefined : applicantTypeFromRole(data.role) },
    });
    return { success: true, alreadyRegistered: false, eventId: registration.id, tracking, kakaoNotices: noticesOpen ? (mobile ? "channel" : "ask") : null, phoneToken: noticesOpen && !mobile ? webinarPhoneToken(registration.id) : null };
  } catch (error) {
    // A race on the unique key means the person is registered; everything else is a real failure.
    if ((error as { code?: string }).code === "P2002") {
      const existing = await prisma.webinarRegistration.findUnique({ where: { webinarKey_dedupeKey: { webinarKey: WEBINAR.key, dedupeKey } }, select: { id: true } }).catch(() => null);
      if (existing) return { success: true, alreadyRegistered: true, eventId: existing.id, tracking: {}, kakaoNotices: null, phoneToken: null };
    }
    console.error("webinar registration failed", error instanceof Error ? error.message : error);
    return { success: false, code: "failed" };
  }
}
