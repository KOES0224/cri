/**
 * Kakao i Open Builder skill protocol (version 2.0). Pure helpers so the route stays thin and the rules are testable.
 * Request:  { userRequest: { utterance, callbackUrl?, user: { id, properties: { botUserKey? } } }, bot: { id }, ... }
 * Response: { version: "2.0", template: { outputs: [{ simpleText: { text } }], quickReplies? } }
 * Callback: answer { version: "2.0", useCallback: true } within 5 s, then POST the real response to callbackUrl
 * (single use, valid for one minute). callbackUrl is only present when the block has the callback feature switched on.
 */

import { WEBINAR } from '../webinar';

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
/** 안 as a negation, not inside 동안, 제안, 불안, 편안, 방안, 대안, 보안, 답안. */
const NOT = '(?<![동제불편방대보답])안\\s*';
const SEMINAR_WORD = '(세미나|새미나|웨비나|설명회)';

/**
 * Rules that only fire on statements: a question ("세미나 카메라 안 켜도 되나요?", "내용이 어렵나요?") goes to the
 * model, which is told to hand declines and join problems to a person as well.
 */
const STATEMENT_RULES: Array<[RegExp, string]> = [
  // The seminar: not coming, or changing a sign-up. A person updates the list.
  [new RegExp(SEMINAR_WORD + '[\\s\\S]{0,80}(' + [
    '불참', '못\\s*(가|갈|갑|간|감|하|할|합|해|했|함|들|봐|볼|봅)', NOT + '(가|갈|갑|감|하|할|합|해|함|될|돼|되|맞|봐|볼)',
    '(하|가|듣|보|참석하|참여하|신청하)지\\s*(않|못)', '곤란', '(참석|참여|참가|시청)\\s*(이|가|은|는|도|하기)?\\s*(어렵|어려|힘들|불가)',
    '어려울\\s*(것|거|듯)', '힘들\\s*(것|거|듯)', '어렵게\\s*(되|됐)', '어렵겠', '힘들겠', '패스(할|하겠|합|요|해)', '빠질', '쉴게', '접을게',
    '결석', '무리(일|예|에요|입니)', '다음\\s*(에|기회에)\\s*(들을|할게|신청|참석|볼게)', '지워', '삭제', '없던\\s*걸로', '빼\\s*(주|줘)', '변경',
    '바꾸', '바꿔', '바꿀', '(신청|등록|이메일|메일|번호|연락처|이름)[\\s\\S]{0,10}(수정|정정|고쳐|고치|오타|업데이트)', '다른\\s*걸로',
  ].join('|') + ')'), 'seminar cancel or change'],
  // Unmistakable declines and sign-up changes without the word 세미나.
  [/불참|(참석|참여|참가)\s*(이|을|은|도|하기)?\s*(어렵|어려|힘들|곤란|불가)|참석\s*(못|안\s*(하|할|합|해|함))|참석하지\s*(않|못)|못\s*(갈|가|들을|볼)\s*(것|거|듯)|(이메일|메일|번호|연락처)[\s\S]{0,12}(잘못|틀렸|틀려|오타)|(번호|메일|이메일|연락처)[\s\S]{0,25}말고/, 'seminar cancel or change'],
  // Problems getting in, with the link, sound or screen (on the seminar day above all): a person, not the same link again.
  [new RegExp('(세미나|새미나|웨비나|설명회|줌|zoom|링크|접속|입장|암호|비밀번호|비번|패스코드|회의\\s*id|화면|소리|음성|영상|호스트)[\\s\\S]{0,30}(' + [
    NOT + '(돼|되|됩|됐|됨|될|떠|뜨|열|들|나|보|켜|와|왔|옴|맞|눌|넘어|받)', '못\\s*(들|하|해|했|받)', '수\\s*(가|도|는)?\\s*없',
    '(들어가지|들어가|열리|들리|보이|되|켜|넘어가)지?\\s*(가|는|도)?\\s*않', '지\\s*않', '시작\\s*안\\s*(했|함|됐)', '틀려', '틀렸', '틀린', '틀리',
    '끊', '오류', '에러', '실패', '불가', '만료', '잘못', '이상해', '이상하', '이상한', '하얘', '하얗', '튕', '대기실', '유효하지', '로딩', '멈췄', '멈춰', '꺼졌', '나가졌',
    '반응이?\\s*없', '승인', '들여보내', '기다리래', '대기\\s*중', '까맣', '까매', '검정', '깨져', '작아', '지직', '하나도\\s*없', '앱스토어',
    '로그인하(래|라)', '끝났다고', '종료됐다고', '다른\\s*회의', '아직\\s*없', '받은\\s*(적|게)\\s*(이|은)?\\s*없',
  ].join('|') + ')', 'i'), 'link or join problem'],
  [/튕겼|튕겨|튕기|대기실(이라|이에요|이래|에\s*(있|계속)|에서\s*(계속|기다|안))|입장\s*승인|들여보내/, 'link or join problem'],
];

/** A question: a question mark, or a question ending at the end of the message. */
const QUESTION = /[?？]|((?<!세미)나요|까요|죠|인가요|는가요|던가요|할까|될까|는지|은지|건가|건지|있나|없나|되나|하나|인가)\s*[.!~ㅠㅜ^]*\s*$/;

const HANDOFF_RULES: Array<[RegExp, string]> = [
  [/환불|취소|위약|반환|캔슬|철회|refund|cancel/i, 'refund or cancellation'],
  [/계약서|계약|contract/i, 'contract'],
  [/할인|깎|네고|discount/i, 'discount request'],
  [/불만|항의|실망|화가|사기|신고|소송|complain/i, 'complaint'],
  [/상담원|담당자|사람(이랑|과|하고)?\s*(연결|통화|상담|얘기|이야기)|직접\s*(통화|상담)|전화\s*(주세요|부탁|해\s*주)|human|real person/i, 'asked for a person'],
  [/결제(가|이)?\s*(안|오류|실패|됐|되었|두\s*번)|이중\s*결제|영수증/i, 'payment problem'],
  [/합격\s*(보장|확실)|불합격|떨어졌/i, 'admission decision'],
  // Someone asking for other people's data: lists, contacts, application files. The bot has none, but a person should see it.
  [/(학생|지원자|참가자|참석자|참여자|신청자|등록자|수강생|회원|학부모|신청한\s*분|사람|사람들|분들|친구|친구들|애들)\s*(님)?\s*(들의?|분들의?)?[\s\S]{0,12}?(명단|목록|리스트|연락처|전화\s*번호|번호(?!\s*로)|이메일|카톡\s*(아이디|id)|개인\s*정보|정보\s*(좀\s*)?(보내|넘겨|공유|줘|주세요))|명단\s*(좀\s*)?(보내|넘겨|공유|줘|주세요|알려|보여|요)|(student|applicant)s?\s*(list|data|contact|info)/i, 'request for student data'],
];

export function ruleHandoff(utterance: string): string | null {
  // Runs of spaces collapsed first: several optional \s* in a row would otherwise backtrack badly on long input.
  const text = utterance.replace(/\s+/g, ' ').trim();
  for (const [pattern, reason] of HANDOFF_RULES) if (pattern.test(text)) return reason;
  if (!QUESTION.test(text)) for (const [pattern, reason] of STATEMENT_RULES) if (pattern.test(text)) return reason;
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
/** The seminar's own date and time only, as people write them ("12월 5일(토)", "12/5", "토요일 오전 10시"); other dates stay. */
const DATE_TIME = (() => {
  const kst = new Date(WEBINAR.startsAt.getTime() + 9 * 3600_000);
  const m = kst.getUTCMonth() + 1, d = kst.getUTCDate(), h = kst.getUTCHours();
  const day = '일월화수목금토'[kst.getUTCDay()];
  const date = `(${m}\\s*월\\s*${d}\\s*일|${m}\\s*[/.]\\s*${d})(\\s*\\(?\\s*${day}(요일)?\\s*\\)?)?`;
  return new RegExp(`${date}|${day}요일|${day}욜|(오전\\s*)?${h}\\s*시|${m}\\s*월(?!\\s*\\d)|(?<!\\d)${d}\\s*일`, 'g');
})();
/** Words that may surround a sign-up without changing it (matched on the compact form). */
const FILLERS = [
  /^(네|넵|넹|예)/,
  /안녕하세요|안녕하십니까|안녕하세여|안녕하세용|^안녕/g,
  /감사합니다|감사합니당|감사해요|감사해용|감사드립니다|감사드려요|감사요|고맙습니다|고마워요|수고하세요|수고하십시오|좋은하루(되세요|보내세요)|잘부탁드립니다|잘부탁드려요|thankyou|thanks|땡큐/g,
  // Only at either end, so "세미나 선생님도 참여해요" keeps its subject.
  /^(담당자|선생|관리자|대표)님(께서|께)?|(담당자|선생|관리자|대표)님(께서|께)?$/g,
  /^(오늘|내일|지금|이번주|이번|주말)(에|의|은|는)?/,
  /^(저희|우리|저)?(집)?(아이|애|딸|아들)?(도|는|가)?/,
  /^(에|의)/,
];
/** Leading words that only qualify the seminar: "온라인 세미나", "무료 세미나", "CRI 세미나". */
const SEMINAR_QUALIFIER = /^(cri|씨알아이|온라인|무료|이번|12월)(의)?(?=세미나|웨비나|설명회)/;
/** Only when the message carried a phone number or email: the words that introduce it. */
const CONTACT_WORDS = [/(제|저의|저|엄마|아빠|어머니|아버지|학부모|부모님)?(의)?(전화번호|휴대폰번호|휴대폰|핸드폰|번호|연락처|이메일|메일)(는|은|이|가|로|:)?/g, /(입니다|이에요|예요)$/];

/** Endings that ask for the link politely; only valid when the message asks for the link itself. */
const LINK_QUESTION_ENDINGS = '받을수있을까요|받을수있나요|보내주실수있나요|보내주실수있을까요|주실수있을까요|주실수있나요';
const SEMINAR_SIGNUP = new RegExp(
  '^(세미나|웨비나|설명회)' +
  '(도|는|을|를|에|에서|좀)?' +
  '(학부모|학생|부모님?|엄마|아빠|\\d+명|한명|두명)?(로|으로|도)?' +
  '(참가|참여|참석)?' +
  '(신청|등록|예약|접수)?(했습니다|했어요)?' +
  '(줌|zoom)?(참여|입장|접속)?(링크|주소)?' +
  '(좀|다시|한번더|한번만더)?' +
  '(합니다|할게요|할께요|할래요|하겠습니다|하고싶어요|하고싶습니다|하고싶은데요|하고싶은데|하려고요|하려구요|하려는데요' +
  '|하려고합니다|하고자합니다|희망합니다|희망해요|원합니다|원해요|해요|했어요|했습니다|이요|요|용|드립니다|드려요|드릴게요' +
  '|부탁드립니다|부탁드려요|부탁드릴게요|부탁해요|부탁합니다|해주세요|해주세용|해주시겠어요|주세요|보내주세요|알려주세요|넣어주세요' +
  '|공유부탁드립니다|공유부탁드려요|공유해주세요|보내주시면감사하겠습니다|주시면감사하겠습니다|받고싶어요|받고싶습니다|받을게요' +
  '|듣고싶어요|듣고싶습니다|들을게요|' + LINK_QUESTION_ENDINGS + '|할게|할께|함|해줘|줘)?$',
  'i',
);
const SIGNUP_ACTION = /참가|참여|참석|신청|등록|예약|접수|링크|주소|줌|zoom|입장|접속|듣고싶|들을게/i;
const ASKS_FOR_LINK = /링크|주소/;

/** Lower case, no spaces, punctuation, emoji or laughter: the form the keyword is judged on. */
function compact(text: string): string {
  return text
    .toLowerCase()
    .replace(/\p{Extended_Pictographic}|\p{Emoji_Modifier}|[\u20E3\uFE0F\u200D♡♥♤♧☆★]/gu, '')
    .replace(/[ㅋㅎㅠㅜ]+/g, '')
    .replace(/[\s.,!?~…·:;'"“”‘’()[\]{}<>\-_/*+=|\\^]+/g, '');
}

export function parseWebinarSignup(utterance: string): WebinarSignupParse {
  let text = utterance.normalize('NFC');
  const phoneMatch = text.match(PHONE);
  const emailMatch = text.match(EMAIL);
  const phone = phoneMatch ? phoneMatch[0].replace(/\D/g, '').replace(/^820?(1\d{8,9})$/, '0$1') : null;
  const email = emailMatch ? emailMatch[0].toLowerCase() : null;
  for (const match of [emailMatch, phoneMatch]) {
    if (!match) continue;
    // A short name right before the number ("김서연 010-…") belongs to the contact, not to the message.
    const at = text.indexOf(match[0]);
    const before = text.slice(0, at).replace(/(^|\s)(?!신청|등록|예약|접수|참석|참가|참여|링크|주소|연락처|번호|전화|휴대폰|핸드폰|이메일|메일|학부모|부모님|엄마|아빠|어머니|아버지)[가-힣]{2,3}\s*[,/:]?\s*$/, '$1');
    text = `${before} ${text.slice(at + match[0].length)}`;
  }
  text = text.replace(DATE_TIME, ' ');
  let rest = compact(text);
  for (let pass = 0; pass < 3; pass++) {
    const before = rest;
    for (const pattern of FILLERS) rest = rest.replace(pattern, '');
    rest = rest.replace(SEMINAR_QUALIFIER, '');
    if (rest === before) break;
  }
  if (phone || email) for (const pattern of CONTACT_WORDS) rest = rest.replace(pattern, '');
  const asksLink = ASKS_FOR_LINK.test(rest);
  const signup = rest.length > 0 && rest.length <= 40 && SIGNUP_ACTION.test(rest) && SEMINAR_SIGNUP.test(rest)
    // A question ("세미나 학생도 참석 가능한가요?") is answered by the model, not registered; asking for the link is fine.
    && (asksLink || !/[?？]/.test(utterance))
    && (asksLink || !new RegExp(`(${LINK_QUESTION_ENDINGS})$`).test(rest))
    // "참석했어요" is about a past session; a head count with 했어요 is about other people.
    && !/(참석|참여|참가)(했어요|했습니다)$/.test(rest) && !/(\d+명|한명|두명)[^]*(했어요|했습니다)$/.test(rest);
  return { signup, phone: signup ? phone : null, email: signup ? email : null };
}

/** The message without the sender's own phone number or email and the words that label it, for the handoff rules. */
export function withoutOwnContact(utterance: string): string {
  const text = utterance.replace(EMAIL, ' ').replace(PHONE, ' ');
  return text.replace(/(제|저의|저|엄마|아빠|어머니|아버지|학부모|부모님)?\s*(의)?\s*(전화\s*번호|휴대폰\s*번호|휴대폰|핸드폰|번호|연락처|이메일|메일)\s*(는|은|이|가|로|:)?/g, ' ');
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
    lines.push('', '참여 링크는 담당자가 이 대화방으로 보내드릴게요.');
  }
  if (input.pageUrl) lines.push(`자세한 순서: ${input.pageUrl}`);
  return lines.join('\n');
}
