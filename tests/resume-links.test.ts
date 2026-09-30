import test from 'node:test';
import assert from 'node:assert/strict';
import { absoluteResumeUrl, resumeDocumentId } from '../src/lib/resume-links';

test('resume links: full address for emails and exports, document id from the stored path', () => {
  assert.equal(absoluteResumeUrl('/api/documents/abc123'), 'https://criglobal.org/api/documents/abc123');
  assert.equal(absoluteResumeUrl('https://example.test/cv.pdf'), 'https://example.test/cv.pdf');
  assert.equal(absoluteResumeUrl(''), '');
  assert.equal(resumeDocumentId('/api/documents/abc123'), 'abc123');
  assert.equal(resumeDocumentId('https://criglobal.org/api/documents/abc123'), null);
});
