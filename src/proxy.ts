import { NextResponse, type NextRequest } from "next/server";
// Only dictionary-free modules: the proxy runs on every public request.
import { LOCALE_COOKIE, LOCALE_HEADER, PATH_HEADER, isLocalizablePath, localizedPath, stripLocalePrefix } from "@/i18n/routing";
import { missingPageRewrite } from "@/lib/missing-page";

const ONE_YEAR = 60 * 60 * 24 * 365;
const KO_COOKIE = { path: "/", maxAge: ONE_YEAR, sameSite: "lax" } as const;

/**
 * Public pages have one URL per language: `/research` renders English and `/ko/research` is rewritten onto the
 * same route in Korean. Visitors who chose Korean (cookie) or whose browser asks for it are sent to the `/ko`
 * URL. Crawlers send neither, so each URL always returns the same language.
 * Unknown articles, stories and programs get a real 404 in either language (src/lib/missing-page.ts).
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { locale: prefixed, path } = stripLocalePrefix(pathname);
  const headers = new Headers(request.headers);
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;

  if (prefixed === "ko") {
    // Portal pages have no /ko URL; remember the choice and send them to the real path.
    if (!isLocalizablePath(path)) {
      const response = NextResponse.redirect(new URL(`${path}${search}`, request.url));
      response.cookies.set(LOCALE_COOKIE, "ko", KO_COOKIE);
      return response;
    }
    headers.set(LOCALE_HEADER, "ko");
    headers.set(PATH_HEADER, path);
    const response =
      (await missingPageRewrite(request, path, { request: { headers } })) ??
      NextResponse.rewrite(new URL(`${path}${search}`, request.url), { request: { headers } });
    // Portal pages reached from here (apply, sign-in) follow the cookie, so keep them in Korean too.
    if (cookie !== "ko") response.cookies.set(LOCALE_COOKIE, "ko", KO_COOKIE);
    return response;
  }

  const acceptsKorean = (request.headers.get("accept-language") ?? "").trim().toLowerCase().startsWith("ko");
  if (cookie === "ko" || (!cookie && acceptsKorean)) {
    return NextResponse.redirect(new URL(`${localizedPath(path, "ko")}${search}`, request.url));
  }

  headers.set(LOCALE_HEADER, "en");
  headers.set(PATH_HEADER, path);
  return (await missingPageRewrite(request, path, { request: { headers } })) ?? NextResponse.next({ request: { headers } });
}

export const config = {
  // Public pages only (must be literals; a superset of MISSING_PAGE_MATCHER). `/ko/:path*` also catches portal
  // paths so they can be redirected.
  matcher: [
    "/",
    "/ko",
    "/ko/:path*",
    "/research/:path*",
    "/projects/:path*",
    "/intern/:path*",
    "/success/:path*",
    "/blog/:path*",
    "/contact",
    "/admissions",
    "/privacy",
    "/refunds",
    "/partners",
  ],
};
