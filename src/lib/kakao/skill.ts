/**
 * Kakao i Open Builder skill protocol (version 2.0). Pure helpers so the route stays thin and the rules are testable.
 * Request:  { userRequest: { utterance, callbackUrl?, user: { id, properties: { botUserKey? } } }, bot: { id }, ... }
 * Response: { version: "2.0", template: { outputs: [{ simpleText: { text } }], quickReplies? } }
 * Callback: answer { version: "2.0", useCallback: true } within 5 s, then POST the real response to callbackUrl
 * (single use, valid for one minute). callbackUrl is only present when the block has the callback feature switched on.
 */
import { COMPANY } from '@/lib/company';

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
  [/환불|취소|위약|반환|캔슬|철회|refund|cancel/i, 'refund or cancellation'],
  // The seminar: not coming or changing a sign-up. A person updates the list.
  [/(세미나|웨비나|설명회)[\s\S]{0,30}(불참|못\s*(가|갈|갑|간|하|할|합|해|했|들)|안\s*(가|갈|갑|하|할|합|해)|어렵|어려|힘들|빼\s*(주|줘)|변경|바꾸|바꿔|바꿀|수정|정정)/, 'seminar cancel or change'],
  // Problems getting in or with a link (on the seminar day above all): a person, not the same link again.
  [/(세미나|웨비나|설명회|줌|zoom|링크|접속|입장|암호|비밀번호)[\s\S]{0,30}(안\s*(돼|되|됩|됐|됨|떠|뜨|열|들|나|보|켜|와|왔|옴)|못\s*(들|하|해|했)|틀려|틀렸|틀린|틀리|끊|오류|에러|실패|불가|만료|잘못|이상해|이상하|튕|대기실)/i, 'link or join problem'],
  [/계약서|계약|contract/i, 'contract'],
  [/할인|깎|네고|discount/i, 'discount request'],
  [/불만|항의|실망|화가|사기|신고|소송|complain/i, 'complaint'],
  [/상담원|담당자|사람(이랑|과|하고)?\s*(연결|통화|상담|얘기|이야기)|직접\s*(통화|상담)|전화\s*(주세요|부탁|해\s*주)|human|real person/i, 'asked for a person'],
  [/결제(가|이)?\s*(안|오류|실패|됐|되었|두\s*번)|이중\s*결제|영수증/i, 'payment problem'],
  [/합격\s*(보장|확실)|불합격|떨어졌/i, 'admission decision'],
  // Someone asking for other people's data: lists, contacts, application files. The bot has none, but a person should see it.
  [/(학생|지원자|참가자|참석자|참여자|신청자|등록자|수강생|회원|학부모|신청한\s*분)\s*(님)?\s*(들의?|분들의?)?\s*(명단|목록|리스트|연락처|전화\s*번호|이메일|개인\s*정보|정보\s*(좀\s*)?(보내|넘겨|공유|줘|주세요))|명단\s*(좀\s*)?(보내|넘겨|공유|줘|주세요|알려)|(student|applicant)s?\s*(list|data|contact|info)/i, 'request for student data'],
];

export function ruleHandoff(utterance: string): string | null {
  for (const [pattern, reason] of HANDOFF_RULES) if (pattern.test(utterance)) return reason;
  return null;
}

/**
 * Where a person answers. The channel's 1:1 chat is switched off (2026-11-24, so the "상담 연결" button is gone and
 * the bot is never cut off), which means nobody can reply in the chat room: every reply that needs a person gives
 * this number and none of them promises an answer in the chat.
 */
export const CONTACT_PHONE = COMPANY.phoneDomestic;

export const HANDOFF_REPLY = `문의 주셔서 감사합니다. 이 내용은 담당자가 직접 안내드려야 하는 부분이에요. 이 채팅방은 AI 상담 도우미가 답변드리고 있어서, 번거로우시겠지만 CRI 공식 번호 ${CONTACT_PHONE}로 전화 주시면 담당자가 도와드릴게요 🙏`;
export const FALLBACK_REPLY = `지금은 자동 안내가 잠시 어려워요. 잠시 후 다시 보내 주시거나, 급하시면 CRI 공식 번호 ${CONTACT_PHONE}로 전화 주세요. 프로그램 정보는 criglobal.org/ko/research 에서도 보실 수 있어요.`;
export const RATE_LIMIT_REPLY = `메시지가 많이 와서 지금은 답변이 어려워요. 잠시 후 다시 보내 주시거나, 급하시면 CRI 공식 번호 ${CONTACT_PHONE}로 전화 주세요.`;

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

/**
 * The seminar keyword. The bot answers it itself (no model call): it records a sign-up and replies with the join link.
 * It is an ALLOWLIST: the whole message must be a sign-up and nothing else — "세미나 신청", "세미나 참석할게요",
 * "세미나 링크 주세요", optionally with a greeting, thanks, the seminar's date, "담당자님" or the sender's own phone
 * number or email. Anything left over (a question, a story, not coming, a change, a problem getting in, another topic,
 * a question about other people) goes to the model or a person instead.
 */
export type WebinarSignupParse = { signup: boolean; phone: string | null; email: string | null };

const PHONE = /(?:\+?82[\s.-]?)?0?1[016789][\s.-]?\d{3,4}[\s.-]?\d{4}/;
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
/** The seminar's own date and time, as people write them ("12월 5일", "12/5", "토요일 오전 10시"). */
const DATE_TIME = /\d{1,2}\s*월\s*\d{1,2}\s*일|\d{1,2}\s*\/\s*\d{1,2}|토요일|오전\s*\d{1,2}\s*시|\d{1,2}\s*시/g;
/** Words that may surround a sign-up without changing it (matched on the compact form). */
const FILLERS = [
  /^(네|넵|넹|예)/,
  /안녕하세요|안녕하십니까|안녕하세여|안녕하세용|^안녕/g,
  /감사합니다|감사해요|감사드립니다|감사드려요|고맙습니다|고마워요|thankyou|thanks|땡큐/g,
  /(담당자|선생|관리자|대표)님(께|께서)?/g,
  /^(저희도|저희|저도|저|우리아이도|우리아이|아이도|아이)/,
  /^(이번|이번주|주말)(에|의)?/,
  /^(에|의)/,
];
/** Only when the message carried a phone number or email: the words that introduce it. */
const CONTACT_WORDS = [/(제|저의|저|엄마|아빠|어머니|아버지|학부모|부모님)?(의)?(전화번호|휴대폰번호|휴대폰|핸드폰|번호|연락처|이메일|메일)(는|은|이|가|로|:)?/g, /(입니다|이에요|예요)$/];

const SEMINAR_SIGNUP = new RegExp(
  '^(세미나|웨비나|설명회)' +
  '(도|는|을|를|에|에서|좀)?' +
  '(학부모|학생|부모님?|엄마|아빠|\\d+명|한명|두명)?(로|으로|도)?' +
  '(참가|참여|참석)?' +
  '(신청|등록|예약|접수)?' +
  '(줌|zoom)?(참여|입장|접속)?(링크|주소)?' +
  '(합니다|할게요|할께요|할래요|하겠습니다|하고싶어요|하고싶습니다|하고싶은데요|하고싶은데|하려고요|하려구요|하려는데요' +
  '|희망합니다|원합니다|해요|했어요|했습니다|이요|요|용|드립니다|드려요|부탁드립니다|부탁드려요|부탁해요|부탁합니다' +
  '|해주세요|해주세용|해주시겠어요|해주실수있나요|좀주세요|주세요|보내주세요|알려주세요|받고싶어요|받을게요' +
  '|가능할까요|가능한가요|가능해요|될까요|되나요|할수있나요|할게|할께|함|해줘|줘)?$',
  'i',
);
const SIGNUP_ACTION = /참가|참여|참석|신청|등록|예약|접수|링크|주소|줌|zoom|입장|접속/i;

/** Lower case, no spaces, punctuation, emoji or laughter: the form the keyword is judged on. */
function compact(text: string): string {
  return text
    .toLowerCase()
    .replace(/\p{Extended_Pictographic}|️|‍/gu, '')
    .replace(/[ㅋㅎㅠㅜ]+|\^\^/g, '')
    .replace(/[\s.,!?~…·:;'"“”‘’()[\]{}<>\-_/*+=|\\]+/g, '');
}

export function parseWebinarSignup(utterance: string): WebinarSignupParse {
  let text = utterance.normalize('NFC');
  const phoneMatch = text.match(PHONE);
  const emailMatch = text.match(EMAIL);
  const phone = phoneMatch ? phoneMatch[0].replace(/\D/g, '').replace(/^820?(1\d{8,9})$/, '0$1') : null;
  const email = emailMatch ? emailMatch[0].toLowerCase() : null;
  if (emailMatch) text = text.replace(emailMatch[0], ' ');
  if (phoneMatch) text = text.replace(phoneMatch[0], ' ');
  text = text.replace(DATE_TIME, ' ');
  let rest = compact(text);
  for (const pattern of FILLERS) rest = rest.replace(pattern, '');
  if (phone || email) for (const pattern of CONTACT_WORDS) rest = rest.replace(pattern, '');
  const signup = rest.length > 0 && rest.length <= 40 && SIGNUP_ACTION.test(rest) && SEMINAR_SIGNUP.test(rest);
  return { signup, phone: signup ? phone : null, email: signup ? email : null };
}

export function isWebinarSignupMessage(utterance: string): boolean {
  return parseWebinarSignup(utterance).signup;
}

/**
 * ruleHandoff reasons that do not contradict a sign-up ("세미나 신청합니다, 담당자님 감사합니다"): the person is
 * registered and gets the link, and the turn still goes to a person. Requests for other people's data are NOT here.
 */
export const SIGNUP_DESPITE_HANDOFF = new Set(['asked for a person']);

export function webinarKakaoReply(input: {
  open: boolean; already: boolean; label: string; topic: string; join: { url: string; passcode: string | null } | null;
  /** The website page, linked only while its form is open (after the start it shows the closed panel). */
  pageUrl: string | null;
  /** The session has started (10:00–11:00): say "join now" instead of "come five minutes early". */
  started?: boolean;
}): string {
  if (!input.open) return `이번 세미나(${input.label})는 끝났어요. 다음 세미나 일정은 정해지는 대로 criglobal.org/ko/webinar 에 올릴게요.`;
  const head = input.already ? `이미 신청되어 있어요. 다시 안내드릴게요.` : `세미나 신청이 접수되었어요. 감사합니다!`;
  const lines = [head, '', `주제: ${input.topic}`, `일시: ${input.label} (한국 시간), 약 60분`, `방식: 온라인 Zoom`];
  if (input.join) {
    lines.push('', `참여 링크: ${input.join.url}`);
    if (input.join.passcode) lines.push(`암호: ${input.join.passcode}`);
    lines.push('', input.started ? '지금 진행 중이에요. 위 링크로 바로 들어오세요.' : '링크는 이 대화방에 남아 있으니 당일 여기서 바로 들어오시면 돼요. 시작 5분 전 입장을 권해요.');
  } else {
    lines.push('', `참여 링크를 지금 바로 보내드리지 못했어요. 잠시 후 ‘세미나 신청’이라고 다시 보내 주시거나, 급하시면 CRI 공식 번호 ${CONTACT_PHONE}로 전화 주세요.`);
  }
  if (input.pageUrl) lines.push(`자세한 순서: ${input.pageUrl}`);
  return lines.join('\n');
}
