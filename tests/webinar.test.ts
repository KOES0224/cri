import test from 'node:test';
import assert from 'node:assert/strict';
import { webinarErrors } from '../src/lib/webinar-validation';
import { webinarDedupeKey, webinarBannerVisible, webinarRegistrationOpen, WEBINAR } from '../src/lib/webinar';

test('webinar sign-up needs a name, a role, consent and at least one contact', () => {
  const base = { name: 'Kim Minjun', role: 'PARENT', phone: '', email: '', kakaoId: '', question: '', consent: true };
  assert.deepEqual(webinarErrors({ ...base, email: 'parent@example.test' }), {});
  assert.deepEqual(webinarErrors({ ...base, phone: '010-1234-5678' }), {});
  assert.deepEqual(webinarErrors({ ...base, kakaoId: 'minjun_mom' }), {});
  assert.equal(webinarErrors(base).contact, 'contact');
  assert.equal(webinarErrors({ ...base, email: 'not-an-email' }).email, 'email');
  assert.equal(webinarErrors({ ...base, phone: '12' }).phone, 'phone');
  assert.equal(webinarErrors({ ...base, email: 'a@b.co', consent: false }).consent, 'consent');
  assert.equal(webinarErrors({ ...base, email: 'a@b.co', name: ' ' }).name, 'name');
  assert.equal(webinarErrors({ ...base, email: 'a@b.co', role: 'TEACHER' }).role, 'role');
});

test('one registration per person: email wins, then phone digits, then kakao id', () => {
  assert.equal(webinarDedupeKey({ email: ' Parent@Example.com ', phone: '010-1234-5678' }), 'email:parent@example.com');
  assert.equal(webinarDedupeKey({ phone: '+82 10-1234-5678' }), 'phone:821012345678');
  assert.equal(webinarDedupeKey({ kakaoId: '@MinjunMom' }), 'kakao:minjunmom');
  assert.equal(webinarDedupeKey({}), null);
});

test('the banner and the form switch off by the Korean calendar', () => {
  assert.equal(WEBINAR.startsAt.toISOString(), '2026-12-05T01:00:00.000Z'); // 10:00 KST
  assert.equal(webinarRegistrationOpen(new Date('2026-12-05T00:59:00Z')), true);
  assert.equal(webinarRegistrationOpen(new Date('2026-12-05T01:00:00Z')), false);
  assert.equal(webinarBannerVisible(new Date('2026-12-05T01:59:00Z')), true);   // 10:59 KST: session still on
  assert.equal(webinarBannerVisible(new Date('2026-12-05T02:00:00Z')), false);  // 11:00 KST: session over → gone
});

test('KakaoTalk keyword: only a message that is just a sign-up gets the canned reply', async () => {
  const { parseWebinarSignup, ruleHandoff, SIGNUP_DESPITE_HANDOFF, withoutOwnContact } = await import('../src/lib/kakao/skill');
  const decide = (m: string) => {
    const p = parseWebinarSignup(m);
    const reason = ruleHandoff(p.signup && (p.phone || p.email) ? withoutOwnContact(m) : m); // as in the route
    return p.signup && (!reason || SIGNUP_DESPITE_HANDOFF.has(reason)) ? 'canned' : reason ? `person:${reason}` : 'model';
  };
  const signUps = [
    '세미나 신청', '세미나신청', '세미나 신청할게요', '세미나 신청 할께요', '웨비나 신청합니다', '설명회 참가 신청', '세미나 참석 신청합니다',
    '세미나 참석할게요', '세미나를 신청하고 싶어요', '세미나에 참가 신청합니다', '세미나 등록할게요', '세미나 신청했어요', '세미나 신청이요',
    '세미나 신청요~', '세미나 신청!!', '세미나 신청 😊', '세미나도 신청할게요', '세미나는 신청할게요', '세미나, 신청합니다', '세미나 1명 신청합니다',
    '세미나 학부모 신청합니다', '세미나 신청하고 싶은데요', '세미나 참석하고 싶은데요', '세미나 신청하려는데요', '세미나 링크 주세요',
    '세미나 링크 부탁드려요', '세미나 줌 주소 알려주세요', '세미나 입장 링크 주세요', '세미나 zoom 링크 보내주세요',
    '안녕하세요. 12월 5일 토요일 오전 10시 세미나 신청합니다. 감사합니다.', '안녕하세요 세미나 신청합니다', '세미나 신청합니다 감사합니다',
    '네 세미나 신청할게요', '저도 세미나 신청할게요', '세미나 신청 부탁드립니다', '세미나 참여 희망합니다', '세미나 신청합니다ㅎㅎ', '12/5 세미나 신청합니다',
    '세미나 링크 좀 보내주세요', '세미나 신청 좀 부탁드려요', '세미나 신청 좀 할게요', '세미나 신청 부탁드릴게요', '세미나 신청하려고 합니다',
    '세미나 참석 원해요', '오늘 세미나 링크 주세요', '내일 세미나 신청할게요', '저희 아이 세미나 신청할게요', '이번주 세미나 신청합니다',
    '세미나 신청합니다🙏🏻', '세미나 신청합니다 ♡', '세미나 신청합니다 ★', '12월 5일(토) 오전 10시 세미나 신청합니다', '12월 5일 토요일 세미나 신청이요',
    '담당자님께서 세미나 신청 부탁드립니다', '세미나 신청합니다. 학부모 연락처 010-1234-5678', '세미나 신청 학부모 이메일 abc@naver.com',
    '온라인 세미나 신청합니다', 'CRI 세미나 신청할게요', '세미나 링크 다시 보내주세요', '세미나 신청했습니다 링크 주세요', '세미나 듣고 싶어요',
    '세미나 신청합니다 수고하세요', '세미나 신청할게요👍🏼', '세미나 신청 ^^', '세미나 신청합니다. 김서연 010-2345-6789', '세미나 링크 받을 수 있을까요?',
  ];
  for (const m of signUps) assert.equal(decide(m), 'canned', m);

  const notSignUps: Array<[string, RegExp]> = [
    // questions
    ['세미나 주제가 뭐예요?', /^model$/], ['세미나 참가비 있나요?', /^model$/], ['세미나 참가비 얼마예요?', /^model$/], ['세미나 참석 무료인가요?', /^model$/],
    ['세미나 참가 대상이 어떻게 되나요?', /^model$/], ['세미나 신청 마감 언제예요?', /^model$/], ['세미나 녹화본 있나요?', /^model$/],
    ['중3인데 세미나 참석 가능할까요?', /^model$/], ['고2 학부모인데 세미나 신청 가능해요?', /^model$/], ['세미나 링크 다른 사람한테 공유해도 되나요?', /^model$/],
    // a sign-up with a story or another topic
    ['세미나 신청했는데요, 혹시 겨울 프로그램은 몇 명까지 하나요?', /^model$/],
    ['안녕하세요. 10월 설명회 신청했던 학부모입니다. 겨울 프로그램 지원 마감이 언제인가요?', /^model$/],
    ['세미나 신청합니다 1:1 연구도 궁금해요', /^model$/], ['세미나 신청하고 입시 컨설팅도 받고 싶어요', /^model$/],
    ['세미나 신청합니다! 혹시 녹화본도 있나요?', /^model$/], ['세미나 신청은 괜찮아요. 겨울 프로그램 일정만 알려 주세요', /^model$/],
    // not coming, cancelling, changing → a person
    ['세미나 참석 어려울 것 같아요', /^person/], ['세미나 참석이 어렵습니다', /^person/], ['세미나 참석 힘들 것 같아요', /^person/],
    ['세미나 참석 못합니다', /^person/], ['세미나 참여 못 하게 됐어요', /^person/], ['세미나 참여 불가합니다', /^person/],
    ['세미나 참석 안 합니다', /^person/], ['세미나 신청 안 하려고요', /^person/], ['세미나 신청 캔슬할게요', /^person/], ['세미나 신청 철회합니다', /^person/],
    ['세미나 신청 빼주세요', /^person/], ['세미나 신청 취소할게요', /^person/], ['세미나 신청 안 할게요', /^person/],
    ['세미나 신청 이메일 바꿔주세요', /^person/], ['세미나 신청 정보 수정하고 싶어요', /^person/],
    // problems getting in → a person
    ['세미나 줌 접속이 안 됩니다', /^person/], ['세미나 접속 안 됨', /^person/], ['세미나 입장이 안 됐어요', /^person/],
    ['세미나 줌 비밀번호 틀렸대요', /^person/], ['세미나 링크 눌러도 아무것도 안 떠요', /^person/], ['세미나 줌 끊겼어요', /^person/],
    ['세미나 링크가 안 열려요', /^person/], ['세미나 줌 대기실에서 계속 기다리고 있어요', /^person/], ['세미나 링크 안 왔어요', /^person/],
    // about other people → a person or the model, never "접수되었어요"
    ['세미나 신청자 명단 공유 부탁드립니다', /^person/], ['세미나 참가자 연락처 알려주세요', /^person/], ['세미나 신청한 분들 연락처 주세요', /^person/],
    ['세미나 신청자 몇 명이에요?', /^(model|person)/], ['세미나 신청 현황 알려주세요', /^(model|person)/], ['김민준 학생 세미나 신청됐나요?', /^(model|person)/],
    // nothing about the seminar
    ['겨울 프로그램 신청 방법', /^model$/], ['안녕하세요', /^model$/], ['줌 링크 주세요', /^model$/],
    // questions ending in a question form or '?' — never registered
    ['세미나 신청 가능할까요?', /^model$/], ['세미나 학생도 참석 가능한가요?', /^model$/], ['세미나 학부모도 참석 가능할까요?', /^model$/],
    ['세미나에 학생도 참여 되나요?', /^model$/], ['세미나 30명 신청했어요?', /^model$/], ['세미나 엄마도 참석 가능해요?', /^model$/],
    // other sessions or times
    ['10/31 설명회 신청했어요', /^model$/], ['10월 31일 설명회 참석했어요', /^model$/], ['11월 28일 세미나 신청합니다', /^model$/], ['3시 세미나 신청합니다', /^model$/],
    // more ways to say "can't get in" or "won't come"
    ['세미나 링크를 못 받았어요', /^person/], ['줌 링크를 아직 못 받았습니다', /^person/], ['세미나 메일 못 받았어요', /^person/],
    ['세미나 줌에 들어갈 수가 없어요', /^person/], ['세미나 줌 접속이 되지 않습니다', /^person/], ['세미나 링크가 열리지 않아요', /^person/],
    ['세미나 줌 비번이 안 맞아요', /^person/], ['세미나 줌 들어가려는데 호스트가 시작 안 했다고 떠요', /^person/],
    ['세미나 참석 안 될 것 같아요', /^person/], ['세미나 참여 안될 것 같아요', /^person/], ['세미나에 참석하지 않겠습니다', /^person/],
    ['세미나 참석하지 않을게요', /^person/], ['세미나 일정이 안 맞아요', /^person/], ['세미나 참석이 곤란할 것 같아요', /^person/],
    // questions that only sound like a problem stay with the model (no 12-hour hold)
    ['세미나 몇 시간 동안 하나요?', /^model$/], ['세미나 내용이 어렵나요?', /^model$/], ['세미나 카메라 안 켜도 되나요?', /^model$/],
    ['세미나 대기실 있나요?', /^model$/], ['세미나에서 입시 실패 사례도 다루나요?', /^model$/], ['세미나 1시간이면 아이가 집중하기 힘들까요?', /^model$/],
    // more declines and day-of problems that a person must see
    ['세미나 못 볼 것 같아요', /^person/], ['이번 세미나는 패스할게요', /^person/], ['세미나 신청 삭제해 주세요', /^person/], ['저 세미나 못가요', /^person/],
    ['죄송합니다 개인 사정으로 참석이 어렵습니다', /^person/], ['토요일에 일이 있어서 못 갈 것 같아요', /^person/],
    ['소리가 안 들려요', /^person/], ['화면이 안 보여요', /^person/], ['계속 튕겨요ㅠㅠ', /^person/], ['세미나 화면이 멈춰 있어요', /^person/],
    ['세미나 링크 클릭해도 안 넘어가요', /^person/], ['아직 세미나 링크를 못 받았어요', /^person/], ['세미나 신청 연락처 고쳐주세요', /^person/],
    ['세미나 신청한 사람들 전화번호 좀 알려주세요', /^person/], ['세미나 신청 명단 좀 보여주세요', /^person/],
  ];
  for (const [m, expected] of notSignUps) assert.match(decide(m), expected, m);
});

test('KakaoTalk keyword keeps the sender\'s own contact and hands "담당자님" sign-ups to a person too', async () => {
  const { parseWebinarSignup, ruleHandoff, SIGNUP_DESPITE_HANDOFF } = await import('../src/lib/kakao/skill');
  assert.deepEqual(parseWebinarSignup('세미나 신청합니다 010-1234-5678'), { signup: true, phone: '01012345678', email: null, name: null });
  assert.deepEqual(parseWebinarSignup('세미나 신청합니다. 제 번호는 010-1234-5678입니다'), { signup: true, phone: '01012345678', email: null, name: null });
  assert.deepEqual(parseWebinarSignup('세미나 신청합니다 +82 10-1234-5678'), { signup: true, phone: '01012345678', email: null, name: null });
  assert.deepEqual(parseWebinarSignup('세미나 신청 abc123@naver.com'), { signup: true, phone: null, email: 'abc123@naver.com', name: null });
  assert.deepEqual(parseWebinarSignup('세미나 주제가 뭐예요? 010-1234-5678'), { signup: false, phone: null, email: null, name: null });
  const polite = '세미나 신청합니다. 담당자님 감사합니다';
  assert.equal(parseWebinarSignup(polite).signup, true);
  assert.ok(SIGNUP_DESPITE_HANDOFF.has(ruleHandoff(polite) ?? ''));
  assert.equal(SIGNUP_DESPITE_HANDOFF.has('request for student data'), false);
});

test('KakaoTalk webinar reply: link and passcode once complete, the office phone without a link, closed after the end', async () => {
  const { webinarKakaoReply } = await import('../src/lib/kakao/skill');
  const done = { hasName: true, hasPhone: true, friend: true };
  const base = { ...done, open: true, step: 'first' as const, label: '12월 5일(토) 오전 10시', topic: 'AI 시대, 논문은 통할까', pageUrl: 'https://criglobal.org/ko/webinar' };
  const withLink = webinarKakaoReply({ ...base, join: { url: 'https://us06web.zoom.us/j/123', passcode: '000000' } });
  assert.match(withLink, /접수/); assert.match(withLink, /zoom\.us\/j\/123/); assert.match(withLink, /암호: 000000/);
  assert.doesNotMatch(withLink, /이 채널로 한 번 더/); // reminders come from the scheduled channel message and email, not this chat
  const noLink = webinarKakaoReply({ ...base, join: null });
  // No link to give: nobody can send it into the chat room later (1:1 chat is off), so try again or call.
  assert.doesNotMatch(noLink, /zoom/); assert.match(noLink, /02-6203-8999/); assert.doesNotMatch(noLink, /담당자가|보내드릴게요/);
  assert.match(webinarKakaoReply({ ...base, step: 'again', join: null }), /이미 신청/);
  assert.match(webinarKakaoReply({ ...base, open: false, join: null }), /끝났어요/);
  assert.match(withLink, /자세한 순서: https:\/\/criglobal\.org\/ko\/webinar/);
  assert.match(webinarKakaoReply({ ...base, started: true, join: { url: 'https://us06web.zoom.us/j/1', passcode: null } }), /지금 진행 중이에요/);
  assert.doesNotMatch(webinarKakaoReply({ ...base, started: true, join: { url: 'https://us06web.zoom.us/j/1', passcode: null } }), /5분 전/);
  assert.doesNotMatch(webinarKakaoReply({ ...base, pageUrl: null, join: { url: 'https://us06web.zoom.us/j/1', passcode: null } }), /자세한 순서/); // form closed: no link to the closed panel
  assert.ok(withLink.length < 1000);
});

test('join link only from a Zoom https URL in the environment', async () => {
  const { webinarJoinInfo } = await import('../src/lib/webinar');
  const keep = { u: process.env.WEBINAR_JOIN_URL, p: process.env.WEBINAR_JOIN_PASSCODE };
  process.env.WEBINAR_JOIN_URL = 'https://us06web.zoom.us/j/84100000000?pwd=x'; process.env.WEBINAR_JOIN_PASSCODE = '1234';
  assert.deepEqual(webinarJoinInfo(), { url: 'https://us06web.zoom.us/j/84100000000?pwd=x', passcode: '1234' });
  process.env.WEBINAR_JOIN_URL = 'https://evil.example/zoom.us/j/1';
  assert.equal(webinarJoinInfo(), null);
  delete process.env.WEBINAR_JOIN_URL;
  assert.equal(webinarJoinInfo(), null);
  if (keep.u) process.env.WEBINAR_JOIN_URL = keep.u; if (keep.p) process.env.WEBINAR_JOIN_PASSCODE = keep.p; else delete process.env.WEBINAR_JOIN_PASSCODE;
});

test('returning sign-ups are matched on any one contact', async () => {
  const { webinarContactKeys } = await import('../src/lib/webinar');
  assert.deepEqual(webinarContactKeys({ email: 'A@b.co', phone: '010-1234-5678', kakaoId: '' }), ['email:a@b.co', 'phone:01012345678']);
  assert.deepEqual(webinarContactKeys({ dedupeKey: 'kakaobot:bk-1' }), ['kakaobot:bk-1']);
  assert.deepEqual(webinarContactKeys({ phone: '+82 10-1234-5678' }), ['phone:01012345678']); // autofill vs typed
  assert.deepEqual(webinarContactKeys({ kakaoId: '없음' }), []);   // placeholder text joins nobody
  assert.deepEqual(webinarContactKeys({ kakaoId: '-' }), []);
  assert.deepEqual(webinarContactKeys({ kakaoId: '@MinjunMom' }), ['kakao:minjunmom']);
});

test('KakaoTalk keeps giving the link until the session ends; the website form closes at the start', async () => {
  const { webinarKakaoOpen, webinarRegistrationOpen } = await import('../src/lib/webinar');
  assert.equal(webinarRegistrationOpen(new Date('2026-12-05T01:05:00Z')), false); // 10:05 KST: form closed
  assert.equal(webinarKakaoOpen(new Date('2026-12-05T01:05:00Z')), true);         // ...but the keyword still works
  assert.equal(webinarKakaoOpen(new Date('2026-12-05T01:59:00Z')), true);         // 10:59 KST
  assert.equal(webinarKakaoOpen(new Date('2026-12-05T02:00:00Z')), false);        // 11:00 KST: session over
});


test('the seminar morning: replies that send someone to a person also point to the keyword', async () => {
  const { webinarDayOf } = await import('../src/lib/webinar');
  assert.equal(webinarDayOf(new Date('2026-12-04T15:00:00Z')), false); // 12/5 00:00 KST
  assert.equal(webinarDayOf(new Date('2026-12-04T19:00:00Z')), true);  // 04:00 KST, six hours before
  assert.equal(webinarDayOf(new Date('2026-12-05T01:30:00Z')), true);  // 10:30 KST
  assert.equal(webinarDayOf(new Date('2026-12-05T02:00:00Z')), false); // 11:00 KST
});

test('KakaoTalk rules stay fast on long messages', async () => {
  const { ruleHandoff, parseWebinarSignup } = await import('../src/lib/kakao/skill');
  for (const m of ['학생' + ' '.repeat(1496) + 'x', '학부모' + '\n'.repeat(1490) + 'x', '신청한 분' + ' '.repeat(1490) + 'x', '세미나' + 'a'.repeat(1497)]) {
    const t = performance.now();
    ruleHandoff(m); parseWebinarSignup(m);
    assert.ok(performance.now() - t < 50, `${m.slice(0, 6)}… took ${performance.now() - t} ms`);
  }
});

test('phone numbers: Korean mobiles for KakaoTalk friend groups', async () => {
  const { koreanMobile } = await import('../src/lib/webinar');
  assert.equal(koreanMobile('010-1234-5678'), '01012345678');
  assert.equal(koreanMobile('+82 10-1234-5678'), '01012345678');
  assert.equal(koreanMobile('011 234 5678'), '0112345678');
  assert.equal(koreanMobile('02-6203-8999'), null);      // landline
  assert.equal(koreanMobile('+1 (213) 555-0100'), null); // overseas
  assert.equal(koreanMobile(''), null);
});

test('people without a number are asked once more: 7 days after signing up or at phoneAskAt, never in the last day', async () => {
  const { webinarPhoneAskAt } = await import('../src/lib/webinar');
  const kst = (s: string) => new Date(`${s}+09:00`);
  assert.equal(webinarPhoneAskAt(kst('2026-11-24T13:00:00'))?.toISOString(), kst('2026-12-01T10:00:00').toISOString()); // phoneAskAt comes first
  assert.equal(webinarPhoneAskAt(kst('2026-11-20T09:00:00'))?.toISOString(), kst('2026-11-27T10:00:00').toISOString()); // a week after
  assert.equal(webinarPhoneAskAt(kst('2026-12-02T09:00:00'))?.toISOString(), kst('2026-12-03T10:00:00').toISOString()); // late: next morning
  assert.equal(webinarPhoneAskAt(kst('2026-12-03T11:00:00')), null); // would land on the seminar day: reminders cover it
});

test('email reminders: 19:00 the evening before and 30 minutes before the start', async () => {
  const { webinarReminderTimes, sameKstDay } = await import('../src/lib/webinar');
  const { dayBefore, soon } = webinarReminderTimes();
  assert.equal(dayBefore.toISOString(), '2026-12-04T10:00:00.000Z'); // 19:00 KST
  assert.equal(soon.toISOString(), '2026-12-05T00:30:00.000Z');      // 09:30 KST
  assert.equal(sameKstDay(new Date('2026-12-04T15:30:00Z'), new Date('2026-12-05T00:30:00Z')), true); // 00:30 and 09:30 KST on 12/5
});

test('KakaoTalk: a message that is just a number is recognised; a sign-up with a number is not "just a number"', async () => {
  const { parsePhoneOnly } = await import('../src/lib/kakao/skill');
  assert.equal(parsePhoneOnly('010-1234-5678'), '01012345678');
  assert.equal(parsePhoneOnly('제 번호는 010 1234 5678 입니다'), '01012345678');
  assert.equal(parsePhoneOnly('네 01012345678'), '01012345678');
  assert.equal(parsePhoneOnly('+82 10-1234-5678'), '01012345678');
  assert.equal(parsePhoneOnly('세미나 신청 010-1234-5678'), null);
  assert.equal(parsePhoneOnly('010-1234-5678로 전화 주세요'), null);
  assert.equal(parsePhoneOnly('세미나 주제가 뭐예요?'), null);
  // natural answers to "send your number"
  for (const m of ['김서연 010-1234-5678', '010-1234-5678 김서연입니다', '서연맘 010-1234-5678', '학부모 010-1234-5678', '김서연 엄마 010-1234-5678', '네네 010-1234-5678', '넵넵 010-1234-5678', '알겠습니다 010-1234-5678', '010-1234-5678로 보내주세요', '010-1234-5678 이 번호로 알림 부탁드려요', '번호 남겨요 010-1234-5678', '010-1234-5678 저장 부탁드립니다'])
    assert.equal(parsePhoneOnly(m), '01012345678', m);
  // not a Korean mobile, or more than a number
  for (const m of ['+1 213 555 0100', '02-1234-5678', '010-1234-5678 취소할게요', '세미나 010-1234-5678', '010-1234-5678 겨울 프로그램 문의드려요'])
    assert.equal(parsePhoneOnly(m), null, m);
});

test('KakaoTalk: no join link until the sign-up has a name, a number and the channel add', async () => {
  const { webinarKakaoReply, webinarChannelCard, kakaoSignupComplete, textResponse } = await import('../src/lib/kakao/skill');
  const join = { url: 'https://us06web.zoom.us/j/1', passcode: '000000' };
  const base = { open: true, label: '12월 5일(토) 오전 10시', topic: 'AI 시대, 논문은 통할까', join, pageUrl: null, noticesOpen: true };
  const steps = ['first', 'again', 'saved'] as const;
  for (const step of steps) for (const started of [true, false]) for (const hasName of [true, false]) for (const hasPhone of [true, false]) for (const friend of [true, false]) {
    const state = { hasName, hasPhone, friend };
    const at = JSON.stringify({ step, started, ...state });
    // The route only passes a join link for a complete sign-up; a reply must never show one otherwise even if given.
    const reply = webinarKakaoReply({ ...base, ...state, step, started, join: kakaoSignupComplete(state) ? join : null });
    const card = webinarChannelCard({ friend, open: true });
    if (kakaoSignupComplete(state)) assert.match(reply, /zoom\.us/, at);
    else assert.doesNotMatch(reply, /zoom\.us|암호/, at);
    if (!hasName && !hasPhone) assert.match(reply, /이름과 휴대폰 번호를 한 줄로/, at);
    else if (!hasName) assert.match(reply, /이름도 보내 주세요/, at);
    else if (!hasPhone) assert.match(reply, /휴대폰 번호도 보내 주세요/, at);
    if (!hasName || !hasPhone) assert.match(reply, /세미나 안내와 알림에만 사용/, at); // what the data is for, every time it is asked
    if (!friend) { assert.match(reply, /아래 ‘채널 추가하기’/, at); assert.ok(card, at); } else assert.equal(card, null, at);
    assert.doesNotMatch(reply, /채팅방 위/, at); // Kakao documents no add bar at the top of the chat room
    assert.ok(reply.length < 1000, at);
    assert.equal(textResponse(reply, [], card ? [card] : []).template.outputs.length, card ? 2 : 1, at);
  }
  // Complete but not a friend: one last step, then the keyword again.
  assert.match(webinarKakaoReply({ ...base, hasName: true, hasPhone: true, friend: false, step: 'saved', join: null }), /마지막 단계[\s\S]*‘세미나 신청’이라고 다시/);
  assert.match(webinarChannelCard({ friend: false, open: true })!.textCard.description!, /채널을 추가한 분께/);
  assert.equal(webinarChannelCard({ friend: false, open: false }), null);
  // Notices are promised only before the friend-group cutoff and never during the session.
  const done = { ...base, hasName: true, hasPhone: true, friend: true, step: 'saved' as const };
  assert.match(webinarKakaoReply(done), /카톡 알림도/);
  assert.doesNotMatch(webinarKakaoReply({ ...done, noticesOpen: false }), /카톡 알림/);
  assert.doesNotMatch(webinarKakaoReply({ ...done, started: true }), /카톡 알림/);
});

test('KakaoTalk: names sent with or without the number', async () => {
  const { parseContactOnly, parseNameOnly, parseWebinarSignup, kakaoHasName, KAKAO_NO_NAME } = await import('../src/lib/kakao/skill');
  assert.deepEqual(parseContactOnly('홍길동 010-1234-5678'), { phone: '01012345678', name: '홍길동' });
  assert.deepEqual(parseContactOnly('남궁민수 01012345678'), { phone: '01012345678', name: '남궁민수' });
  assert.deepEqual(parseContactOnly('고1 김서연 010-1234-5678'), { phone: '01012345678', name: '김서연' });
  assert.deepEqual(parseContactOnly('김서연 학생 010-1234-5678'), { phone: '01012345678', name: '김서연' });
  for (const m of ['010-1234-5678', '학부모 연락처 010-1234-5678', '네 010-1234-5678', '엄마 010-1234-5678'])
    assert.equal(parseContactOnly(m)?.name, null, m);
  assert.deepEqual(parseWebinarSignup('세미나 신청 홍길동 010-1234-5678'), { signup: true, phone: '01012345678', email: null, name: '홍길동' });
  assert.equal(parseWebinarSignup('세미나 신청').name, null);
  assert.equal(parseWebinarSignup('세미나 신청할게요 010-1234-5678').name, null);
  for (const [m, name] of [['김서연', '김서연'], ['김서연입니다', '김서연'], ['이름은 김서연이에요', '김서연'], ['네 김서연이요', '김서연'], ['박서아', '박서아']] as const)
    assert.equal(parseNameOnly(m), name, m);
  for (const m of ['감사합니다', '알겠어요', '네', '궁금해요', '추가했어요', '채널 추가했습니다', '언제 해요?', '세미나 신청', '할게요', '김서연 010-1234-5678', 'ㅇㅇ'])
    assert.equal(parseNameOnly(m), null, m);
  assert.equal(kakaoHasName(KAKAO_NO_NAME), false);
  assert.equal(kakaoHasName('홍길동'), true);
});

test('the add-a-number link is signed per sign-up', async () => {
  process.env.NEXTAUTH_SECRET ||= 'test-secret';
  const { webinarPhoneToken, webinarPhoneTokenValid, webinarPhoneLink } = await import('../src/lib/webinar-phone');
  const token = webinarPhoneToken('reg_1');
  assert.equal(webinarPhoneTokenValid('reg_1', token), true);
  assert.equal(webinarPhoneTokenValid('reg_2', token), false);
  assert.equal(webinarPhoneTokenValid('reg_1', token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A')), false);
  assert.equal(webinarPhoneTokenValid('reg_1', ''), false);
  assert.match(webinarPhoneLink('https://criglobal.org/', 'reg_1'), /^https:\/\/criglobal\.org\/webinar\/phone\?r=reg_1&t=/);
});

test('KakaoTalk notices stop being promised at the friend-group cutoff', async () => {
  const { webinarKakaoNoticesOpen } = await import('../src/lib/webinar');
  assert.equal(webinarKakaoNoticesOpen(new Date('2026-12-04T02:59:00Z')), true);  // 11:59 KST on 12/4
  assert.equal(webinarKakaoNoticesOpen(new Date('2026-12-04T03:00:00Z')), false); // 12:00 KST
});

test('number replies: opt-outs, questions and other people\'s numbers are not saved; names with a grade are', async () => {
  const { parsePhoneOnly, ruleHandoff, withoutOwnContact, phoneWithoutSignupReply } = await import('../src/lib/kakao/skill');
  const { koreanMobile } = await import('../src/lib/webinar');
  for (const m of ['수신거부 010-1234-5678', '010-1234-5678 수신거부요', '010-1234-5678 알림 그만 받을게요', '010-1234-5678 알림 안 받을게요', '010-1234-5678 번호 지워 주세요', '010-1234-5678 삭제요',
    '이거 누구 번호예요? 010-1234-5678', '010-1234-5678 누구세요?', '번호 010-1234-5678 틀렸어요', '제 번호 010-1234-5678 아니에요', '010-1234-5678 친구 번호예요', '010-123-5678', '010-1234-5678 카톡 안 와요', '010-1234-5678 알림이 안 왔어요', '010-1234-5678 확인 부탁드려요'])
    assert.equal(parsePhoneOnly(m), null, m);
  for (const m of ['안지현 010-1234-5678', '김서연 학생 010-1234-5678', '김서연 학생 엄마 010-1234-5678', '고1 김서연 010-1234-5678', '중3 서연맘 010-1234-5678', '학부모 연락처 010-1234-5678', '학부모님 연락처입니다 010-1234-5678'])
    assert.equal(parsePhoneOnly(m), '01012345678', m);
  // the route checks the handoff rules on the text without the sender's own number and its label
  assert.equal(ruleHandoff(withoutOwnContact('학부모 연락처 010-1234-5678')), null);
  assert.equal(koreanMobile('010-123-5678'), null); // 010 has 11 digits
  assert.equal(koreanMobile('011-234-5678'), '0112345678');
  assert.match(phoneWithoutSignupReply(), /세미나 신청 홍길동 010-1234-5678/);
  const t = performance.now();
  parsePhoneOnly('제' + ' '.repeat(1485) + '010-1234-5678');
  assert.ok(performance.now() - t < 50, 'parsePhoneOnly on a long run of spaces');
});

test('the follow-up ask comes at least a day before the friend-group list closes', async () => {
  const { webinarPhoneAskAt } = await import('../src/lib/webinar');
  const kst = (s: string) => new Date(`${s}+09:00`);
  assert.equal(webinarPhoneAskAt(kst('2026-12-02T09:00:00'))?.toISOString(), kst('2026-12-03T10:00:00').toISOString());
  assert.equal(webinarPhoneAskAt(kst('2026-12-02T11:00:00')), null); // would land on 12/4 10:00, two hours before the cutoff
});
