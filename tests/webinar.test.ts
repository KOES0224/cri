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
  for (const m of ['세미나 신청', '세미나신청', '세미나 신청할게요', '웨비나 신청합니다', '세미나 링크 주세요', '설명회 참가 신청', '세미나 zoom 주소']) assert.equal(isWebinarSignupMessage(m), true, m);
  for (const m of ['세미나 주제가 뭐예요?', '겨울 프로그램 신청 방법', '안녕하세요']) assert.equal(isWebinarSignupMessage(m), false, m);
  // Cancelling goes to a person first: the route checks ruleHandoff before the keyword.
  assert.ok(ruleHandoff('세미나 신청 취소할게요'));
});

test('KakaoTalk webinar reply: link and passcode when set, a promise otherwise, closed after the start', async () => {
  const { webinarKakaoReply } = await import('../src/lib/kakao/skill');
  const base = { open: true, already: false, label: '12월 5일(토) 오전 10시', topic: 'AI 시대, 논문은 통할까', pageUrl: 'https://criglobal.org/ko/webinar' };
  const withLink = webinarKakaoReply({ ...base, join: { url: 'https://us06web.zoom.us/j/123', passcode: '000000' } });
  assert.match(withLink, /접수/); assert.match(withLink, /zoom\.us\/j\/123/); assert.match(withLink, /암호: 000000/);
  const noLink = webinarKakaoReply({ ...base, join: null });
  assert.doesNotMatch(noLink, /zoom/); assert.match(noLink, /전날/);
  assert.match(webinarKakaoReply({ ...base, already: true, join: null }), /이미 신청/);
  assert.match(webinarKakaoReply({ ...base, open: false, join: null }), /마감/);
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
});
