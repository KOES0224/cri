import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkoutLocksForm, checkoutLocksFormNow, confirmRefusalIsFinal, confirmSaysNoPayment, nextCheckoutStep, type CheckoutRow} from '../src/lib/checkout-policy';

const now = new Date('2026-11-09T05:00:00Z');
const charge = {amount: 50, currency: 'USD'};
const row = (patch: Partial<CheckoutRow> = {}): CheckoutRow => ({id: 'CRI_a', status: 'PENDING', paymentKey: null, keyTracked: true, amount: 50, currency: 'USD', expiresAt: new Date(now.getTime() + 60_000), ...patch});
const step = (r: CheckoutRow | null, patch: Partial<Parameters<typeof nextCheckoutStep>[1]> = {}) => nextCheckoutStep(r, {unchanged: true, charge, now, keyState: null, ...patch});

test('a tracked checkout that never reached the provider is always replaced by a fresh order', () => {
  assert.equal(step(null), 'create');
  // No payment key on a tracked row means no confirm was ever sent: nothing was charged, whatever else is true.
  assert.equal(step(row()), 'replace');
  assert.equal(step(row(), {unchanged: false}), 'replace');
  assert.equal(step(row({expiresAt: new Date(now.getTime() - 1)})), 'replace');
  assert.equal(step(row({amount: 70})), 'replace');
  assert.equal(step(row({currency: 'KRW'})), 'replace');
  assert.equal(step(row({status: 'COMPLETED'})), 'completed');
});

test('a row from before payment keys were stored is never replaced on a guess', () => {
  const legacy = (patch: Partial<CheckoutRow> = {}) => row({keyTracked: false, ...patch});
  assert.equal(step(legacy()), 'reuse');
  assert.equal(step(legacy(), {unchanged: false}), 'review');
  assert.equal(step(legacy({expiresAt: new Date(now.getTime() - 1)})), 'review');
  assert.equal(step(legacy({expiresAt: now})), 'review');
  assert.equal(step(legacy({amount: 70})), 'review');
  assert.equal(step(legacy({currency: 'KRW'})), 'review');
});

test('a checkout whose payment reached the provider follows the provider record of that payment', () => {
  const keyed = row({paymentKey: 'pk1'});
  const state = (s: 'paid' | 'dead' | 'open' | 'unknown', patch: Partial<{id: string; paymentKey: string}> = {}) => ({keyState: {id: 'CRI_a', paymentKey: 'pk1', state: s, ...patch}});
  assert.equal(step(keyed, state('paid')), 'recover');
  assert.equal(step(keyed, state('dead')), 'replace');
  assert.equal(step(keyed, state('open')), 'review');
  assert.equal(step(keyed, state('unknown')), 'review');
  // Never replaced on a guess: no state read, or a state read for another row or another key.
  assert.equal(step(keyed), 'review');
  assert.equal(step(keyed, state('dead', {paymentKey: 'pk0'})), 'review');
  assert.equal(step(keyed, state('dead', {id: 'CRI_b'})), 'review');
  // Expiry, an edited form or a legacy flag do not unlock it either.
  assert.equal(step(row({paymentKey: 'pk1', expiresAt: new Date(0)}), {unchanged: false}), 'review');
  assert.equal(step(row({paymentKey: 'pk1', keyTracked: false}), state('dead')), 'replace');
  assert.equal(step(row({paymentKey: 'pk1', status: 'COMPLETED'}), state('dead')), 'completed');
});

test('the form is locked while a payment is unsettled or the row predates stored keys', () => {
  assert.equal(checkoutLocksForm(null), false);
  assert.equal(checkoutLocksForm(undefined), false);
  assert.equal(checkoutLocksForm({status: 'PENDING', paymentKey: null, keyTracked: true}), false);
  assert.equal(checkoutLocksForm({status: 'PENDING', paymentKey: 'pk1', keyTracked: true}), true);
  assert.equal(checkoutLocksForm({status: 'PENDING', paymentKey: null, keyTracked: false}), true);
  assert.equal(checkoutLocksForm({status: 'COMPLETED', paymentKey: 'pk1', keyTracked: true}), false);
});

test('only a real refusal of this attempt counts as final', () => {
  for (const code of ['REJECT_CARD_COMPANY', 'REJECT_CARD_PAYMENT', 'NOT_AVAILABLE_PAYMENT_BY_MERCHANT', 'INVALID_CARD_NUMBER', 'EXCEED_MAX_AMOUNT']) assert.equal(confirmRefusalIsFinal(code), true);
  // Another payment on the order was processed, the first request is still running, or the provider failed: not a refusal.
  for (const code of [undefined, '', 'ALREADY_PROCESSED_PAYMENT', 'DUPLICATED_ORDER_ID', 'IDEMPOTENT_REQUEST_PROCESSING', 'PROVIDER_ERROR', 'FAILED_INTERNAL_SYSTEM_PROCESSING', 'FAILED_PAYMENT_INTERNAL_SYSTEM_PROCESSING', 'UNKNOWN_PAYMENT_ERROR']) assert.equal(confirmRefusalIsFinal(code), false);
  assert.equal(confirmSaysNoPayment('NOT_FOUND_PAYMENT'), true);
  assert.equal(confirmSaysNoPayment('NOT_FOUND_PAYMENT_SESSION'), true);
  assert.equal(confirmSaysNoPayment('REJECT_CARD_COMPANY'), false);
  assert.equal(confirmSaysNoPayment(undefined), false);
});

test('with the fee switched off, only a payment that reached the provider still locks the form', () => {
  const pending = {status: 'PENDING', keyTracked: true, paymentKey: null as string | null};
  // Fee on: the usual rule.
  assert.equal(checkoutLocksFormNow({...pending, paymentKey: 'key'}, true), true);
  assert.equal(checkoutLocksFormNow({...pending, keyTracked: false}, true), true);
  assert.equal(checkoutLocksFormNow(pending, true), false);
  // Fee off: an unsettled payment must be settled before a free application is submitted over it...
  assert.equal(checkoutLocksFormNow({...pending, paymentKey: 'key'}, false), true);
  // ...but rows that never reached the provider do not hold a free applicant up.
  assert.equal(checkoutLocksFormNow({...pending, keyTracked: false}, false), false);
  assert.equal(checkoutLocksFormNow(pending, false), false);
  assert.equal(checkoutLocksFormNow({status: 'COMPLETED', keyTracked: true, paymentKey: 'key'}, false), false);
  assert.equal(checkoutLocksFormNow(null, false), false);
});
