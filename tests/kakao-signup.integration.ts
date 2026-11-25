/**
 * The KakaoTalk seminar sign-up through the real route and a real database: name, number and channel add come first,
 * the Zoom link last. Run only against a disposable local PostgreSQL database with the current schema.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';

const url = new URL(process.env.DATABASE_URL || 'http://missing');
if (!['127.0.0.1', 'localhost'].includes(url.hostname)) throw new Error('Integration tests require a disposable LOCAL database.');

process.env.KAKAO_SKILL_SECRET = 'test-secret';
process.env.WEBINAR_JOIN_URL = 'https://us06web.zoom.us/j/123456';
process.env.WEBINAR_JOIN_PASSCODE = '000000';
delete process.env.KAKAO_BOT_ID;
delete process.env.ANTHROPIC_API_KEY;
delete process.env.RESEND_API_KEY;

// next/server's after() needs a Next request scope: run the work right away and wait for it before the next turn.
const pending: Promise<unknown>[] = [];
require.cache[require.resolve('next/server')] = {
  exports: {
    after: (fn: () => unknown) => { pending.push(Promise.resolve().then(fn)); },
    NextResponse: { json: (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init) },
  },
} as never;

const { prisma: db } = require('../src/lib/prisma') as { prisma: PrismaClient };
const { POST } = require('../src/app/api/kakao/skill/route');
const { WEBINAR, KAKAO_BOT_DEDUPE_PREFIX } = require('../src/lib/webinar');

type Out = { simpleText?: { text: string }; textCard?: { description?: string } };

async function send(userKey: string, utterance: string, friend: boolean): Promise<{ text: string; card: boolean }> {
  const body = { userRequest: { utterance, user: { id: userKey, properties: { botUserKey: userKey, ...(friend ? { isFriend: true } : {}) } } }, bot: { id: 'bot' } };
  const res: Response = await POST(new Request('http://localhost/api/kakao/skill', { method: 'POST', headers: { 'content-type': 'application/json', 'x-cri-kakao-secret': 'test-secret' }, body: JSON.stringify(body) }));
  await Promise.all(pending.splice(0));
  const json = await res.json() as { template: { outputs: Out[] } };
  return { text: json.template.outputs.map(o => o.simpleText?.text ?? '').join('\n'), card: json.template.outputs.some(o => o.textCard) };
}

const row = (userKey: string) => db.webinarRegistration.findUnique({ where: { webinarKey_dedupeKey: { webinarKey: WEBINAR.key, dedupeKey: `${KAKAO_BOT_DEDUPE_PREFIX}${userKey}` } } });

test('KakaoTalk sign-up: no link until name, number and channel add; then the link', { skip: new Date() >= new Date(WEBINAR.startsAt.getTime() + WEBINAR.durationMinutes * 60_000) }, async () => {
  const a = `qa-a-${randomUUID()}`, b = `qa-b-${randomUUID()}`, c = `qa-c-${randomUUID()}`;
  try {
    // A: not a friend, sends things one at a time.
    let r = await send(a, '세미나 신청', false);
    assert.match(r.text, /이름과 휴대폰 번호를 한 줄로/); assert.doesNotMatch(r.text, /zoom/); assert.ok(r.card);
    assert.equal((await row(a))?.name, '카카오톡 채널');
    r = await send(a, '010-1234-5678', false);
    assert.match(r.text, /이름도 보내 주세요/); assert.doesNotMatch(r.text, /zoom/);
    assert.equal((await row(a))?.phone, '01012345678');
    r = await send(a, '김서연입니다', false);
    assert.match(r.text, /마지막 단계/); assert.doesNotMatch(r.text, /zoom/); assert.ok(r.card);
    assert.equal((await row(a))?.name, '김서연');
    // After adding the channel, the keyword again gives the link.
    r = await send(a, '세미나 신청', true);
    assert.match(r.text, /zoom\.us\/j\/123456/); assert.match(r.text, /암호: 000000/); assert.equal(r.card, false);

    // B: already a friend, everything in one message.
    r = await send(b, '세미나 신청 홍길동 010-9876-5432', true);
    assert.match(r.text, /zoom\.us/);
    const rb = await row(b);
    assert.equal(rb?.name, '홍길동'); assert.equal(rb?.phone, '01098765432');

    // C: a friend who sends name and number after the keyword.
    r = await send(c, '세미나 신청', true);
    assert.doesNotMatch(r.text, /zoom/); assert.equal(r.card, false);
    r = await send(c, '박서아 010-5555-6666', true);
    assert.match(r.text, /zoom\.us/);
    // A name is only read as a name right after the bot asked for one: a later "감사합니다" changes nothing.
    r = await send(c, '감사합니다', true);
    assert.equal((await row(c))?.name, '박서아');

    // A number before any sign-up: how to do both at once, nothing saved.
    const d = `qa-d-${randomUUID()}`;
    r = await send(d, '010-1111-2222', false);
    assert.match(r.text, /세미나 신청 홍길동 010-1234-5678/);
    assert.equal(await row(d), null);
  } finally {
    const keys = [a, b, c].map(k => `${KAKAO_BOT_DEDUPE_PREFIX}${k}`);
    await db.webinarRegistration.deleteMany({ where: { dedupeKey: { in: keys } } });
    await db.kakaoChatMessage.deleteMany({ where: { userKey: { startsWith: 'qa-' } } });
  }
});
