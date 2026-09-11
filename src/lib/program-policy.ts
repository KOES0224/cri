/** Shared by inventory, public pages and server-side admissions checks. Dates are inclusive in Seoul time. */
export type ProgramLike = { category: string; status?: string; isPublished?: boolean; startDate?: Date | string | null; endDate?: Date | string | null; locationFormat?: string | null; capacity?: number | null; teachingHoursProf?: string | null; teachingHoursTA?: string | null };
export type ProgramKind = 'seoul' | 'global' | 'winter' | 'individual' | 'other';
export function programKind(category: string): ProgramKind {
  const value = category.trim().toLowerCase();
  if (value.includes('winter')) return 'winter';
  if (value === 'global' || value.includes('global research')) return 'global';
  if (value.includes('seoul') || value.includes('summer') || value === 'camp') return 'seoul';
  if (value.includes('1-on-1') || value === 'research' || value === 'mentorship') return 'individual';
  return 'other';
}
export function programFacts(program: ProgramLike) {
  const kind = programKind(program.category);
  const summer = kind === 'seoul' || kind === 'global';
  return {
    kind,
    name: kind === 'seoul' ? 'Seoul Research Program' : kind === 'global' ? 'Global Research Program' : kind === 'winter' ? 'Winter Online Research Program' : kind === 'individual' ? '1-on-1 Advanced Research Program' : program.category,
    format: summer ? 'In person (Onsite)' : kind === 'winter' ? 'Online (Remote)' : kind === 'individual' ? 'Online or in person · arranged individually' : program.locationFormat || 'Contact us for details',
    capacity: summer ? 10 : kind === 'winter' ? 5 : kind === 'individual' ? null : program.capacity,
    professorHours: summer ? '30 hours' : kind === 'winter' ? '10 hours' : kind === 'individual' ? 'Discuss your plan with admissions' : program.teachingHoursProf,
    taHours: summer ? '20 hours' : kind === 'winter' ? '30 hours' : kind === 'individual' ? 'Arranged for your research plan' : program.teachingHoursTA,
    audience: summer ? 'Rising Grade 9 through university students.' : kind === 'winter' ? 'Recommended for rising Grades 9–12. University students may also participate.' : 'For students ready for more advanced, independent research. Many participants are high school students; readiness and research interests matter more than age alone.',
    duration: kind === 'individual' ? 'Typically 2–4 months, scheduled around the student. Some projects finish within a month; others take longer.' : 'See the dates and teaching schedule for this cohort.',
  };
}
export function seoulDay(value: Date | string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
export function admissionState(program: ProgramLike, now: Date = new Date()) {
  const end = program.endDate && seoulDay(program.endDate);
  if (program.status === 'COMPLETED' || (end && end < seoulDay(now)!)) return 'ENDED' as const;
  if (program.isPublished === false || program.status !== 'OPEN') return 'CLOSED' as const;
  const kind = programKind(program.category);
  // Seasonal inventory without a valid end date must not accept indefinite payments.
  if (['seoul', 'global', 'winter'].includes(kind) && !end) return 'CLOSED' as const;
  return 'OPEN' as const;
}
export function admissionLabel(program: ProgramLike, now?: Date) {
  const state = admissionState(program, now);
  return state === 'OPEN' ? 'Accepting Applications' : state === 'ENDED' ? 'Program Completed' : 'Applications Closed';
}
export function programHref(category: string) {
  const kind = programKind(category);
  return kind === 'winter' ? '/research/winter' : kind === 'individual' ? '/research/1-on-1' : kind === 'seoul' || kind === 'global' ? '/research/summer-camp' : '/research';
}
export function programDate(value: Date | string) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}
/** Apply the same operational facts when administrators save inventory records. */
export function inventoryFacts(category: string) {
  const facts = programFacts({ category });
  if (facts.kind === 'other') return {};
  return { category: facts.name, locationFormat: facts.format, capacity: facts.capacity, teachingHoursProf: facts.professorHours, teachingHoursTA: facts.taHours };
}
