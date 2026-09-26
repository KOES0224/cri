/**
 * Normalisation and hashing for Meta customer information parameters.
 * Everything Meta receives about a person is a SHA-256 hex of the normalised value; raw values never leave the server.
 * https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters
 */
import { createHash } from "node:crypto";

export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function normalizeEmail(email: string | null | undefined): string | undefined {
  const v = (email || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : undefined;
}

/** ISO-3166 alpha-2 → international dialling code for the markets CRI recruits from. */
export const DIAL_CODES: Record<string, string> = {
  KR: "82", US: "1", CA: "1", VN: "84", TH: "66", ID: "62", MY: "60", PH: "63", SG: "65", KH: "855", LA: "856", MM: "95", BN: "673",
  CN: "86", HK: "852", TW: "886", JP: "81", IN: "91", AU: "61", NZ: "64", GB: "44", DE: "49", FR: "33", NL: "31", ES: "34", IT: "39",
  AE: "971", SA: "966", QA: "974", TR: "90", MX: "52", BR: "55", RU: "7", KZ: "7", UZ: "998", MN: "976", PK: "92", BD: "880", LK: "94", NP: "977",
};

/**
 * Returns E.164 digits without "+" (Meta's expected format), or undefined when the input is not usable.
 * - "+82 10-1234-5678" → "821012345678"
 * - "010-1234-5678" with country KR (or no country: Korean mobile prefix) → "821012345678"
 * - "(415) 555-0100" with country US → "14155550100"
 * - "0912 345 678" with country VN → "84912345678"
 */
export function normalizePhone(phone: string | null | undefined, country?: string | null): string | undefined {
  if (!phone) return undefined;
  const raw = phone.trim();
  if (!raw) return undefined;
  const hasPlus = raw.startsWith("+");
  let digits = raw.replace(/\D/g, "");
  if (!digits) return undefined;
  if (hasPlus) return validLength(digits);
  if (digits.startsWith("00")) return validLength(digits.slice(2));
  const cc = (country || "").trim().toUpperCase();
  let dial = DIAL_CODES[cc];
  if (!dial) {
    // Best guess without a country: Korean mobile/landline numbers start with 0 (010, 02, 031…), Korean numbers are 9–11 digits.
    if (/^0\d{8,10}$/.test(digits)) dial = "82";
    else if (/^1\d{10}$/.test(digits)) return validLength(digits); // NANP with leading 1
    else if (/^\d{10}$/.test(digits)) dial = "1"; // bare NANP
    else return validLength(digits);
  }
  if (digits.startsWith("0")) digits = digits.replace(/^0+/, "");
  else if (digits.startsWith(dial) && digits.length >= dial.length + 8) return validLength(digits);
  return validLength(dial + digits);
}

function validLength(digits: string): string | undefined {
  return digits.length >= 8 && digits.length <= 15 ? digits : undefined;
}

export function normalizeCountry(country: string | null | undefined): string | undefined {
  const v = (country || "").trim().toLowerCase();
  return /^[a-z]{2}$/.test(v) ? v : undefined;
}

export function normalizeName(name: string | null | undefined): string | undefined {
  const v = (name || "").trim().toLowerCase().replace(/\s+/g, " ");
  return v || undefined;
}

/** Hashes a normalised value; returns undefined when there is nothing to hash. */
export function hashed(value: string | undefined): string | undefined {
  return value ? sha256(value) : undefined;
}
