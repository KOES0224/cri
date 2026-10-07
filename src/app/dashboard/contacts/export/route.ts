import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { segmentLabel, segmentOf, toCsv } from "@/lib/contacts";
import { contactInclude, contactWhere, parseContactFilters } from "@/lib/contact-query";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try { await requireAdmin(); } catch { return new NextResponse("Administrator access required.", { status: 403 }); }
  const url = new URL(request.url);
  const filters = parseContactFilters(Object.fromEntries(url.searchParams.entries()));
  const where = await contactWhere(filters);
  const contacts = await prisma.contact.findMany({ where, include: contactInclude, orderBy: [{ lastName: "asc" }, { firstName: "asc" }], take: 5000 });
  const now = new Date();
  const header = ["Name", "Student email", "Student phone", "Gender", "School", "Level", "Graduation year", "Segment", "Parent name", "Parent email", "Parent phone", "Channel", "Agency (raw)", "How they heard", "Programs", "Professors", "Repeat customer", "Household", "Needs review", "Review reason", "Opted out", "Bounced", "Pinned note"];
  const rows = contacts.map(c => [
    `${c.firstName} ${c.lastName}`.trim(), c.email, c.phone, c.gender, c.school, c.studentLevel, c.gradYear, segmentLabel(segmentOf(c.studentLevel, c.gradYear, now)),
    c.parentName, c.parentEmail, c.parentPhone, c.channel, c.agencyRaw, c.howLearned,
    c.programs.map(p => `${p.cohortLabel}${p.status !== "ENROLLED" ? ` (${p.status})` : ""}`).join(" | "), c.programs.map(p => p.professor ?? "").filter(Boolean).join(" | "),
    c.programs.length > 1 ? "yes" : "", c.householdId ?? "", c.reviewNeeded ? "yes" : "", c.reviewReason, c.emailOptOutAt ? c.emailOptOutAt.toISOString().slice(0, 10) : "", c.emailBouncedAt ? c.emailBouncedAt.toISOString().slice(0, 10) : "", c.pinnedNote,
  ]);
  const body = toCsv([header, ...rows]);
  return new NextResponse(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="cri-customers-${now.toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
}
