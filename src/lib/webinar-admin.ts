import { prisma } from "@/lib/prisma";
import { KAKAO_BOT_DEDUPE_PREFIX, PAST_WEBINARS, WEBINAR, webinarContactKeys } from "@/lib/webinar";

export type WebinarOption = { key: string; label: string; current: boolean };

/** The current webinar first, then the earlier ones. */
export function webinarOptions(): WebinarOption[] {
  return [{ key: WEBINAR.key, label: `${WEBINAR.label.ko} 세미나`, current: true }, ...PAST_WEBINARS.map((w) => ({ key: w.key, label: w.label, current: false }))];
}

export function pickWebinarKey(requested: string | null | undefined): string {
  return webinarOptions().find((w) => w.key === requested)?.key ?? WEBINAR.key;
}

/**
 * Sign-ups for one webinar, each marked with the other webinars the same person (same email, phone or Kakao id)
 * signed up for, whether one of them came earlier, and whether the sign-up came from the KakaoTalk channel bot.
 */
export async function webinarRowsWithHistory(key: string) {
  const rows = await prisma.webinarRegistration.findMany({ where: { webinarKey: key }, orderBy: { createdAt: "desc" } });
  const others = await prisma.webinarRegistration.findMany({
    where: { webinarKey: { not: key } },
    select: { webinarKey: true, email: true, phone: true, kakaoId: true, dedupeKey: true },
  });
  const seen = new Map<string, Set<string>>();
  for (const o of others) for (const k of webinarContactKeys(o)) {
    if (!seen.has(k)) seen.set(k, new Set());
    seen.get(k)!.add(o.webinarKey);
  }
  const labels = new Map(webinarOptions().map((w) => [w.key, w.label]));
  return rows.map((r) => {
    const sessions = new Set<string>();
    for (const k of webinarContactKeys(r)) for (const w of seen.get(k) ?? []) sessions.add(w);
    const keys = [...sessions].sort().reverse();
    const viaKakao = r.dedupeKey.startsWith(KAKAO_BOT_DEDUPE_PREFIX);
    return {
      ...r,
      viaKakao,
      /** Every other session this person signed up for, newest first (keys are ISO dates). */
      otherSignups: keys.map((w) => labels.get(w) ?? w),
      /** Signed up for a session that came before this one. */
      cameBefore: keys.some((w) => w < key),
      /** A KakaoTalk-channel row carries no contact, so "first time" cannot be known for it. */
      historyUnknown: viaKakao && !keys.length,
    };
  });
}
