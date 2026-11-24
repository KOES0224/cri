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
  const { parseWebinarSignup, ruleHandoff, SIGNUP_DESPITE_HANDOFF } = await import('../src/lib/kakao/skill');
  const decide = (m: string) => {
    const reason = ruleHandoff(m);
    const p = parseWebinarSignup(m);
    return p.signup && (!reason || SIGNUP_DESPITE_HANDOFF.has(reason)) ? 'canned' : reason ? `person:${reason}` : 'model';
  };
  const signUps = [
    '세미나 신청', '세미나신청', '세미나 신청할게요', '세미나 신청 할께요', '웨비나 신청합니다', '설명회 참가 신청', '세미나 참석 신청합니다',
    '세미나 참석할게요', '세미나를 신청하고 싶어요', '세미나에 참가 신청합니다', '세미나 등록할게요', '세미나 신청했어요', '세미나 신청이요',
    '세미나 신청요~', '세미나 신청!!', '세미나 신청 😊', '세미나도 신청할게요', '세미나는 신청할게요', '세미나, 신청합니다', '세미나 1명 신청합니다',
    '세미나 학부모 신청합니다', '세미나 신청하고 싶은데요', '세미나 참석하고 싶은데요', '세미나 신청하려는데요', '세미나 링크 주세요',
    '세미나 링크 부탁드려요', '세미나 줌 주소 알려주세요', '세미나 입장 링크 주세요', '세미나 zoom 링크 보내주세요', '세미나 신청 가능할까요?',
    '안녕하세요. 12월 5일 토요일 오전 10시 세미나 신청합니다. 감사합니다.', '안녕하세요 세미나 신청합니다', '세미나 신청합니다 감사합니다',
    '네 세미나 신청할게요', '저도 세미나 신청할게요', '세미나 신청 부탁드립니다', '세미나 참여 희망합니다', '세미나 신청합니다ㅎㅎ', '12/5 세미나 신청합니다',
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
  ];
  for (const [m, expected] of notSignUps) assert.match(decide(m), expected, m);
});

test('KakaoTalk keyword keeps the sender\'s own contact and hands "담당자님" sign-ups to a person too', async () => {
  const { parseWebinarSignup, ruleHandoff, SIGNUP_DESPITE_HANDOFF } = await import('../src/lib/kakao/skill');
  assert.deepEqual(parseWebinarSignup('세미나 신청합니다 010-1234-5678'), { signup: true, phone: '01012345678', email: null });
  assert.deepEqual(parseWebinarSignup('세미나 신청합니다. 제 번호는 010-1234-5678입니다'), { signup: true, phone: '01012345678', email: null });
  assert.deepEqual(parseWebinarSignup('세미나 신청합니다 +82 10-1234-5678'), { signup: true, phone: '01012345678', email: null });
  assert.deepEqual(parseWebinarSignup('세미나 신청 abc123@naver.com'), { signup: true, phone: null, email: 'abc123@naver.com' });
  assert.deepEqual(parseWebinarSignup('세미나 주제가 뭐예요? 010-1234-5678'), { signup: false, phone: null, email: null });
  const polite = '세미나 신청합니다. 담당자님 감사합니다';
  assert.equal(parseWebinarSignup(polite).signup, true);
  assert.ok(SIGNUP_DESPITE_HANDOFF.has(ruleHandoff(polite) ?? ''));
  assert.equal(SIGNUP_DESPITE_HANDOFF.has('request for student data'), false);
});

test('KakaoTalk webinar reply: link and passcode when set, the office phone otherwise, closed after the start', async () => {
  const { webinarKakaoReply } = await import('../src/lib/kakao/skill');
  const base = { open: true, already: false, label: '12월 5일(토) 오전 10시', topic: 'AI 시대, 논문은 통할까', pageUrl: 'https://criglobal.org/ko/webinar' };
  const withLink = webinarKakaoReply({ ...base, join: { url: 'https://us06web.zoom.us/j/123', passcode: '000000' } });
  assert.match(withLink, /접수/); assert.match(withLink, /zoom\.us\/j\/123/); assert.match(withLink, /암호: 000000/);
  assert.doesNotMatch(withLink, /전날/); // no reminder promise the owner would have to keep
  const noLink = webinarKakaoReply({ ...base, join: null });
  // No link to give: nobody can send it into the chat room later (1:1 chat is off), so try again or call.
  assert.doesNotMatch(noLink, /zoom/); assert.match(noLink, /02-6203-8999/); assert.doesNotMatch(noLink, /담당자가|보내드릴게요/);
  assert.match(webinarKakaoReply({ ...base, already: true, join: null }), /이미 신청/);
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
