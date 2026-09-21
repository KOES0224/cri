import { NextResponse } from "next/server";
import { LOCALE_COOKIE, isLocale } from "@/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

/** POST { locale: "en" | "ko" } sets the `lang` cookie used by getLocale(). */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const locale = (body as { locale?: unknown } | null)?.locale;
  if (!isLocale(locale)) {
    return NextResponse.json({ error: "Unsupported locale." }, { status: 400 });
  }
  const response = NextResponse.json({ locale });
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
