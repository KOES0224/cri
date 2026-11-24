import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { koreanMobile } from "@/lib/webinar";
import { pickWebinarKey } from "@/lib/webinar-admin";

/**
 * Korean mobile numbers of one session's sign-ups, one per line, no header: the list to upload (or paste) as a
 * KakaoTalk channel friend group so the scheduled channel messages reach only people who signed up.
 */
export async function GET(request: Request) {
  try { await requireAdmin(); } catch { return new Response("Administrator access required.", { status: 403 }); }
  const key = pickWebinarKey(new URL(request.url).searchParams.get("key"));
  const rows = await prisma.webinarRegistration.findMany({ where: { webinarKey: key, phone: { not: null } }, select: { phone: true } });
  const numbers = [...new Set(rows.map((r) => koreanMobile(r.phone)).filter((n): n is string => Boolean(n)))];
  return new Response(numbers.join("\n") + (numbers.length ? "\n" : ""), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="CRI-webinar-${key}-kakao-phones.csv"`, "Cache-Control": "private, no-store" },
  });
}
