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
  assert.equal(WEBINAR.startsAt.toISOString(), '2026-10-31T01:00:00.000Z'); // 10:00 KST
  assert.equal(webinarRegistrationOpen(new Date('2026-10-31T00:59:00Z')), true);
  assert.equal(webinarRegistrationOpen(new Date('2026-10-31T01:00:00Z')), false);
  assert.equal(webinarBannerVisible(new Date('2026-10-31T14:59:00Z')), true);   // 23:59 KST on the day
  assert.equal(webinarBannerVisible(new Date('2026-10-31T15:00:00Z')), false);  // midnight KST → gone
});
