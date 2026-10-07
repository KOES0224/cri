import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { WEBINAR } from "@/lib/webinar";
import { formatKST } from "@/lib/formatKST";
import { csvDocument } from "@/lib/csv";

/** CSV of the current webinar's sign-ups (admin only). UTF-8 with BOM so Excel and Google Sheets read Korean. */
export async function GET() {
  try { await requireAdmin(); } catch { return new Response("Administrator access required.", { status: 403 }); }
  const rows = await prisma.webinarRegistration.findMany({ where: { webinarKey: WEBINAR.key }, orderBy: { createdAt: "asc" } });
  const body = csvDocument([
    ["Registered (KST)", "Name", "Role", "Phone", "Email", "KakaoTalk", "Question", "Language", "ID"],
    ...rows.map((r) => [formatKST(r.createdAt, "yyyy-MM-dd HH:mm"), r.name, r.role, r.phone, r.email, r.kakaoId, r.question, r.locale, r.id]),
  ]);
  return new Response(body, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="CRI-webinar-${WEBINAR.key}.csv"`, "Cache-Control": "private, no-store" },
  });
}
