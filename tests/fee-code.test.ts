import {test} from 'node:test';
import assert from 'node:assert/strict';
import {feeCodeEffect, feeCodeProblem, feeWithCode, normalizeFeeCode, type FeeCodeRow} from '../src/lib/fee-code';

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
