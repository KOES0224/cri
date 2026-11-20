/**
 * Readable addresses for program pages: /research/program/upenn-international-law instead of the database id.
 *
 * A program answers on its slug. Its id and any slug it used to have keep working and redirect to the current
 * address (src/lib/missing-page.ts), so links already shared in ads, messages and search results never break.
 * A program without a slug (null) is served on its id, as before.
 *
 * Pure helpers only: client components, the admin actions, scripts and tests all import this file.
 */

/** Longest slug suggested from a title; one typed by an admin may be up to MAX_SLUG_LENGTH. */
const SUGGESTED_LENGTH = 60;
export const MAX_SLUG_LENGTH = 80;
const MIN_SLUG_LENGTH = 3;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Prisma's default ids ("c" + 24 letters and digits). A slug of that shape would be mistaken for one. */
const ID_PATTERN = /^c[a-z0-9]{24}$/;

/** Lowercase words joined by single hyphens. Returns "" when nothing usable is left (e.g. a title in Hangul only). */
export function normalizeSlug(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** True for a slug this site accepts as typed (already normalized, sensible length, not shaped like an id). */
export function isValidSlug(slug: string): boolean {
  return slug.length >= MIN_SLUG_LENGTH && slug.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(slug) && !ID_PATTERN.test(slug);
}

function cutAtWord(slug: string, max: number): string {
  if (slug.length <= max) return slug;
  const cut = slug.slice(0, max);
  const lastHyphen = cut.lastIndexOf("-");
  return (lastHyphen >= MIN_SLUG_LENGTH ? cut.slice(0, lastHyphen) : cut).replace(/-+$/, "");
}

/**
 * Slug suggested for a program title: the main title (the part before a colon or dash), without a leading article,
 * cut at a word boundary. "The Architecture of Choice: Behavioral Economics…" → "architecture-of-choice".
 * Returns "" when the title has no usable Latin letters or digits; the program then keeps its id address.
 */
export function slugFromTitle(title: string): string {
  const main = title.split(/\s*[:|–—]\s*/)[0];
  const candidates = [normalizeSlug(main).replace(/^(?:the|a|an)-(?=.{3})/, ""), normalizeSlug(title)];
  for (const candidate of candidates) {
    const slug = cutAtWord(candidate, SUGGESTED_LENGTH);
    if (isValidSlug(slug)) return slug;
  }
  return "";
}

/** `base`, or `base-2`, `base-3`… for the first one `isTaken` does not claim. */
export function firstFreeSlug(base: string, isTaken: (slug: string) => boolean): string {
  if (!isTaken(base)) return base;
  for (let n = 2; ; n++) {
    const suffix = `-${n}`;
    const candidate = `${cutAtWord(base, MAX_SLUG_LENGTH - suffix.length)}${suffix}`;
    if (!isTaken(candidate)) return candidate;
  }
}

type Addressable = { id: string; slug?: string | null };

/** Last part of a program's address: its slug when it has one, otherwise its id. */
export function programRef(program: Addressable): string {
  return program.slug || program.id;
}

/** Site-relative address of a program's public page (unprefixed; `Link` adds /ko). */
export function programPath(program: Addressable & { category: string }): string {
  return program.category === "Internship" ? `/intern/${programRef(program)}` : `/research/program/${programRef(program)}`;
}
