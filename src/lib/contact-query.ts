import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SEGMENT_KEYS, type SegmentKey } from "@/lib/contacts";

export const CONTACT_FLAGS = ["review", "repeat", "family", "optout", "bounced", "unpaid", "account", "noaccount"] as const;
export type ContactFlag = (typeof CONTACT_FLAGS)[number];
export const CONTACT_STATUSES = ["customers", "applicants", "all"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];
export type ContactFilters = { q: string; segment: SegmentKey | ""; cohort: string; professor: string; channel: string; flag: ContactFlag | ""; status: ContactStatus };

export function parseContactFilters(params: Record<string, string | string[] | undefined>): ContactFilters {
  const s = (k: string, max = 100) => { const v = params[k]; return (typeof v === "string" ? v : "").trim().slice(0, max); };
  const segment = s("segment");
  const flag = s("flag");
  const status = s("status");
  return {
    status: (CONTACT_STATUSES as readonly string[]).includes(status) ? (status as ContactStatus) : "customers",
    q: s("q"),
    segment: (SEGMENT_KEYS as string[]).includes(segment) ? (segment as SegmentKey) : "",
    cohort: s("cohort"), professor: s("professor"), channel: s("channel"),
    flag: (CONTACT_FLAGS as readonly string[]).includes(flag) ? (flag as ContactFlag) : "",
  };
}

export function filtersToQuery(f: ContactFilters): Record<string, string> {
  return Object.fromEntries(Object.entries(f).filter(([k, v]) => v && !(k === "status" && v === "customers"))) as Record<string, string>;
}

function segmentWhere(segment: SegmentKey | "", year: number): Prisma.ContactWhereInput {
  switch (segment) {
    case "HS_CURRENT": return { studentLevel: "SCHOOL", gradYear: { gt: year } };
    case "HS_GRADUATING": return { studentLevel: "SCHOOL", gradYear: year };
    case "HS_ALUMNI": return { studentLevel: "SCHOOL", gradYear: { lt: year } };
    case "UNI_CURRENT": return { studentLevel: "UNIVERSITY", gradYear: { gt: year } };
    case "UNI_GRADUATING": return { studentLevel: "UNIVERSITY", gradYear: year };
    case "UNI_ALUMNI": return { studentLevel: "UNIVERSITY", gradYear: { lt: year } };
    case "UNKNOWN": return { OR: [{ studentLevel: null }, { gradYear: null }] };
    default: return {};
  }
}

/** Builds the Prisma filter; "repeat" and "family" need a grouping pass first, hence async. */
export async function contactWhere(f: ContactFilters, now: Date = new Date()): Promise<Prisma.ContactWhereInput> {
  const and: Prisma.ContactWhereInput[] = [segmentWhere(f.segment, now.getFullYear())];
  // Customers have at least one enrolled (or registered-but-unpaid) program; applicants only applied so far.
  if (f.status === "customers") and.push({ programs: { some: { status: { in: ["ENROLLED", "UNPAID"] } } } });
  if (f.status === "applicants") and.push({ programs: { some: { status: "APPLIED" } }, NOT: { programs: { some: { status: { in: ["ENROLLED", "UNPAID"] } } } } });
  if (f.q) and.push({ OR: ["firstName", "lastName", "email", "phone", "school", "parentName", "parentEmail", "parentPhone", "pinnedNote"].map(field => ({ [field]: { contains: f.q, mode: "insensitive" } })) });
  if (f.cohort) and.push({ programs: { some: { cohortKey: f.cohort } } });
  if (f.professor) and.push({ programs: { some: { professor: { contains: f.professor, mode: "insensitive" } } } });
  if (f.channel) and.push({ channel: f.channel });
  if (f.flag === "review") and.push({ reviewNeeded: true });
  if (f.flag === "optout") and.push({ emailOptOutAt: { not: null } });
  if (f.flag === "bounced") and.push({ emailBouncedAt: { not: null } });
  if (f.flag === "unpaid") and.push({ programs: { some: { status: "UNPAID" } } });
  if (f.flag === "account") and.push({ OR: [{ userId: { not: null } }, { parentUserId: { not: null } }] });
  if (f.flag === "noaccount") and.push({ userId: null, parentUserId: null });
  if (f.flag === "repeat") {
    const groups = await prisma.contactProgram.groupBy({ by: ["contactId"], _count: { _all: true }, having: { contactId: { _count: { gt: 1 } } } });
    and.push({ id: { in: groups.map(g => g.contactId) } });
  }
  if (f.flag === "family") {
    const [emails, phones] = await Promise.all([
      prisma.contact.groupBy({ by: ["parentEmail"], where: { parentEmail: { not: null } }, _count: { _all: true }, having: { parentEmail: { _count: { gt: 1 } } } }),
      prisma.contact.groupBy({ by: ["parentPhoneKey"], where: { parentPhoneKey: { not: null } }, _count: { _all: true }, having: { parentPhoneKey: { _count: { gt: 1 } } } }),
    ]);
    and.push({ OR: [{ householdId: { not: null } }, { parentEmail: { in: emails.map(e => e.parentEmail!).filter(Boolean) } }, { parentPhoneKey: { in: phones.map(p => p.parentPhoneKey!).filter(Boolean) } }] });
  }
  return { AND: and };
}

export const contactInclude = { programs: { orderBy: { cohortKey: "desc" as const } } } satisfies Prisma.ContactInclude;
export type ContactWithPrograms = Prisma.ContactGetPayload<{ include: typeof contactInclude }>;

/** Other contacts that look like siblings of the given rows: same confirmed household, parent email or parent phone. */
export async function siblingCandidates(rows: { id: string; parentEmail: string | null; parentPhoneKey: string | null; householdId: string | null }[]) {
  const emails = [...new Set(rows.map(r => r.parentEmail).filter((v): v is string => !!v))];
  const phones = [...new Set(rows.map(r => r.parentPhoneKey).filter((v): v is string => !!v))];
  const households = [...new Set(rows.map(r => r.householdId).filter((v): v is string => !!v))];
  if (!emails.length && !phones.length && !households.length) return new Map<string, { id: string; name: string; confirmed: boolean }[]>();
  const matches = await prisma.contact.findMany({ where: { OR: [{ parentEmail: { in: emails } }, { parentPhoneKey: { in: phones } }, { householdId: { in: households } }] }, select: { id: true, firstName: true, lastName: true, parentEmail: true, parentPhoneKey: true, householdId: true } });
  const map = new Map<string, { id: string; name: string; confirmed: boolean }[]>();
  for (const r of rows) {
    const list = matches.filter(m => m.id !== r.id && ((r.householdId && m.householdId === r.householdId) || (r.parentEmail && m.parentEmail === r.parentEmail) || (r.parentPhoneKey && m.parentPhoneKey === r.parentPhoneKey)))
      .map(m => ({ id: m.id, name: `${m.firstName} ${m.lastName}`.trim(), confirmed: !!r.householdId && m.householdId === r.householdId }));
    if (list.length) map.set(r.id, list);
  }
  return map;
}
