import AdminLayout from "../_components/AdminLayout";
import ListPagination from "../_components/ListPagination";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { COHORTS, SEGMENTS, segmentOf } from "@/lib/contacts";
import { CONTACT_FLAGS, CONTACT_STATUSES, contactInclude, contactWhere, filtersToQuery, parseContactFilters, siblingCandidates } from "@/lib/contact-query";
import ContactsTable, { type ContactRow } from "./ContactsTable";
import AudienceSync from "./AudienceSync";

const PAGE_SIZE = 50;
const FLAG_LABELS: Record<(typeof CONTACT_FLAGS)[number], string> = { review: "Needs review", repeat: "Repeat customers", family: "Siblings / same family", optout: "Opted out of email", bounced: "Email bounced", unpaid: "Unpaid", account: "Has portal account", noaccount: "No portal account" };
const STATUS_LABELS: Record<(typeof CONTACT_STATUSES)[number], string> = { customers: "Customers (enrolled)", applicants: "Applicants (not yet enrolled)", all: "Everyone" };

export default async function ContactsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const params = await searchParams;
  const filters = parseContactFilters(params);
  const page = Math.max(1, Math.min(10000, Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1));
  const where = await contactWhere(filters);
  const [contacts, total, counts, professors, channels, cohortRows, recentSyncs] = await Promise.all([
    prisma.contact.findMany({ where, include: contactInclude, orderBy: [{ lastName: "asc" }, { firstName: "asc" }], take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }),
    prisma.contact.count({ where }),
    Promise.all([prisma.contact.count({ where: { programs: { some: { status: { in: ["ENROLLED", "UNPAID"] } } } } }), prisma.contact.count({ where: { reviewNeeded: true } }), prisma.contact.count({ where: { emailOptOutAt: { not: null } } }), prisma.contact.count({ where: { OR: [{ userId: { not: null } }, { parentUserId: { not: null } }] } })]),
    prisma.contactProgram.findMany({ where: { professor: { not: null } }, distinct: ["professor"], select: { professor: true }, orderBy: { professor: "asc" } }),
    prisma.contact.findMany({ where: { channel: { not: null } }, distinct: ["channel"], select: { channel: true }, orderBy: { channel: "asc" } }),
    prisma.contactProgram.findMany({ distinct: ["cohortKey"], select: { cohortKey: true, cohortLabel: true }, orderBy: { cohortKey: "desc" } }),
    prisma.contactAudienceSync.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
  ]);
  const siblings = await siblingCandidates(contacts);
  const now = new Date();
  const rows: ContactRow[] = contacts.map(c => ({
    id: c.id, name: `${c.firstName} ${c.lastName}`.trim(), gender: c.gender, email: c.email, phone: c.phone,
    parentName: c.parentName, parentEmail: c.parentEmail, parentPhone: c.parentPhone,
    school: c.school, studentLevel: c.studentLevel, gradYear: c.gradYear, levelSource: c.levelSource, segment: segmentOf(c.studentLevel, c.gradYear, now),
    reviewNeeded: c.reviewNeeded, reviewReason: c.reviewReason, reviewedBy: c.reviewedBy, reviewedAt: c.reviewedAt?.toISOString() ?? null,
    channel: c.channel, agencyRaw: c.agencyRaw, howLearned: c.howLearned, householdId: c.householdId, pinnedNote: c.pinnedNote,
    emailOptOutAt: c.emailOptOutAt?.toISOString() ?? null, emailBouncedAt: c.emailBouncedAt?.toISOString() ?? null, userId: c.userId, parentUserId: c.parentUserId,
    programs: c.programs.map(p => ({ id: p.id, cohortKey: p.cohortKey, cohortLabel: p.cohortLabel, professor: p.professor, status: p.status, agencyRaw: p.agencyRaw, appliedAt: p.appliedAt?.toISOString() ?? null, paymentNote: p.paymentNote, adminNote: p.adminNote, areaOfInterest: p.areaOfInterest, topic: p.topic, resumeUrl: p.resumeUrl })),
    siblings: siblings.get(c.id) ?? [],
  }));
  const cohorts = [...new Map([...Object.entries(COHORTS), ...cohortRows.map(r => [r.cohortKey, r.cohortLabel] as [string, string])]).entries()].sort((a, b) => b[0].localeCompare(a[0]));
  const query = filtersToQuery(filters);
  const [all, review, optedOut, withAccount] = counts;
  const select = "rounded-lg border border-slate-200 px-3 py-2 text-sm";
  return <AdminLayout>
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-3xl font-bold tracking-tight">Customers</h1><p className="mt-2 text-sm text-slate-500">Everyone who enrolled in a program, across cohorts. Segments are computed from academic level and graduation year, so filter here and send to a Resend audience to email them individually.</p></div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">{all} customers</span>
        <a href="/dashboard/contacts?flag=account" className="rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 hover:bg-blue-100">{withAccount} with portal account</a>
        <a href="/dashboard/contacts?flag=review" className="rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-800 hover:bg-amber-100">{review} need review</a>
        <a href="/dashboard/contacts?flag=optout" className="rounded-full bg-rose-50 px-3 py-1.5 font-semibold text-rose-700 hover:bg-rose-100">{optedOut} opted out</a>
      </div>
    </header>
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <form className="flex flex-wrap items-end gap-3 border-b border-slate-200 p-5" action="/dashboard/contacts">
        <div className="min-w-0 flex-1"><label htmlFor="c-q" className="mb-1.5 block text-xs font-semibold text-slate-600">Search</label><input id="c-q" name="q" defaultValue={filters.q} placeholder="Name, email, phone, school, parent or note" maxLength={100} className="w-full min-w-48 rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div>
        <div><label htmlFor="c-status" className="mb-1.5 block text-xs font-semibold text-slate-600">Show</label><select id="c-status" name="status" defaultValue={filters.status} className={select}>{CONTACT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select></div>
        <div><label htmlFor="c-segment" className="mb-1.5 block text-xs font-semibold text-slate-600">Segment</label><select id="c-segment" name="segment" defaultValue={filters.segment} className={select}><option value="">All segments</option>{SEGMENTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select></div>
        <div><label htmlFor="c-cohort" className="mb-1.5 block text-xs font-semibold text-slate-600">Program</label><select id="c-cohort" name="cohort" defaultValue={filters.cohort} className={select}><option value="">All programs</option>{cohorts.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
        <div><label htmlFor="c-prof" className="mb-1.5 block text-xs font-semibold text-slate-600">Professor</label><select id="c-prof" name="professor" defaultValue={filters.professor} className={`${select} max-w-56`}><option value="">All professors</option>{professors.map(p => <option key={p.professor!} value={p.professor!}>{p.professor}</option>)}</select></div>
        <div><label htmlFor="c-channel" className="mb-1.5 block text-xs font-semibold text-slate-600">Channel</label><select id="c-channel" name="channel" defaultValue={filters.channel} className={select}><option value="">All channels</option>{channels.map(c => <option key={c.channel!} value={c.channel!}>{c.channel}</option>)}</select></div>
        <div><label htmlFor="c-flag" className="mb-1.5 block text-xs font-semibold text-slate-600">Flag</label><select id="c-flag" name="flag" defaultValue={filters.flag} className={select}><option value="">Any</option>{CONTACT_FLAGS.map(f => <option key={f} value={f}>{FLAG_LABELS[f]}</option>)}</select></div>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Filter</button>
        {Object.keys(query).length > 0 && <a href="/dashboard/contacts" className="px-2 py-2 text-sm text-slate-500">Clear</a>}
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm">
        <p className="text-slate-600"><span className="font-semibold text-slate-900">{total}</span> match{filters.segment ? ` · ${SEGMENTS.find(s => s.key === filters.segment)?.label}` : ""}</p>
        <div className="flex flex-wrap items-center gap-2">
          <a href={`/dashboard/contacts/export?${new URLSearchParams(query)}`} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">Export CSV</a>
          <AudienceSync filters={query} total={total} defaultName={`CRI · ${filters.segment ? SEGMENTS.find(s => s.key === filters.segment)?.label : "all customers"} · ${now.toISOString().slice(0, 10)}`} recent={recentSyncs.map(s => ({ id: s.id, name: s.name, recipient: s.recipient, audienceId: s.audienceId, total: s.total, added: s.added, failed: s.failed, status: s.status, createdAt: s.createdAt.toISOString() }))} />
        </div>
      </div>
      <ContactsTable rows={rows} />
      <ListPagination page={page} pageSize={PAGE_SIZE} total={total} pathname="/dashboard/contacts" query={query} />
    </div>
    <p className="mt-4 text-xs text-slate-500">Accounts: when someone signs up or applies on the website with the same email, their record here is linked automatically, and new applications appear under “Applicants” until admissions enrol them. Segments: high school or university comes from the academic level, and “graduating this year” means the graduation year equals the current calendar year. Records marked “needs review” were imported with an unclear school name or without a year; open the row to set them once.</p>
  </AdminLayout>;
}
