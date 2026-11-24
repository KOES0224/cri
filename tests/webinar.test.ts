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
  assert.equal(webinarBannerVisible(new Date('2026-12-05T14:59:00Z')), true);   // 23:59 KST on the day
  assert.equal(webinarBannerVisible(new Date('2026-12-05T15:00:00Z')), false);  // midnight KST → gone
});

test('KakaoTalk keyword: seminar sign-up variants are caught, plain questions are not', async () => {
  const { isWebinarSignupMessage, ruleHandoff } = await import('../src/lib/kakao/skill');
  for (const m of ['세미나 신청', '세미나신청', '세미나 신청할게요', '웨비나 신청합니다', '세미나 링크 주세요', '설명회 참가 신청', '세미나 zoom 주소',
    '세미나 참석 신청합니다', '세미나 참석할게요', '세미나를 신청하고 싶어요', '세미나에 참가 신청합니다', '세미나 등록할게요', '세미나 입장 링크 주세요', '세미나 신청했어요'])
    assert.equal(isWebinarSignupMessage(m), true, m);
  for (const m of ['세미나 주제가 뭐예요?', '겨울 프로그램 신청 방법', '안녕하세요',
    // questions and stories that merely mention a sign-up go to the model or a person
    '세미나 신청했는데요, 혹시 겨울 프로그램은 몇 명까지 하나요?', '안녕하세요. 10월 설명회 신청했던 학부모입니다. 겨울 프로그램 지원 마감이 언제인가요?',
    '세미나 링크가 안 열려요', '세미나 참석 못할 것 같아요', '세미나 신청 변경하고 싶어요'])
    assert.equal(isWebinarSignupMessage(m), false, m);
  // Cancelling goes to a person first: the route checks ruleHandoff before the keyword.
  assert.ok(ruleHandoff('세미나 신청 취소할게요'));
});

test('KakaoTalk webinar reply: link and passcode when set, a promise otherwise, closed after the start', async () => {
  const { webinarKakaoReply } = await import('../src/lib/kakao/skill');
  const base = { open: true, already: false, label: '12월 5일(토) 오전 10시', topic: 'AI 시대, 논문은 통할까', pageUrl: 'https://criglobal.org/ko/webinar' };
  const withLink = webinarKakaoReply({ ...base, join: { url: 'https://us06web.zoom.us/j/123', passcode: '000000' } });
  assert.match(withLink, /접수/); assert.match(withLink, /zoom\.us\/j\/123/); assert.match(withLink, /암호: 000000/);
  assert.doesNotMatch(withLink, /전날/); // no reminder promise the owner would have to keep
  const noLink = webinarKakaoReply({ ...base, join: null });
  assert.doesNotMatch(noLink, /zoom/); assert.match(noLink, /담당자/);
  assert.match(webinarKakaoReply({ ...base, already: true, join: null }), /이미 신청/);
  assert.match(webinarKakaoReply({ ...base, open: false, join: null }), /끝났어요/);
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

test('KakaoTalk: a sign-up that also asks for a person still registers; refunds and cancellations do not', async () => {
  const { SIGNUP_DESPITE_HANDOFF, ruleHandoff, isWebinarSignupMessage } = await import('../src/lib/kakao/skill');
  const polite = '세미나 신청합니다. 담당자님 감사합니다';
  assert.equal(isWebinarSignupMessage(polite), true);
  assert.ok(SIGNUP_DESPITE_HANDOFF.has(ruleHandoff(polite) ?? ''));
  const cancel = '세미나 신청 취소할게요';
  assert.equal(isWebinarSignupMessage(cancel), false);
  assert.ok(ruleHandoff(cancel) && !SIGNUP_DESPITE_HANDOFF.has(ruleHandoff(cancel)!));
});
