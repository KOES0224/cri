import {test} from 'node:test';
import assert from 'node:assert/strict';
import {endOfKoreanDay, feeCodeEffect, feeCodeLimits, feeCodeProblem, feeWithCode, koreanDay, newFeeCode, normalizeFeeCode, type FeeCodeRow} from '../src/lib/fee-code';

const now = new Date('2026-11-10T00:00:00Z');
const row = (patch: Partial<FeeCodeRow> = {}): FeeCodeRow => ({code: 'ABC-EDU', feeAmount: 0, maxUses: null, usedCount: 0, expiresAt: null, active: true, ...patch});

test('a partner code is normalised before it is looked up', () => {
  assert.equal(normalizeFeeCode('  abc-edu '), 'ABC-EDU');
  assert.equal(normalizeFeeCode('Seoul2026'), 'SEOUL2026');
  // Too short, too long, outside letters/digits/hyphens, or starting or ending with a hyphen.
  for (const bad of ['', 'abc', 'a'.repeat(33), 'abc edu', 'abc_edu', '-abcd', 'abcd-', 'abc%edu', null, undefined, 42]) assert.equal(normalizeFeeCode(bad), null);
  assert.equal(normalizeFeeCode('a'.repeat(32)), 'A'.repeat(32));
  assert.equal(normalizeFeeCode('ab12'), 'AB12');
});

test('a code works only while it is active, unexpired and has uses left', () => {
  assert.equal(feeCodeProblem(null, now), 'invalid');
  assert.equal(feeCodeProblem(undefined, now), 'invalid');
  assert.equal(feeCodeProblem(row(), now), null);
  assert.equal(feeCodeProblem(row({active: false}), now), 'inactive');
  assert.equal(feeCodeProblem(row({expiresAt: new Date(now.getTime() - 1)}), now), 'expired');
  assert.equal(feeCodeProblem(row({expiresAt: now}), now), 'expired');
  assert.equal(feeCodeProblem(row({expiresAt: new Date(now.getTime() + 1)}), now), null);
  assert.equal(feeCodeProblem(row({maxUses: 3, usedCount: 2}), now), null);
  assert.equal(feeCodeProblem(row({maxUses: 3, usedCount: 3}), now), 'usedUp');
  assert.equal(feeCodeProblem(row({maxUses: 0}), now), 'usedUp');
});

test('the fee with a code is never negative and never above the normal fee', () => {
  assert.equal(feeWithCode({feeAmount: 0}, 50), 0);
  assert.equal(feeWithCode({feeAmount: 20}, 50), 20);
  assert.equal(feeWithCode({feeAmount: 50}, 50), 50);
  assert.equal(feeWithCode({feeAmount: 80}, 50), 50);
  assert.equal(feeWithCode({feeAmount: -5}, 50), 0);
  assert.equal(feeWithCode({feeAmount: 12.5}, 50), 50);
  assert.equal(feeCodeEffect({feeAmount: 0}, 50), 'Fee waived');
  assert.equal(feeCodeEffect({feeAmount: 20}, 50), '$20 USD (normally $50 USD)');
  assert.equal(feeCodeEffect({feeAmount: 50}, 50), 'No discount ($50 USD)');
});

test('the last valid day is a calendar day in Korea and must be a real one', () => {
  assert.equal(endOfKoreanDay('2026-12-31')?.toISOString(), '2026-12-31T14:59:59.000Z');
  assert.equal(koreanDay(new Date('2026-12-31T14:59:59Z')), '2026-12-31');
  // 00:30 on 1 January in Korea is still 31 December in UTC.
  assert.equal(koreanDay(new Date('2026-12-31T15:30:00Z')), '2027-01-01');
  for (const bad of ['', 'tomorrow', '2027-02-30', '2027-13-01', '2027-1-5', '2027-02-29']) assert.equal(endOfKoreanDay(bad), null, bad);
  assert.equal(endOfKoreanDay('2028-02-29')?.toISOString(), '2028-02-29T14:59:59.000Z');
});

test('limits on a code: empty means none, and a last valid day that has passed is refused', () => {
  // now is 09:00 on 10 November 2026 in Korea.
  assert.deepEqual(feeCodeLimits({}, now), {maxUses: null, expiresAt: null});
  assert.deepEqual(feeCodeLimits({maxUses: ' 20 ', lastValidDay: '2026-11-10'}, now), {maxUses: 20, expiresAt: new Date('2026-11-10T14:59:59Z')});
  assert.deepEqual(feeCodeLimits({maxUses: 3}, now), {maxUses: 3, expiresAt: null});
  for (const maxUses of ['0', '-1', '1.5', 'many', '100001']) assert.ok('error' in feeCodeLimits({maxUses}, now), maxUses);
  assert.match((feeCodeLimits({lastValidDay: '2026-11-09'}, now) as {error: string}).error, /already passed/);
  assert.match((feeCodeLimits({lastValidDay: '2027-02-30'}, now) as {error: string}).error, /not a valid date/);
});

test('a new code: the waived-or-reduced choice decides the amount, and every field is checked', () => {
  assert.deepEqual(newFeeCode({code: ' abc-edu ', partner: ' ABC Education ', kind: 'waive', feeAmount: '30', note: ''}, 50, now), {data: {code: 'ABC-EDU', partner: 'ABC Education', feeAmount: 0, maxUses: null, expiresAt: null, note: null}});
  assert.deepEqual(newFeeCode({code: 'ABC-20', partner: 'ABC', kind: 'reduce', feeAmount: 20, maxUses: 5, lastValidDay: '2027-02-28', note: 'Spring'}, 50, now), {data: {code: 'ABC-20', partner: 'ABC', feeAmount: 20, maxUses: 5, expiresAt: new Date('2027-02-28T14:59:59Z'), note: 'Spring'}});
  const refused = [
    {code: 'ABC-EDU', partner: 'ABC'}, {code: 'ABC-EDU', partner: 'ABC', kind: 'free'},
    {code: 'ABC-EDU', partner: 'ABC', kind: 'reduce'}, {code: 'ABC-EDU', partner: 'ABC', kind: 'reduce', feeAmount: '0'}, {code: 'ABC-EDU', partner: 'ABC', kind: 'reduce', feeAmount: '50'},
    {code: 'ABC-EDU', partner: 'ABC', kind: 'reduce', feeAmount: '12.5'}, {code: 'ab', partner: 'ABC', kind: 'waive'}, {code: 'ABC-EDU', partner: ' ', kind: 'waive'},
    {code: 'ABC-EDU', partner: 'ABC', kind: 'waive', maxUses: '0'}, {code: 'ABC-EDU', partner: 'ABC', kind: 'waive', lastValidDay: '2026-11-01'},
  ];
  for (const input of refused) assert.ok('error' in newFeeCode(input, 50, now), JSON.stringify(input));
});
