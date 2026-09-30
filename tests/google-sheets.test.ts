import test from 'node:test';
import assert from 'node:assert/strict';
import { absoluteResumeUrl, resumeDocumentId, formatApplicationForSheet } from '../src/lib/googleSheets';

test('the sheet and emails receive a full resume address and the document id is recognised', () => {
  assert.equal(absoluteResumeUrl('/api/documents/abc123'), 'https://criglobal.org/api/documents/abc123');
  assert.equal(absoluteResumeUrl('https://example.test/cv.pdf'), 'https://example.test/cv.pdf');
  assert.equal(absoluteResumeUrl(''), '');
  assert.equal(resumeDocumentId('/api/documents/abc123'), 'abc123');
  assert.equal(resumeDocumentId('https://criglobal.org/api/documents/abc123'), null);
  const row = formatApplicationForSheet({ id: 'app1', createdAt: new Date('2026-09-29T00:00:00Z'), status: 'PENDING' }, { name: 'Parent', email: 'p@example.test' }, { title: 'Program', category: 'Research' }, { resumeUrl: '/api/documents/abc123', resumeDriveUrl: 'https://drive.google.com/file/d/x/view', studentFirstName: 'A', studentLastName: 'B' });
  assert.equal(row.resumeUrl, 'https://criglobal.org/api/documents/abc123');
  assert.equal(row.resumeDriveUrl, 'https://drive.google.com/file/d/x/view');
  assert.equal(row.studentName, 'A B');
});
