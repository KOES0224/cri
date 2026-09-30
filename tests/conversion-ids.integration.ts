/**
 * Conversion ids and duplicate submissions, against a disposable LOCAL PostgreSQL database with the current schema.
 * Email, the admissions spreadsheet and the Meta Conversions API are replaced with counters, so nothing leaves the machine.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
const url = new URL(process.env.DATABASE_URL || 'http://missing');
if (!['127.0.0.1','localhost'].includes(url.hostname)) throw new Error('Integration tests require a disposable LOCAL database.');
process.env.NEXT_PUBLIC_APPLICATION_FEE_ENABLED = 'false';

let session: any = null;
const calls = {emails: 0, meta: [] as {name: string; eventId: string}[], inquiries: 0};
require.cache[require.resolve('next-auth')] = {exports: {getServerSession: async () => session}} as any;
require.cache[require.resolve('next/cache')] = {exports: {revalidatePath: () => {}, revalidateTag: () => {}}} as any;
require.cache[require.resolve('../src/lib/googleSheets')] = {exports: {syncApplicationToGoogleSheet: async () => ({synced: false})}} as any;
delete process.env.GOOGLE_SHEET_WEBHOOK_URL;
require.cache[require.resolve('../src/lib/notify')] = {exports: {
  notifyApplicationReceived: async () => { calls.emails++; }, sendApplicationConfirmation: async () => { calls.emails++; },
  notifyContactInquiry: async () => { calls.inquiries++; }, sendStudentAccountWelcome: async () => {},
}} as any;
require.cache[require.resolve('../src/lib/meta/capi')] = {exports: {
  sendMetaEvent: async (event: {name: string; eventId: string}) => { calls.meta.push({name: event.name, eventId: event.eventId}); return {data: {}}; },
}} as any;
const {prisma: db} = require('../src/lib/prisma') as {prisma: PrismaClient};
const {submitApplicationWithoutFee} = require('../src/app/actions/payment');
const {submitContactForm} = require('../src/app/actions/contact');
const {saveApplicationDraft} = require('../src/app/actions/applicationDrafts');

const key = randomUUID().replaceAll('-', '');
const userId = `ids-${key}`, programA = `ids-a-${key}`, programB = `ids-b-${key}`, documentId = `doc${key}`;
const form = {studentFirstName: 'Test', studentLastName: 'Student', studentEmail: `${key}@example.test`, studentPhone: '123', residenceCountry: 'KR',
  parentFirstName: 'Test', parentLastName: 'Parent', parentEmail: `p-${key}@example.test`, parentPhone: '456', school: 'School', gradYear: '2028',
  gender: 'Prefer not to say', tShirtSize: 'M', photoConsent: 'No', resumeUrl: `/api/documents/${documentId}`, initialTopicIdeas: 'Topic',
  areaOfInterest: 'Biology', essay: 'Interests', shortAnswer: 'Question', firstChoiceProfessor: 'Professor', secondChoiceProfessor: '',
  thirdChoiceProfessor: '', previousResearch: '', howLearned: ''};

test('free applications: one conversion id per application, repeats and races report duplicate', async () => {
  const future = new Date(Date.now() + 30 * 86400000);
  await db.user.create({data: {id: userId, email: `${key}@example.test`, role: 'STUDENT'}});
  await db.program.createMany({data: [
    {id: programA, title: 'QA Winter A', description: 'Local only', category: 'Winter', status: 'OPEN', endDate: future},
    {id: programB, title: 'QA Winter B', description: 'Local only', category: 'Winter', status: 'OPEN', endDate: future},
  ]});
  await db.applicationDocument.create({data: {id: documentId, userId, filename: 'cv.pdf', data: Buffer.from('%PDF-1.4 synthetic')}});
  session = {user: {id: userId, role: 'STUDENT', email: `${key}@example.test`}};
  try {
    // 1. First submission creates the application; its id is both the GTM transaction id and the Meta event id.
    const first = await submitApplicationWithoutFee(programA, form);
    assert.equal(first.success, true, JSON.stringify(first));
    assert.ok(first.applicationId && !first.duplicate);
    assert.equal(first.eventId, first.applicationId);

    // 2. Submitting again (second tab after the first finished, back button, resubmit) is a duplicate: same id, no event id.
    const again = await submitApplicationWithoutFee(programA, form);
    assert.deepEqual({duplicate: again.duplicate, applicationId: again.applicationId, eventId: again.eventId}, {duplicate: true, applicationId: first.applicationId, eventId: undefined});

    // 3. Two submissions at the same moment for another program: exactly one is created, the other reports duplicate.
    const race = await Promise.all([submitApplicationWithoutFee(programB, form), submitApplicationWithoutFee(programB, form)]);
    assert.ok(race.every((r: any) => r.success), JSON.stringify(race));
    assert.equal(race.filter((r: any) => !r.duplicate).length, 1);
    assert.equal(race[0].applicationId, race[1].applicationId);
    assert.equal(await db.application.count({where: {userId, programId: programB}}), 1);

    // Side effects ran once per real application (2 programs): 2 emails and 1 Meta event each. (The spreadsheet sync is
    // loaded with a dynamic import that the require.cache stub cannot replace; without GOOGLE_SHEET_WEBHOOK_URL it sends nothing.)
    assert.equal(calls.emails, 4);
    assert.deepEqual(calls.meta.map(m => m.name), ['SubmitApplication', 'SubmitApplication']);
    assert.deepEqual(new Set(calls.meta.map(m => m.eventId)), new Set([first.applicationId, race.find((r: any) => !r.duplicate).applicationId]));
  } finally {
    await db.application.deleteMany({where: {userId}});
    await db.applicationDocument.deleteMany({where: {userId}});
    await db.program.deleteMany({where: {id: {in: [programA, programB]}}});
    await db.user.delete({where: {id: userId}});
  }
});

test('with the fee off, a checkout left over from a fee period does not block the free submission', async () => {
  const user = `stale-${key}`, program = `stale-p-${key}`, doc = `stale${key}`;
  await db.user.create({data: {id: user, email: `stale-${key}@example.test`, role: 'STUDENT'}});
  await db.program.create({data: {id: program, title: 'QA Winter C', description: 'Local only', category: 'Winter', status: 'OPEN', endDate: new Date(Date.now() + 30 * 86400000)}});
  await db.applicationDocument.create({data: {id: doc, userId: user, filename: 'cv.pdf', data: Buffer.from('%PDF-1.4 synthetic')}});
  await db.applicationCheckout.create({data: {id: `CRI_${key}`, userId: user, programId: program, status: 'PENDING', amount: 50, currency: 'USD', formData: {}, expiresAt: new Date(Date.now() - 86400000)}});
  session = {user: {id: user, role: 'STUDENT', email: `stale-${key}@example.test`}};
  const staleForm = {...form, resumeUrl: `/api/documents/${doc}`};
  try {
    // The form's autosave (persist) runs before every submit; it used to answer draftClosed here, so submit never ran.
    const saved = await saveApplicationDraft(program, staleForm, 3, 0);
    assert.equal(saved.success, true, JSON.stringify(saved));
    const submitted = await submitApplicationWithoutFee(program, staleForm);
    assert.ok(submitted.success && !submitted.duplicate && submitted.applicationId, JSON.stringify(submitted));
    assert.equal(await db.applicationCheckout.count({where: {userId: user, programId: program}}), 0);
  } finally {
    await db.application.deleteMany({where: {userId: user}});
    await db.applicationDraft.deleteMany({where: {userId: user}});
    await db.applicationCheckout.deleteMany({where: {userId: user}});
    await db.applicationDocument.deleteMany({where: {userId: user}});
    await db.program.deleteMany({where: {id: program}});
    await db.user.delete({where: {id: user}});
  }
});

test('inquiries: every inquiry gets its own id, used as both GTM transaction id and Meta event id', async () => {
  session = null;
  const inquiry = {firstName: 'Test', lastName: 'Parent', email: `c-${key}@example.test`, message: 'Question about winter', country: 'KR', applicantType: 'parent', topic: '', programId: ''};
  const one = await submitContactForm(inquiry);
  const two = await submitContactForm(inquiry);
  try {
    assert.equal(one.success && two.success, true, JSON.stringify([one, two]));
    assert.ok(one.eventId && two.eventId && one.eventId !== two.eventId);
    assert.deepEqual(calls.meta.filter(m => m.name === 'Lead').map(m => m.eventId), [one.eventId, two.eventId]);
    assert.equal(calls.inquiries, 2);
  } finally {
    await db.lead.deleteMany({where: {email: `c-${key}@example.test`}});
  }
});
