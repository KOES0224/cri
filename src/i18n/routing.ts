/**
 * Locale-prefixed URLs for the public site: English lives at `/research`, Korean at `/ko/research`.
 * `src/proxy.ts` rewrites `/ko/*` onto the same routes and tells the app which locale to render, so search
 * engines get one crawlable URL per language. Portal pages (auth, apply, dashboard) stay unprefixed and
 * keep following the `lang` cookie.
 *
 * Keep this file free of dictionary and server-only imports: the proxy and client components use it.
 */
import type { Locale } from "./config";

export const KO_PREFIX = "/ko";
export const LOCALE_COOKIE = "lang";

/** Request headers the proxy sets for localized pages. */
export const LOCALE_HEADER = "x-cri-locale";
export const PATH_HEADER = "x-cri-path";

/** Top-level sections of the public site. Everything else (auth, apply, dashboard, api) is portal. */
const PUBLIC_SECTIONS = ["/research", "/projects", "/intern", "/success", "/blog", "/contact", "/admissions", "/privacy", "/refunds", "/partners"];

/** Pages whose main content exists in Korean; the rest render Korean chrome around English content. */
const KOREAN_CONTENT = [
  /^\/$/,
  /^\/research(\/(summer-camp|winter|1-on-1))?$/,
  /^\/research\/program\/[^/]+$/,
  /^\/(blog|success|contact|admissions|privacy|refunds)$/,
];

function splitPath(href: string): [path: string, rest: string] {
  const cut = href.search(/[?#]/);
  return cut === -1 ? [href, ""] : [href.slice(0, cut), href.slice(cut)];
}

/** True for pages that have a `/ko` URL. */
export function isLocalizablePath(path: string): boolean {
  return path === "/" || PUBLIC_SECTIONS.some((section) => path === section || path.startsWith(`${section}/`));
}

/** True when the page body is translated, so the `/ko` URL is a real Korean alternate rather than a duplicate. */
export function hasKoreanContent(path: string): boolean {
  return KOREAN_CONTENT.some((pattern) => pattern.test(path));
}

/** `/ko/research` → `{ locale: "ko", path: "/research" }`; unprefixed paths return `locale: null`. */
export function stripLocalePrefix(pathname: string): { locale: Locale | null; path: string } {
  if (pathname === KO_PREFIX) return { locale: "ko", path: "/" };
  if (pathname.startsWith(`${KO_PREFIX}/`)) return { locale: "ko", path: pathname.slice(KO_PREFIX.length) };
  return { locale: null, path: pathname };
}

/** Site-relative path for a public page in the given locale. */
export function localizedPath(path: string, locale: Locale): string {
  if (locale !== "ko" || !isLocalizablePath(path)) return path;
  return path === "/" ? KO_PREFIX : `${KO_PREFIX}${path}`;
}

/**
 * Rewrites an in-site href for the given locale, keeping its query and hash.
 * External links, anchors and portal links are returned unchanged.
 */
export function localizeHref(href: string, locale: Locale): string {
  if (locale !== "ko" || !href.startsWith("/") || href.startsWith("//")) return href;
  const [path, rest] = splitPath(href);
  if (stripLocalePrefix(path).locale) return href;
  return `${localizedPath(path, locale)}${rest}`;
}

/** The same page in the other language, used by the language switch. */
export function switchLocaleHref(href: string, next: Locale): string {
  const [pathname, rest] = splitPath(href);
  const { path } = stripLocalePrefix(pathname);
  return `${localizedPath(path, next)}${rest}`;
}

/**
 * Canonical URL and hreflang alternates for a public page. Pages without Korean content point both
 * URLs at the English canonical and declare no alternates, so the `/ko` copy is not indexed as a duplicate.
 */
export function localeAlternates(path: string, locale: Locale) {
  if (!hasKoreanContent(path)) return { canonical: path };
  const ko = localizedPath(path, "ko");
  return {
    canonical: locale === "ko" ? ko : path,
    languages: { en: path, ko, "x-default": path },
  };
}
