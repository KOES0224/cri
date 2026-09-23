/**
 * Server-side locale detection. Import from "@/i18n/config" or "@/i18n/client" in client components.
 */
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { LOCALE_HEADER, PATH_HEADER } from "./routing";

export { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, dictionaries, getDictionary, isLocale } from "./config";
export type { Locale, Dictionary } from "./config";

/**
 * Public pages take the locale from their URL (`/ko/...`, resolved by src/proxy.ts). Portal pages read the `lang`
 * cookie; without one, Accept-Language when it starts with `ko`. Defaults to English.
 */
export async function getLocale(): Promise<Locale> {
  const requestHeaders = await headers();
  const fromUrl = requestHeaders.get(LOCALE_HEADER);
  if (isLocale(fromUrl)) return fromUrl;
  const cookieValue = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieValue)) return cookieValue;
  const accept = requestHeaders.get("accept-language") ?? "";
  return accept.trim().toLowerCase().startsWith("ko") ? "ko" : DEFAULT_LOCALE;
}

/** Unprefixed path of the current public page (`/ko/blog` → `/blog`), or null outside the public site. */
export async function getPublicPath(): Promise<string | null> {
  return (await headers()).get(PATH_HEADER);
}
