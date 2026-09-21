import test from 'node:test';
import assert from 'node:assert/strict';
import { notifyContactInquiry, notifyApplicationReceived, sendApplicationConfirmation } from '../src/lib/notify';

// Without RESEND_API_KEY / AUTH_EMAIL_FROM the helpers must skip quietly: a saved lead or paid application never depends on email.
delete process.env.RESEND_API_KEY;
delete process.env.AUTH_EMAIL_FROM;

test('notification helpers are best effort when email is not configured', async () => {
  const inquiry = await notifyContactInquiry({ name: 'Test Parent', email: 'parent@example.test', message: 'Hello', leadId: 'lead1' });
  assert.equal(inquiry.sent, false);
  const details = { applicationId: 'app1', programTitle: 'Program', accountEmail: 'parent@example.test', form: { studentFirstName: 'A', studentEmail: 'student@example.test', parentEmail: 'parent@example.test' }, payment: { orderId: 'CRI_1', amount: 68000, currency: 'KRW' } };
  assert.equal((await notifyApplicationReceived(details)).sent, false);
  assert.equal((await sendApplicationConfirmation(details)).sent, false);
  // No valid recipient is reported, not thrown.
  assert.equal((await sendApplicationConfirmation({ ...details, accountEmail: null, form: {} })).error, 'no valid recipient');
});
