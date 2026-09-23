import { NextResponse, type NextRequest } from "next/server";
import { missingPageRewrite } from "@/lib/missing-page";

export async function proxy(request: NextRequest) {
  return (await missingPageRewrite(request, request.nextUrl.pathname)) ?? NextResponse.next();
}

// Must stay a literal (Next reads it at build time); keep in sync with MISSING_PAGE_MATCHER.
export const config = {
  matcher: ["/blog/:slug", "/success/:slug", "/research/program/:id", "/intern/:id"],
};
