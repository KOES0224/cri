import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newPaymentLinkOrderId, newPaymentLinkToken, parseWonAmount, paymentLinkOrderName, validPaymentLinkOrderId, validPaymentLinkToken} from '../src/lib/payment-links';

test('link tokens are 24 random characters and nothing else passes as one', () => {
  const tokens = new Set(Array.from({length: 200}, () => newPaymentLinkToken()));
  assert.equal(tokens.size, 200);
  for (const token of tokens) assert.ok(validPaymentLinkToken(token), token);
  for (const bad of ['', 'short', 'a'.repeat(23), 'a'.repeat(25), `${'a'.repeat(23)}-`, '../../etc/passwd', null, 7]) assert.equal(validPaymentLinkToken(bad), false);
});

test('order ids fit Toss (6 to 64 of [A-Za-z0-9_-]) and are new for every attempt', () => {
  const a = newPaymentLinkOrderId(), b = newPaymentLinkOrderId();
  assert.notEqual(a, b);
  for (const id of [a, b]) { assert.ok(validPaymentLinkOrderId(id)); assert.match(id, /^[A-Za-z0-9_-]{6,64}$/); }
  for (const bad of ['CRI_PAY_', 'CRI_REVIEW_3f2b8c1e0d4a4b7e9c551a2b3c4d5e6f', `CRI_PAY_${'0'.repeat(31)}`, null]) assert.equal(validPaymentLinkOrderId(bad), false);
});

test('admin-typed won amounts', () => {
  assert.equal(parseWonAmount('11,475,750'), 11475750);
  assert.equal(parseWonAmount('11475750원'), 11475750);
  assert.equal(parseWonAmount(' ₩ 11 475 750 '), 11475750);
  for (const bad of ['', '999', '100000001', '1.5', '-5000', 'abc', '1e7']) assert.equal(parseWonAmount(bad), null, bad);
});

test('order name carries the student, with a default purpose', () => {
  assert.equal(paymentLinkOrderName('김태웅', ''), 'CRI 프로그램 비용 (학생: 김태웅)');
  assert.equal(paymentLinkOrderName(' 김태웅 ', '겨울 프로그램 잔금'), '겨울 프로그램 잔금 (학생: 김태웅)');
  assert.ok(paymentLinkOrderName('x', 'y'.repeat(200)).length <= 100);
});
