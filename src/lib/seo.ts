import type { Metadata } from "next";
import { getLocale, type Locale } from "@/i18n";
import { localeAlternates } from "@/i18n/routing";

/** Canonical public origin. Used for metadataBase, robots and the sitemap. */
export const SITE_URL = "https://criglobal.org";

/** Fallback social image: app/opengraph-image.png is served at this path. */
export const DEFAULT_OG_IMAGE = "/opengraph-image.png";

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
  /** Absolute or site-relative image URL; defaults to the site OG image. */
  image?: string | null;
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
 * be set here or the root `opengraph-image.png` would be dropped.
 */
export async function pageMetadata({ title, description, path, image, type = "website" }: PageMeta): Promise<Metadata> {
  const images = [image || DEFAULT_OG_IMAGE];
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
