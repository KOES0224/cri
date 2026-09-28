/**
 * Where the pages of the old cri.kr WordPress site (and the site builder before it) live on criglobal.org.
 * Used by next.config.ts once cri.kr is attached to the Vercel project, so press links, partner links and
 * search results for cri.kr land on the matching page and pass their ranking to criglobal.org.
 *
 * Sources are matched without the trailing slash WordPress used. Korean-language pages go to /ko URLs.
 * Anything not listed keeps its path (cri.kr/research → criglobal.org/research); unknown old paths 404 there.
 * Uploaded files (/wp-content/…) are not carried over and will 404.
 */
export const CRI_KR_PAGES: [source: string, destination: string][] = [
  // Current WordPress pages (cri.kr/page-sitemap.xml, September 2026)
  ["/home/about-us", "/"],
  ["/home/contact-page", "/contact"],
  ["/home/professors", "/research"],
  ["/home/programs/1-on-1-advanced-research-program", "/research/1-on-1"],
  ["/home/register", "/research"],
  ["/home/results", "/success"],
  ["/2026-seoul-research-program", "/research/summer-camp"],
  ["/2026-seoul-research-program-korean", "/ko/research/summer-camp"],
  ["/2026-서울-리서치-프로그램-ad", "/ko/research/summer-camp"],
  ["/2026-서울-리서치-프로그램-ad2", "/ko/research/summer-camp"],
  ["/2026-winter-online-research-program", "/research/winter"],
  ["/2026-winter-online-research-program-kr", "/ko/research/winter"],
  ["/winter-research-program-english", "/research/winter"],
  ["/winter-research-program-korean", "/ko/research/winter"],
  ["/2025-nus-english", "/research/summer-camp"],
  ["/customized-program", "/projects/personal"],
  ["/competition-publication", "/projects/competitions"],
  ["/ksef-isef", "/projects/competitions"],
  ["/update", "/"],
  ["/blog", "/blog"],
  ["/course_event", "/blog"],
  ["/course_event/:slug*", "/blog"],
  ["/megamenu/:slug*", "/"],
  ["/home/:slug*", "/"],
  ["/feed", "/blog"],
  ["/comments/feed", "/blog"],
  // Older URLs that still appear in search results (they already 404 on cri.kr)
  ["/2025-nus-research-program", "/research/summer-camp"],
  ["/seoulresearchprogram", "/ko/research/summer-camp"],
  ["/professors/:slug*", "/research"],
  ["/post/:slug*", "/ko/blog"],
];

/** Hosts that serve the old site today. */
export const CRI_KR_HOSTS = ["cri.kr", "www.cri.kr"];
