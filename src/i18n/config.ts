/**
 * Locale configuration shared by server and client code.
 * Keep this file free of server-only imports (next/headers) so client components can use it.
 */
import { en } from "./en";
import { ko } from "./ko";

export const LOCALES = ["en", "ko"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "lang";

export type Dictionary = typeof en;

export const dictionaries: Record<Locale, Dictionary> = { en, ko };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}
