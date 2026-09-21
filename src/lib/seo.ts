import type { Metadata } from "next";

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
  /** Site-relative path, e.g. "/research". */
  path: string;
  /** Absolute or site-relative image URL; defaults to the site OG image. */
  image?: string | null;
};

/**
 * Per-page metadata with a canonical URL and an explicit OpenGraph image.
 * Next replaces the whole `openGraph` object per segment, so the image must
 * be set here or the root `opengraph-image.png` would be dropped.
 */
export function pageMetadata({ title, description, path, image }: PageMeta): Metadata {
  const images = [image || DEFAULT_OG_IMAGE];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "CRI",
      locale: "en_US",
      type: "website",
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
