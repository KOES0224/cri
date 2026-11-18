import type { Metadata } from "next";
import { getLocale, type Locale } from "@/i18n";
import { localeAlternates } from "@/i18n/routing";

/** Canonical public origin. Used for metadataBase, robots and the sitemap. */
export { SITE_URL } from "./site";

/** Fallback social image: app/opengraph-image.jpg is served at this path (rebuilt by scripts/brand-images/build.py). */
export const DEFAULT_OG_IMAGE = "/opengraph-image.jpg";
export const DEFAULT_OG_ALT = "CRI — World-Class Research Mentorship. A CRI class with a professor and students.";

/**
 * The default card with its size spelled out: Facebook, Kakao and LinkedIn draw the first share without an image
 * when width/height are missing, because they have not downloaded it yet.
 */
const DEFAULT_OG = { url: DEFAULT_OG_IMAGE, width: 1200, height: 630, type: "image/jpeg", alt: DEFAULT_OG_ALT };

/** Section share cards in public/og (each on a different CRI class photo), built by scripts/brand-images/build.py. */
export const SECTION_CARDS = {
  research: "Research Programs",
  seoul: "Seoul Research Program",
  winter: "Winter Online Research Program",
  "one-on-one": "1-on-1 Research Mentorship",
  about: "About CRI",
  admissions: "Admissions",
  contact: "Contact Us",
  webinar: "Free Webinar",
  blog: "Research Ideas & Guides",
  success: "Student Success Stories",
} as const;
export type SectionCard = keyof typeof SECTION_CARDS;

function sectionImage(card: SectionCard) {
  return { url: `/og/${card}.jpg`, width: 1200, height: 630, type: "image/jpeg", alt: `CRI — ${SECTION_CARDS[card]}` };
}

/** Collapse whitespace and cut to ~`max` chars at a word boundary. */
export function summarize(text: string | null | undefined, max = 155): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const head = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${head.replace(/[\s,;:.-]+$/, "")}…`;
}

type PageMeta = {
  title: string;
  description: string;
  /** Unprefixed site-relative path, e.g. "/research" (also for the Korean page). */
  path: string;
  /** Section share card from public/og; ignored when `image` is given. */
  card?: SectionCard;
  /** Absolute or site-relative image URL (or one with its size); defaults to the section card, then the site card. */
  image?: string | { url: string; width: number; height: number; alt?: string } | null;
  type?: "website" | "article";
};

export const OG_LOCALE: Record<Locale, string> = { en: "en_US", ko: "ko_KR" };

/** Canonical URL, hreflang alternates and OpenGraph URL/locale for a public page in the given locale. */
export function localeMetadata(path: string, locale: Locale): Pick<Metadata, "alternates"> & { openGraph: { url: string; locale: string; alternateLocale?: string } } {
  const alternates = localeAlternates(path, locale);
  const translated = "languages" in alternates;
  return {
    alternates,
    openGraph: {
      url: alternates.canonical,
      locale: OG_LOCALE[translated ? locale : "en"],
      ...(translated ? { alternateLocale: OG_LOCALE[locale === "ko" ? "en" : "ko"] } : {}),
    },
  };
}

/**
 * Per-page metadata with a canonical URL, hreflang alternates and an explicit OpenGraph image.
 * Next replaces the whole `openGraph` object per segment, so the image must
 * be set here or the root `opengraph-image.jpg` would be dropped.
 */
export async function pageMetadata({ title, description, path, image, card, type = "website" }: PageMeta): Promise<Metadata> {
  const images = [typeof image === "string" ? { url: image } : image || (card ? sectionImage(card) : DEFAULT_OG)];
  const { alternates, openGraph } = localeMetadata(path, await getLocale());
  return {
    title,
    description,
    alternates,
    openGraph: {
      ...openGraph,
      title,
      description,
      siteName: "CRI",
      type,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}
