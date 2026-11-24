/**
 * The current webinar. Edit this object for the next one: the banner, the sign-up page, the confirmation email and
 * the admin list all read from it. Times are Korean (KST, UTC+9).
 */
export const WEBINAR = {
  /** Groups registrations; change it for every new webinar. */
  key: "2026-12-05",
  startsAt: new Date("2026-12-05T10:00:00+09:00"),
  /** Sign-ups close when the session starts. */
  closesAt: new Date("2026-12-05T10:00:00+09:00"),
  /** The site-wide banner disappears when the session ends (until then it leads to the page, which offers KakaoTalk). */
  bannerUntil: new Date("2026-12-05T11:00:00+09:00"),
  durationMinutes: 60,
  platform: "Zoom",
  /** Short label for admin screens and the KakaoTalk reply. */
  label: { ko: "12월 5일(토) 오전 10시", en: "Sat 5 Dec, 10:00 AM KST" },
  topic: { ko: "AI 시대, 논문은 통할까", en: "Does a research paper still count in the AI era?" },
} as const;

/** Earlier webinars, newest first: the admin list can switch to them and marks people who came back. */
export const PAST_WEBINARS = [{ key: "2026-10-31", label: "10/31 설명회" }] as const;

/** CRI's KakaoTalk channel: adding it and sending the keyword below gets the join link from the channel bot. */
export const KAKAO_CHANNEL_URL = "https://pf.kakao.com/_xhdzxln";
export const KAKAO_CHANNEL_CHAT_URL = `${KAKAO_CHANNEL_URL}/chat`;
export const WEBINAR_KAKAO_KEYWORD = "세미나 신청";

/**
 * The Zoom join link comes from the environment (the repository is public): WEBINAR_JOIN_URL, optional
 * WEBINAR_JOIN_PASSCODE (Vercel, Production; a redeploy applies a change). Without a valid one the KakaoTalk bot still
 * records the sign-up, says a person will send the link, and hands the chat to admissions so someone does.
 */
export function webinarJoinInfo(): { url: string; passcode: string | null } | null {
  const url = (process.env.WEBINAR_JOIN_URL || "").trim();
  if (!/^https:\/\/([a-z0-9-]+\.)*zoom\.us\//i.test(url)) return null;
  return { url, passcode: (process.env.WEBINAR_JOIN_PASSCODE || "").trim() || null };
}

/** Sign-ups made through the KakaoTalk channel bot carry this dedupe prefix (no name or contact is asked there). */
export const KAKAO_BOT_DEDUPE_PREFIX = "kakaobot:";

/** Normalised contact keys of one person, for spotting someone who also signed up for an earlier webinar. */
export function webinarContactKeys(r: { email?: string | null; phone?: string | null; kakaoId?: string | null; dedupeKey?: string | null }): string[] {
  const keys: string[] = [];
  const email = (r.email || "").trim().toLowerCase();
  if (email) keys.push(`email:${email}`);
  // +82 10-1234-5678 (autofill) and 010-1234-5678 are the same Korean mobile number.
  const digits = (r.phone || "").replace(/\D/g, "").replace(/^820?(1\d{8,9})$/, "0$1");
  if (digits.length >= 8) keys.push(`phone:${digits}`);
  // Only values that look like a real KakaoTalk ID: "없음", "-" or "x" typed into the box must not join strangers.
  const kakao = (r.kakaoId || "").trim().toLowerCase().replace(/^@/, "");
  if (/^[a-z0-9._-]{4,20}$/.test(kakao)) keys.push(`kakao:${kakao}`);
  if (r.dedupeKey?.startsWith(KAKAO_BOT_DEDUPE_PREFIX)) keys.push(r.dedupeKey);
  return keys;
}

export function webinarRegistrationOpen(now = new Date()): boolean {
  return now < WEBINAR.closesAt;
}

export function webinarBannerVisible(now = new Date()): boolean {
  return now < WEBINAR.bannerUntil;
}

/**
 * The KakaoTalk keyword keeps registering people and giving the join link until the session ends (start + duration),
 * so someone who asks at 10:05 can still get in. The website form closes at the start, as before.
 */
export function webinarKakaoOpen(now = new Date()): boolean {
  return now.getTime() < WEBINAR.startsAt.getTime() + WEBINAR.durationMinutes * 60_000;
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
