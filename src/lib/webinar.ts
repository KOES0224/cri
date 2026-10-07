/**
 * The current webinar. Edit this object for the next one: the banner, the sign-up page, the confirmation email and
 * the admin list all read from it. Times are Korean (KST, UTC+9).
 */
export const WEBINAR = {
  /** Groups registrations; change it for every new webinar. */
  key: "2026-10-31",
  startsAt: new Date("2026-10-31T10:00:00+09:00"),
  /** Sign-ups close when the session starts. */
  closesAt: new Date("2026-10-31T10:00:00+09:00"),
  /** The banner and the page's sign-up form disappear after this moment (midnight after the webinar day). */
  bannerUntil: new Date("2026-11-01T00:00:00+09:00"),
  durationMinutes: 60,
  platform: "Zoom",
} as const;

export function webinarRegistrationOpen(now = new Date()): boolean {
  return now < WEBINAR.closesAt;
}

export function webinarBannerVisible(now = new Date()): boolean {
  return now < WEBINAR.bannerUntil;
}

/** Normalised contact used to keep one registration per person: email first, then phone digits, then Kakao id. */
export function webinarDedupeKey(input: { email?: string | null; phone?: string | null; kakaoId?: string | null }): string | null {
  const email = (input.email || "").trim().toLowerCase();
  if (email) return `email:${email}`;
  const digits = (input.phone || "").replace(/\D/g, "");
  if (digits.length >= 8) return `phone:${digits}`;
  const kakao = (input.kakaoId || "").trim().toLowerCase().replace(/^@/, "");
  if (kakao) return `kakao:${kakao}`;
  return null;
}
