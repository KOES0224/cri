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
  /**
   * People who left no phone number are asked once more, by email, to add one (KakaoTalk notices need a number):
   * at this moment, or 7 days after they signed up if that comes first; late sign-ups are asked the next morning.
   * About two weeks before the seminar is a good default; never ask again after that.
   */
  phoneAskAt: new Date("2026-12-01T10:00:00+09:00"),
  /**
   * The owner exports the numbers and uploads the KakaoTalk friend group at or after this moment (the day before);
   * from then on nobody is promised a KakaoTalk notice or asked for a number for one.
   */
  kakaoNoticeCutoff: new Date("2026-12-04T12:00:00+09:00"),
} as const;

/** Earlier webinars, newest first: the admin list can switch to them and marks people who came back. */
export const PAST_WEBINARS = [{ key: "2026-10-31", label: "10/31 설명회" }] as const;

/** CRI's KakaoTalk channel: adding it and sending the keyword below gets the join link from the channel bot. */
export const KAKAO_CHANNEL_URL = "https://pf.kakao.com/_xhdzxln";
export const KAKAO_CHANNEL_CHAT_URL = `${KAKAO_CHANNEL_URL}/chat`;
/**
 * Adds the channel in one step: on a phone it opens KakaoTalk's own add screen, on a computer a Kakao login and an
 * add button. Only an explicit add makes someone a channel friend (chatting with the bot never does), and channel
 * messages to a friend group reach friends only.
 */
export const KAKAO_CHANNEL_ADD_URL = `${KAKAO_CHANNEL_URL}/friend`;
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
  return now.getTime() < webinarEndsAt().getTime();
}

export function webinarEndsAt(): Date {
  return new Date(WEBINAR.startsAt.getTime() + WEBINAR.durationMinutes * 60_000);
}

/** The seminar morning until the end (6 hours before the start): replies that send someone to a person also point to the keyword. */
export function webinarDayOf(now = new Date()): boolean {
  return now.getTime() >= WEBINAR.startsAt.getTime() - 6 * 3600_000 && webinarKakaoOpen(now);
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


/** Until the friend-group list is exported: numbers are still collected for the KakaoTalk notices. */
export function webinarKakaoNoticesOpen(now = new Date()): boolean {
  return now < WEBINAR.kakaoNoticeCutoff;
}

/** A Korean mobile number as KakaoTalk friend groups take it (01012345678), or null for anything else. */
export function koreanMobile(phone: string | null | undefined): string | null {
  const digits = (phone || "").replace(/\D/g, "").replace(/^820?(1\d{8,9})$/, "0$1");
  // 010 numbers always have 11 digits; the old 011/016–019 ranges have 10 or 11.
  return /^(010\d{8}|01[16789]\d{7,8})$/.test(digits) ? digits : null;
}

const DAY = 24 * 3600_000;
const KST = 9 * 3600_000;

/** The next 10:00 KST at or after `at`. */
function nextTenKst(at: Date): Date {
  const kst = new Date(at.getTime() + KST);
  const ten = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate(), 10) - KST;
  return new Date(ten >= at.getTime() ? ten : ten + DAY);
}

/**
 * When to ask someone without a number, once: 7 days after signing up or at phoneAskAt, whichever is first, but at
 * least a day after signing up; always at 10:00 KST. Null when that would fall in the last 24 hours before the
 * seminar (the reminders cover that day).
 */
export function webinarPhoneAskAt(createdAt: Date): Date | null {
  const raw = Math.min(createdAt.getTime() + 7 * DAY, Math.max(WEBINAR.phoneAskAt.getTime(), createdAt.getTime() + DAY));
  const at = nextTenKst(new Date(raw));
  // At least a day before the friend-group list closes, so the link in the email still works when it is read.
  const latest = Math.min(WEBINAR.startsAt.getTime(), WEBINAR.kakaoNoticeCutoff.getTime()) - DAY;
  return at.getTime() <= latest ? at : null;
}

/** Email reminders with the join link: the evening before (19:00 KST) and 30 minutes before the start. */
export function webinarReminderTimes(): { dayBefore: Date; soon: Date } {
  return { dayBefore: new Date(WEBINAR.startsAt.getTime() - 15 * 3600_000), soon: new Date(WEBINAR.startsAt.getTime() - 30 * 60_000) };
}

/** Same calendar day in Korea. */
export function sameKstDay(a: Date, b: Date): boolean {
  return new Date(a.getTime() + KST).toISOString().slice(0, 10) === new Date(b.getTime() + KST).toISOString().slice(0, 10);
}
