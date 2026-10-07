import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySvixSignature } from "@/lib/svix";

/**
 * Resend webhook (dashboard → Webhooks → https://criglobal.org/api/webhooks/resend) with RESEND_WEBHOOK_SECRET set in Vercel.
 * Subscribe to contact.updated, email.bounced and email.complained. Unsubscribes and bounces are written back to the
 * customer directory so the next audience sync skips those people.
 */
export const dynamic = "force-dynamic";

type Event = { type?: string; data?: { email?: string; unsubscribed?: boolean; to?: string[] | string; bounce?: { type?: string } } };

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  const raw = await request.text();
  const ok = verifySvixSignature(secret, { id: request.headers.get("svix-id"), timestamp: request.headers.get("svix-timestamp"), signature: request.headers.get("svix-signature") }, raw);
  if (!ok) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  let event: Event;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const emails = (event.data?.to ? (Array.isArray(event.data.to) ? event.data.to : [event.data.to]) : [event.data?.email]).filter((e): e is string => typeof e === "string" && e.includes("@")).map(e => e.toLowerCase());
  if (!emails.length) return NextResponse.json({ ok: true, ignored: true });
  const now = new Date();
  if ((event.type === "contact.updated" || event.type === "contact.created") && event.data?.unsubscribed === true) {
    await prisma.contact.updateMany({ where: { OR: [{ email: { in: emails } }, { parentEmail: { in: emails } }], emailOptOutAt: null }, data: { emailOptOutAt: now } });
  } else if (event.type === "email.complained") {
    await prisma.contact.updateMany({ where: { OR: [{ email: { in: emails } }, { parentEmail: { in: emails } }], emailOptOutAt: null }, data: { emailOptOutAt: now } });
  } else if (event.type === "email.bounced" && event.data?.bounce?.type !== "Transient") {
    await prisma.contact.updateMany({ where: { email: { in: emails }, emailBouncedAt: null }, data: { emailBouncedAt: now } });
    const parents = await prisma.contact.findMany({ where: { parentEmail: { in: emails } }, select: { id: true, pinnedNote: true } });
    for (const p of parents) if (!p.pinnedNote?.includes("Parent email bounced")) await prisma.contact.update({ where: { id: p.id }, data: { pinnedNote: [p.pinnedNote, `Parent email bounced (${now.toISOString().slice(0, 10)})`].filter(Boolean).join("\n") } });
  }
  return NextResponse.json({ ok: true });
}
