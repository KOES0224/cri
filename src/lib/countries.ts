/**
 * Countries offered in the residence-country selects (application and contact forms).
 * Codes are ISO-3166 alpha-2; the browser shows the visitor's language through Intl.DisplayNames, English is the fallback.
 * Order: CRI's main markets first, then the rest alphabetically.
 */
export const COUNTRY_CODES = [
  "KR", "US", "CA", "VN", "TH", "ID", "MY", "PH", "SG", "CN", "HK", "TW", "JP", "IN",
  "AU", "AE", "AR", "AT", "BD", "BE", "BR", "CH", "CL", "CZ", "DE", "DK", "EG", "ES", "FI", "FR", "GB", "GR", "HU", "IE", "IL", "IT",
  "KH", "KZ", "KW", "LK", "MN", "MX", "NL", "NO", "NP", "NZ", "PK", "PL", "PT", "QA", "RO", "RU", "SA", "SE", "TR", "UA", "UZ", "ZA",
] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];

export const COUNTRY_NAMES_EN: Record<CountryCode, string> = {
  KR: "South Korea", US: "United States", CA: "Canada", VN: "Vietnam", TH: "Thailand", ID: "Indonesia", MY: "Malaysia", PH: "Philippines", SG: "Singapore",
  CN: "China", HK: "Hong Kong", TW: "Taiwan", JP: "Japan", IN: "India", AU: "Australia", AE: "United Arab Emirates", AR: "Argentina", AT: "Austria",
  BD: "Bangladesh", BE: "Belgium", BR: "Brazil", CH: "Switzerland", CL: "Chile", CZ: "Czechia", DE: "Germany", DK: "Denmark", EG: "Egypt", ES: "Spain",
  FI: "Finland", FR: "France", GB: "United Kingdom", GR: "Greece", HU: "Hungary", IE: "Ireland", IL: "Israel", IT: "Italy", KH: "Cambodia", KZ: "Kazakhstan",
  KW: "Kuwait", LK: "Sri Lanka", MN: "Mongolia", MX: "Mexico", NL: "Netherlands", NO: "Norway", NP: "Nepal", NZ: "New Zealand", PK: "Pakistan", PL: "Poland",
  PT: "Portugal", QA: "Qatar", RO: "Romania", RU: "Russia", SA: "Saudi Arabia", SE: "Sweden", TR: "Türkiye", UA: "Ukraine", UZ: "Uzbekistan", ZA: "South Africa",
};

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === "string" && (COUNTRY_CODES as readonly string[]).includes(value);
}

/** Localised country name for a select option; falls back to English when the runtime lacks the locale. */
export function countryName(code: CountryCode, locale: string): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: "region" }).of(code);
    if (name && name !== code) return name;
  } catch {}
  return COUNTRY_NAMES_EN[code];
}
