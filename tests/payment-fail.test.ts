import {test} from 'node:test';
import assert from 'node:assert/strict';
import {failureNeedsReport, paymentFailReason, sanitizeFailCode} from '../src/lib/payment-fail-reason';

test('a failure code from the payment window is grouped into what the payer can act on', () => {
  assert.equal(paymentFailReason(''), 'canceled');
  for (const code of ['PAY_PROCESS_CANCELED', 'USER_CANCEL', 'PAYMENT_CANCELLED']) assert.equal(paymentFailReason(code), 'canceled', code);
  // The provider's general "failed in the window": not the payer's cancel.
  assert.equal(paymentFailReason('PAY_PROCESS_ABORTED'), 'notApproved');
  assert.equal(paymentFailReason('NOT_SUPPORTED_CARD_TYPE'), 'currency');
  assert.equal(paymentFailReason('EXCEED_MAX_AMOUNT'), 'limit');
  assert.equal(paymentFailReason('REJECT_CARD_PAYMENT'), 'limit');
  assert.equal(paymentFailReason('INVALID_CARD_NUMBER'), 'details');
  assert.equal(paymentFailReason('REJECT_CARD_COMPANY'), 'declined');
  assert.equal(paymentFailReason('INVALID_STOPPED_CARD'), 'declined');
  for (const code of ['2003', 'UNKNOWN_X', 'PROVIDER_ERROR']) assert.equal(paymentFailReason(code), 'generic', code);
});

test('admissions hears about failures that are not the payer\'s choice or card', () => {
  // The provider stopped payments for the merchant (numeric code), an unsupported currency, or a code we do not know.
  for (const code of ['2003', 'UNKNOWN_X', 'NOT_SUPPORTED_CARD_TYPE']) assert.equal(failureNeedsReport(code), true, code);
  for (const code of ['', 'PAY_PROCESS_CANCELED', 'USER_CANCEL', 'PAY_PROCESS_ABORTED', 'REJECT_CARD_COMPANY', 'EXCEED_MAX_AMOUNT', 'INVALID_CARD_NUMBER']) assert.equal(failureNeedsReport(code), false, code);
});

test('a code from the address bar is reduced to letters, digits and underscores', () => {
  assert.equal(sanitizeFailCode('<script>alert(1)</script>'), 'scriptalert1script');
  assert.equal(sanitizeFailCode('PAY_PROCESS_CANCELED'), 'PAY_PROCESS_CANCELED');
  assert.equal(sanitizeFailCode('x'.repeat(100)).length, 60);
  assert.equal(sanitizeFailCode(null), '');
});
