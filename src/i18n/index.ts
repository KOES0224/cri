/**
 * Server-side locale detection. Import from "@/i18n/config" or "@/i18n/client" in client components.
 */
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";

export { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, dictionaries, getDictionary, isLocale } from "./config";
export type { Locale, Dictionary } from "./config";

/** Reads the `lang` cookie; without one, uses Accept-Language when it starts with `ko`. Defaults to English. */
export async function getLocale(): Promise<Locale> {
  const cookieValue = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieValue)) return cookieValue;
  const accept = (await headers()).get("accept-language") ?? "";
  return accept.trim().toLowerCase().startsWith("ko") ? "ko" : DEFAULT_LOCALE;
}
