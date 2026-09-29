import test from 'node:test';
import assert from 'node:assert/strict';
import { applicationSchema } from '../src/lib/application-validation';
import { paymentReviewDraft } from '../src/lib/payment-review-draft';

test('the payment-review sample application passes the real application validation', () => {
  const draft = paymentReviewDraft({ accountEmail: 'support+tosspg@cri.kr', professors: [{ name: 'Professor Example' }], resumeUrl: '/api/documents/abc123' });
  const parsed = applicationSchema.safeParse(draft);
  assert.equal(parsed.success, true, parsed.success ? '' : JSON.stringify(parsed.error.issues));
  assert.equal(draft.firstChoiceProfessor, 'Professor Example');
  // A program without listed faculty still produces a valid form.
  assert.equal(applicationSchema.safeParse(paymentReviewDraft({ accountEmail: 'support+tosspg@cri.kr', professors: [], resumeUrl: '/api/documents/abc123' })).success, true);
  // Without the sample CV the draft is incomplete, so the page opens it on step 2 instead of the final step.
  assert.equal(applicationSchema.safeParse(paymentReviewDraft({ accountEmail: 'support+tosspg@cri.kr', professors: [], resumeUrl: '' })).success, false);
});
