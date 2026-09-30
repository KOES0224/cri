/**
 * Which Toss payment window a card payment opens. Cards issued outside Korea need Toss's multilingual window
 * (`useInternationalCardOnly`: Visa, Mastercard, JCB, UnionPay…); Korean cards use the standard window.
 * Client-safe and pure so it can be unit tested.
 */
export type CardOrigin = "international" | "domestic";

/** Applicants living in Korea usually pay with a Korean card; everyone else with a card issued abroad. */
export function defaultCardOrigin(residenceCountry?: string | null): CardOrigin {
  return (residenceCountry || "").trim().toUpperCase() === "KR" ? "domestic" : "international";
}

const CHINESE = new Set(["CN", "TW", "HK", "MO"]);

/** The `card` options for tossPayments.payment().requestPayment({ method: "CARD", card }). */
export function tossCardOptions(origin: CardOrigin, siteLocale: string, residenceCountry?: string | null): { useInternationalCardOnly?: true; language?: "KO" | "EN" | "JA" | "ZH" } {
  if (origin === "domestic") return {};
  const cc = (residenceCountry || "").trim().toUpperCase();
  const language = siteLocale === "ko" ? "KO" : CHINESE.has(cc) ? "ZH" : cc === "JP" ? "JA" : "EN";
  return { useInternationalCardOnly: true, language };
}
