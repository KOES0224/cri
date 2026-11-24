import { requireAdmin } from "@/lib/admin";
import { formatKST } from "@/lib/formatKST";
import { csvDocument } from "@/lib/csv";
import { pickWebinarKey, webinarRowsWithHistory } from "@/lib/webinar-admin";

/** CSV of one webinar's sign-ups (current by default, ?key= for an earlier one). UTF-8 with BOM for Excel and Sheets. */
export async function GET(request: Request) {
  try { await requireAdmin(); } catch { return new Response("Administrator access required.", { status: 403 }); }
  const key = pickWebinarKey(new URL(request.url).searchParams.get("key"));
  const rows = (await webinarRowsWithHistory(key)).reverse();
  const body = csvDocument([
    ["Registered (KST)", "Name", "Role", "Phone", "Email", "KakaoTalk", "Source", "Other sessions", "Question", "Language", "ID"],
    ...rows.map((r) => [formatKST(r.createdAt, "yyyy-MM-dd HH:mm"), r.name, r.role, r.phone, r.email, r.kakaoId, r.viaKakao ? "KakaoTalk channel" : "website", r.otherSignups.join(" / "), r.question, r.locale, r.id]),
  ]);
  return new Response(body, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="CRI-webinar-${key}.csv"`, "Cache-Control": "private, no-store" },
  });
}
