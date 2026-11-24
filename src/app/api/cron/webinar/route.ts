import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWebinarPhoneAsk, sendWebinarReminder } from "@/lib/notify";
import { WEBINAR, sameKstDay, webinarJoinInfo, webinarPhoneAskAt, webinarReminderTimes } from "@/lib/webinar";
import { webinarPhoneLink } from "@/lib/webinar-phone";

/**
 * Vercel Cron (vercel.json), production only; Vercel sends `Authorization: Bearer $CRON_SECRET`.
 * - job=phone-ask (daily 10:00 KST): once per person, emails sign-ups that left an email but no phone number, asking
 *   for one so they get the KakaoTalk notices (timing: webinarPhoneAskAt).
 * - job=reminders (19:00 and 09:30 KST): the join link by email the evening before and 30 minutes before the start.
 * Every email carries a Resend idempotency key, so a repeated run inside 24 hours sends nothing twice.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SITE_URL = (process.env.NEXTAUTH_URL || "https://criglobal.org").replace(/\/$/, "");
/** Resend allows about two requests a second. */
const pause = () => new Promise((resolve) => setTimeout(resolve, 550));

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const job = new URL(request.url).searchParams.get("job");
  const now = new Date();
  if (job === "phone-ask") return NextResponse.json(await phoneAsk(now));
  if (job === "reminders") return NextResponse.json(await reminders(now));
  return NextResponse.json({ error: "unknown job" }, { status: 400 });
}

async function phoneAsk(now: Date) {
  const rows = await prisma.webinarRegistration.findMany({
    where: { webinarKey: WEBINAR.key, email: { not: null }, OR: [{ phone: null }, { phone: "" }] },
    select: { id: true, email: true, locale: true, createdAt: true },
  });
  let sent = 0, failed = 0;
  for (const row of rows) {
    const at = webinarPhoneAskAt(row.createdAt);
    if (!at || !sameKstDay(at, now) || now.getTime() < at.getTime() - 3600_000) continue;
    const result = await sendWebinarPhoneAsk({ to: row.email!, locale: row.locale || "ko", phoneLink: webinarPhoneLink(SITE_URL, row.id), registrationId: row.id, webinarKey: WEBINAR.key });
    if (result.sent) sent++; else failed++;
    await pause();
  }
  console.log(`[cron webinar] phone-ask: ${sent} sent, ${failed} failed, ${rows.length} without a number`);
  return { job: "phone-ask", sent, failed, withoutNumber: rows.length };
}

async function reminders(now: Date) {
  const times = webinarReminderTimes();
  const near = (at: Date) => Math.abs(now.getTime() - at.getTime()) <= 20 * 60_000;
  const kind = near(times.dayBefore) ? "dayBefore" : near(times.soon) ? "soon" : null;
  if (!kind) return { job: "reminders", skipped: "not a reminder time" };
  const join = webinarJoinInfo();
  if (!join) { console.error("[cron webinar] WEBINAR_JOIN_URL is not set; no reminders sent"); return { job: "reminders", kind, error: "no join link" }; }
  const rows = await prisma.webinarRegistration.findMany({ where: { webinarKey: WEBINAR.key, email: { not: null } }, select: { id: true, email: true, locale: true }, orderBy: { createdAt: "asc" } });
  const seen = new Set<string>();
  let sent = 0, failed = 0;
  for (const row of rows) {
    const email = row.email!.trim().toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    const result = await sendWebinarReminder({ kind, to: email, locale: row.locale || "ko", join, registrationId: row.id, webinarKey: WEBINAR.key });
    if (result.sent) sent++; else failed++;
    await pause();
  }
  console.log(`[cron webinar] reminders ${kind}: ${sent} sent, ${failed} failed`);
  return { job: "reminders", kind, sent, failed };
}
