/**
 * Kakao i Open Builder skill protocol (version 2.0). Pure helpers so the route stays thin and the rules are testable.
 * Request:  { userRequest: { utterance, callbackUrl?, user: { id, properties: { botUserKey? } } }, bot: { id }, ... }
 * Response: { version: "2.0", template: { outputs: [{ simpleText: { text } }], quickReplies? } }
 * Callback: answer { version: "2.0", useCallback: true } within 5 s, then POST the real response to callbackUrl
 * (single use, valid for one minute). callbackUrl is only present when the block has the callback feature switched on.
 */

export type SkillRequest = { utterance: string; userKey: string; callbackUrl: string | null; botId: string | null };

/** simpleText holds at most 1000 characters and a response at most 3 outputs. */
export const SIMPLE_TEXT_MAX = 1000;
const MAX_OUTPUTS = 3;
/** Longer messages are cut before they reach the model: a channel inquiry is a few sentences, not an essay. */
export const UTTERANCE_MAX = 1500;

export function parseSkillRequest(body: unknown): SkillRequest | null {
  if (!body || typeof body !== 'object') return null;
  const req = (body as { userRequest?: unknown }).userRequest;
  if (!req || typeof req !== 'object') return null;
  const r = req as { utterance?: unknown; callbackUrl?: unknown; user?: { id?: unknown; properties?: { botUserKey?: unknown } } };
  const utterance = typeof r.utterance === 'string' ? r.utterance.trim().slice(0, UTTERANCE_MAX) : '';
  const userKey = [r.user?.properties?.botUserKey, r.user?.id].find((v): v is string => typeof v === 'string' && v.length > 0) ?? '';
  if (!utterance || !userKey) return null;
  const callbackUrl = typeof r.callbackUrl === 'string' && isKakaoCallbackUrl(r.callbackUrl) ? r.callbackUrl : null;
  const bot = (body as { bot?: { id?: unknown } }).bot;
  return { utterance, userKey: userKey.slice(0, 200), callbackUrl, botId: typeof bot?.id === 'string' ? bot.id : null };
}

/** Only POST to Kakao's own callback hosts, never to a URL a forged request supplies. */
export function isKakaoCallbackUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'kakao.com' || url.hostname.endsWith('.kakao.com'));
  } catch {
    return false;
  }
}

/** Split long text on paragraph, then line, then sentence boundaries into at most three bubbles. */
export function splitForKakao(text: string): string[] {
  const clean = text.trim();
  if (clean.length <= SIMPLE_TEXT_MAX) return clean ? [clean] : [];
  const chunks: string[] = [];
  let rest = clean;
  while (rest.length > SIMPLE_TEXT_MAX && chunks.length < MAX_OUTPUTS - 1) {
    const window = rest.slice(0, SIMPLE_TEXT_MAX);
    const cut = [window.lastIndexOf('\n\n'), window.lastIndexOf('\n'), window.lastIndexOf('. '), window.lastIndexOf(' ')].find(i => i > SIMPLE_TEXT_MAX / 2) ?? SIMPLE_TEXT_MAX;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest.length > SIMPLE_TEXT_MAX ? `${rest.slice(0, SIMPLE_TEXT_MAX - 1)}…` : rest);
  return chunks;
}

export type QuickReply = { label: string; action: 'message'; messageText: string };

export function textResponse(text: string, quickReplies: QuickReply[] = []) {
  const outputs = splitForKakao(text).map(t => ({ simpleText: { text: t } }));
  return {
    version: '2.0' as const,
    template: { outputs: outputs.length ? outputs : [{ simpleText: { text: '메시지를 확인했어요.' } }], ...(quickReplies.length ? { quickReplies: quickReplies.slice(0, 10) } : {}) },
  };
}

/** Immediate answer when the block uses callbacks; `text` fills the waiting message if the block template uses it. */
export function callbackAck(text = '확인해서 바로 안내드릴게요 :)') {
  return { version: '2.0' as const, useCallback: true, data: { text } };
}

/**
 * Topics the bot never answers on its own, checked before the model is called: money already paid, contracts,
 * complaints, explicit requests for a person, and personal data the student should not send in a chat.
 * Returns a short reason label, or null.
 */
const HANDOFF_RULES: Array<[RegExp, string]> = [
  [/환불|취소|위약|반환|refund|cancel/i, 'refund or cancellation'],
  [/계약서|계약|contract/i, 'contract'],
  [/할인|깎|네고|discount/i, 'discount request'],
  [/불만|항의|실망|화가|사기|신고|소송|complain/i, 'complaint'],
  [/상담원|담당자|사람(이랑|과|하고)?\s*(연결|통화|상담|얘기|이야기)|직접\s*(통화|상담)|전화\s*(주세요|부탁|해\s*주)|human|real person/i, 'asked for a person'],
  [/결제(가|이)?\s*(안|오류|실패|됐|되었|두\s*번)|이중\s*결제|영수증/i, 'payment problem'],
  [/합격\s*(보장|확실)|불합격|떨어졌/i, 'admission decision'],
];

export function ruleHandoff(utterance: string): string | null {
  for (const [pattern, reason] of HANDOFF_RULES) if (pattern.test(utterance)) return reason;
  return null;
}

/** Hours after a handoff during which the bot holds instead of answering, so a person can pick the thread up. */
export const HANDOFF_HOLD_HOURS = 12;

export const HANDOFF_REPLY = '문의 주셔서 감사합니다. 이 내용은 담당자가 직접 확인한 뒤 답변드릴게요. 평일 기준 보통 하루 안에 연락드립니다 🙏';
export const HOLD_REPLY = '담당자가 확인하고 있어요. 추가로 전하실 내용이 있으면 편하게 남겨 주세요. 함께 전달할게요.';
export const FALLBACK_REPLY = '지금은 자동 안내가 잠시 어려워요. 남겨 주신 내용은 담당자에게 전달했고, 확인 후 답변드릴게요. 프로그램 정보는 criglobal.org/ko/research 에서도 보실 수 있어요.';

/** Never echo a link to anywhere but our own site; the model is told the same, this enforces it. */
export function stripForeignLinks(text: string): string {
  return text.replace(/https?:\/\/[^\s)]+/gi, (url) => {
    try {
      const host = new URL(url).hostname;
      return host === 'criglobal.org' || host.endsWith('.criglobal.org') || host === 'cri.kr' ? url : '';
    } catch {
      return '';
    }
  });
}

/** Compare a header secret in constant time. */
export function secretMatches(expected: string | undefined, given: string | null): boolean {
  if (!expected || !given || expected.length !== given.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}
