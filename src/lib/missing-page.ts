import { NextResponse, type NextRequest } from "next/server";

/**
 * Real 404 status for unknown articles, stories and programs. Called from src/proxy.ts.
 *
 * Every page streams under the root loading.tsx, so a notFound() inside a page can only produce
 * HTTP 200 with a noindex tag. For full page loads we check the record first (via a cached route
 * handler, since proxy code must not share modules with the app) and rewrite unknown URLs to a path
 * no route matches, which Next answers with the site's not-found page and a 404.
 *
 * `pathname` is the app path without any locale prefix (e.g. "/blog/some-slug"). `init` carries the
 * locale request headers from the proxy so the 404 page renders in the visitor's language. Returns the
 * rewrite for a missing record, or null when the request should continue normally.
 */
const ROUTES: [RegExp, string][] = [
  [/^\/blog\/([^/]+)$/, "blog"],
  [/^\/success\/([^/]+)$/, "success"],
  [/^\/research\/program\/([^/]+)$/, "program"],
  [/^\/intern\/([^/]+)$/, "intern"],
];

export async function missingPageRewrite(
  request: NextRequest,
  pathname: string,
  init?: Parameters<typeof NextResponse.rewrite>[1],
): Promise<NextResponse | null> {
  // Client-side navigations and prefetches (RSC requests) never show a status code; skip the lookup.
  if (request.headers.get("rsc") || request.nextUrl.searchParams.has("_rsc")) return null;
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  for (const [pattern, kind] of ROUTES) {
    const match = pathname.match(pattern);
    if (!match) continue;
    try {
      const check = new URL("/api/public/exists", request.url);
      check.searchParams.set("kind", kind);
      check.searchParams.set("id", decodeURIComponent(match[1]));
      const res = await fetch(check, { signal: AbortSignal.timeout(2000) });
      if (res.status === 404) return NextResponse.rewrite(new URL("/_not-found-content", request.url), init);
    } catch {
      // If the check itself fails, render the page as usual rather than risk hiding a real one.
    }
    return null;
  }
  return null;
}

/** Paths missingPageRewrite handles; include them in the proxy matcher. */
export const MISSING_PAGE_MATCHER = ["/blog/:slug", "/success/:slug", "/research/program/:id", "/intern/:id"];
