/**
 * Referral codes against a disposable LOCAL PostgreSQL database with the current schema: the admin actions, the form's
 * preview check, the reduced-fee checkout, the waived submission, limits under concurrent submissions, recovery of a
 * reduced payment, and what deleting an application does. The payment provider, email and the Meta Conversions API are
 * replaced, so nothing leaves the machine. Worth running with the database session in a zone other than UTC as well
 * (a local PostgreSQL takes the machine's zone): the expiry checks must not depend on it.
 */
import {after, before, test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
const url = new URL(process.env.DATABASE_URL || 'http://missing');
if (!['127.0.0.1','localhost'].includes(url.hostname)) throw new Error('Integration tests require a disposable LOCAL database.');
// The session runs in Korea's zone on purpose (production runs in UTC): a time comparison that depends on the session
// zone fails here, whatever zone the local server itself was started in.
url.searchParams.set('options', '-c TimeZone=Asia/Seoul');
process.env.DATABASE_URL = url.toString();
// Codes are only asked for while the fee is on.
process.env.NEXT_PUBLIC_APPLICATION_FEE_ENABLED = 'true';
process.env.TOSS_SECRET_KEY = 'synthetic-test';
process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY = 'synthetic-test';

let session: any = null;
const sent = {received: [] as any[], confirmations: [] as any[], reviews: [] as any[], problems: [] as any[], meta: [] as {name: string; value?: number}[]};
require.cache[require.resolve('next-auth')] = {exports: {getServerSession: async () => session}} as any;
require.cache[require.resolve('next/cache')] = {exports: {revalidatePath: () => {}, revalidateTag: () => {}, unstable_cache: (fn: any) => fn}} as any;
require.cache[require.resolve('../src/lib/notify')] = {exports: {
  notifyApplicationReceived: async (details: any) => { sent.received.push(details); },
  sendApplicationConfirmation: async (details: any) => { sent.confirmations.push(details); return {sent: true}; },
  notifyPaymentNeedsReview: async (details: any) => { sent.reviews.push(details); },
  notifyPaymentFormProblem: async (details: any) => { sent.problems.push(details); },
}} as any;
require.cache[require.resolve('../src/lib/meta/capi')] = {exports: {
  captureMetaContext: async () => ({}),
  sendMetaEvent: async (event: {name: string; data?: {value?: number}}) => { sent.meta.push({name: event.name, value: event.data?.value}); return {sent: false, data: {}}; },
}} as any;
const {prisma: db} = require('../src/lib/prisma') as {prisma: PrismaClient};
const {checkFeeCode, createFeeCode, setFeeCodeActive, updateFeeCode} = require('../src/app/actions/feeCodes');
const {beginApplicationCheckout, finalizePaidApplication, reportPaymentProblem, resolvePendingCheckout, settleReturnedOrder, submitApplicationWithoutFee} = require('../src/app/actions/payment');
const {deleteApplication} = require('../src/app/actions/adminApplications');

const key = randomUUID().replaceAll('-', '');
const K = key.slice(0, 8).toUpperCase();
const adminId = `fc-admin-${key}`;
const programs = [1, 2, 3, 4, 5, 6, 7].map(n => `fc-p${n}-${key}`);
const [p1, p2, p3, p4, p5, p6, p7] = programs;
const WAIVE = `W${K}`, REDUCE = `R${K}`, LIMITED = `L${K}`, EXPIRED = `E${K}`, TWICE = `T${K}`;
const realFetch = globalThis.fetch;
const users: string[] = [adminId];

/** A student account with an uploaded CV, and the application form that goes with it. */
async function student(tag: string) {
  const id = `fc-${tag}-${key}`, documentId = `fcdoc${tag}${key}`;
  await db.user.create({data: {id, email: `${tag}-${key}@example.test`, role: 'STUDENT'}});
  await db.applicationDocument.create({data: {id: documentId, userId: id, filename: 'cv.pdf', data: Buffer.from('%PDF-1.4 synthetic')}});
  users.push(id);
  const form = {studentFirstName: 'Test', studentLastName: tag, studentEmail: `${tag}-${key}@example.test`, studentPhone: '123', residenceCountry: 'US',
    parentFirstName: 'Test', parentLastName: 'Parent', parentEmail: `p-${tag}-${key}@example.test`, parentPhone: '456', school: 'School', gradYear: '2028',
    gender: 'Prefer not to say', tShirtSize: 'M', photoConsent: 'No', resumeUrl: `/api/documents/${documentId}`, initialTopicIdeas: 'Topic',
    areaOfInterest: 'Biology', essay: 'Interests', shortAnswer: 'Question', firstChoiceProfessor: 'Professor', secondChoiceProfessor: '',
    thirdChoiceProfessor: '', previousResearch: '', howLearned: ''};
  return {id, form, signIn: () => { session = {user: {id, role: 'STUDENT', email: `${tag}-${key}@example.test`}}; }};
}
const asAdmin = () => { session = {user: {id: adminId, role: 'ADMIN', email: `admin-${key}@example.test`}}; };
const formData = (fields: Record<string, string>) => { const form = new FormData(); for (const [name, value] of Object.entries(fields)) form.set(name, value); return form; };
const uses = async (code: string) => (await db.feeCode.findUniqueOrThrow({where: {code}})).usedCount;
const payment = async (applicationId: string) => JSON.parse((await db.application.findUniqueOrThrow({where: {id: applicationId}})).content || '{}').payment;
/** A provider that approves the next confirm for `amount` and then reports that payment as done. */
function approvingProvider(orderId: string, amount: number) {
  const seen = {posts: [] as any[], paid: false};
  globalThis.fetch = (async (_url: any, init?: any) => {
    if (init?.method === 'POST') { seen.posts.push(JSON.parse(init.body)); seen.paid = true; }
    if (!seen.paid) return Response.json({code: 'NOT_FOUND_PAYMENT'}, {status: 404});
    return Response.json({status: 'DONE', orderId, totalAmount: amount, currency: 'USD', paymentKey: `key-${orderId}`, method: '카드', approvedAt: '2026-11-10T01:00:00+09:00', receipt: {url: 'https://example.test/receipt'}});
  }) as any;
  return seen;
}

before(async () => {
  // Budgets shared by every account (mails per hour) would otherwise carry over from an earlier run on this database.
  await db.requestLimit.deleteMany({});
  await db.user.create({data: {id: adminId, email: `admin-${key}@example.test`, role: 'ADMIN'}});
  const future = new Date(Date.now() + 30 * 86400000);
  await db.program.createMany({data: programs.map((id, i) => ({id, title: `QA Codes ${i + 1}`, description: 'Local only', category: 'Winter', status: 'OPEN', endDate: future}))});
});
after(async () => {
  globalThis.fetch = realFetch;
  await db.application.deleteMany({where: {userId: {in: users}}});
  await db.applicationCheckout.deleteMany({where: {userId: {in: users}}});
  await db.applicationDraft.deleteMany({where: {userId: {in: users}}});
  await db.applicationDocument.deleteMany({where: {userId: {in: users}}});
  await db.feeCode.deleteMany({where: {code: {endsWith: K}}});
  await db.program.deleteMany({where: {id: {in: programs}}});
  await db.user.deleteMany({where: {id: {in: users}}});
  await db.$disconnect();
});

test('admin: only administrators create and switch codes, and the input is validated', async () => {
  const outsider = await student('outsider');
  outsider.signIn();
  assert.match((await createFeeCode(formData({code: `X${K}`, partner: 'Nobody', kind: 'waive'}))).error, /Administrator/);
  await assert.rejects(() => setFeeCodeActive(formData({id: 'anything', active: 'false'})));
  session = null;
  assert.match((await createFeeCode(formData({code: `X${K}`, partner: 'Nobody', kind: 'waive'}))).error, /Administrator/);
  assert.equal(await db.feeCode.count({where: {code: `X${K}`}}), 0);

  asAdmin();
  // Typed in lower case with spaces around it; stored upper-case. A stray amount on a waiver is ignored.
  assert.deepEqual(await createFeeCode(formData({code: `  ${WAIVE.toLowerCase()} `, partner: 'Agency A', kind: 'waive', feeAmount: '30'})), {created: WAIVE});
  const waive = await db.feeCode.findUniqueOrThrow({where: {code: WAIVE}});
  assert.deepEqual({feeAmount: waive.feeAmount, active: waive.active, maxUses: waive.maxUses, expiresAt: waive.expiresAt, usedCount: waive.usedCount}, {feeAmount: 0, active: true, maxUses: null, expiresAt: null, usedCount: 0});
  assert.match((await createFeeCode(formData({code: WAIVE.toLowerCase(), partner: 'Agency A', kind: 'waive'}))).error, /already exists/);
  // Every way of getting the form wrong is refused and nothing is stored.
  const refused: Record<string, string>[] = [
    {code: `Y${K}`, partner: 'Agency', kind: ''},
    {code: `Y${K}`, partner: 'Agency', kind: 'reduce', feeAmount: '50'},
    {code: `Y${K}`, partner: 'Agency', kind: 'reduce', feeAmount: '80'},
    {code: `Y${K}`, partner: 'Agency', kind: 'reduce', feeAmount: '0'},
    {code: `Y${K}`, partner: 'Agency', kind: 'reduce', feeAmount: '12.5'},
    {code: `Y${K}`, partner: 'Agency', kind: 'reduce', feeAmount: '-3'},
    {code: `Y${K}`, partner: 'Agency', kind: 'reduce', feeAmount: ''},
    {code: `Y${K}`, partner: 'Agency', kind: 'reduce', feeAmount: 'abc'},
    {code: `Y${K}`, partner: '', kind: 'waive'},
    {code: 'ab', partner: 'Agency', kind: 'waive'},
    {code: `Y ${K}`, partner: 'Agency', kind: 'waive'},
    {code: `Y${K}`, partner: 'Agency', kind: 'waive', maxUses: '0'},
    {code: `Y${K}`, partner: 'Agency', kind: 'waive', maxUses: '1.5'},
    {code: `Y${K}`, partner: 'Agency', kind: 'waive', expiresAt: 'tomorrow'},
  ];
  for (const fields of refused) assert.ok((await createFeeCode(formData(fields))).error, JSON.stringify(fields));
  assert.equal(await db.feeCode.count({where: {code: `Y${K}`}}), 0);

  assert.deepEqual(await createFeeCode(formData({code: REDUCE, partner: 'School B', kind: 'reduce', feeAmount: '20', note: 'Spring fair'})), {created: REDUCE});
  assert.equal((await db.feeCode.findUniqueOrThrow({where: {code: REDUCE}})).feeAmount, 20);
  // The last valid day is a day in Korea: the code works until that day ends there.
  assert.deepEqual(await createFeeCode(formData({code: LIMITED, partner: 'School C', kind: 'reduce', feeAmount: '20', maxUses: '1', expiresAt: '2031-01-15'})), {created: LIMITED});
  const limited = await db.feeCode.findUniqueOrThrow({where: {code: LIMITED}});
  assert.equal(limited.maxUses, 1);
  assert.equal(limited.expiresAt?.toISOString(), '2031-01-15T14:59:59.000Z');
  assert.deepEqual(await createFeeCode(formData({code: TWICE, partner: 'Agency D', kind: 'waive', maxUses: '2'})), {created: TWICE});

  // A last valid day that has already passed is refused: such a code could never be used.
  assert.match((await createFeeCode(formData({code: `Y${K}`, partner: 'Agency', kind: 'waive', expiresAt: '2020-01-01'}))).error, /already passed/);
  assert.match((await createFeeCode(formData({code: `Y${K}`, partner: 'Agency', kind: 'waive', expiresAt: '2031-02-30'}))).error, /not a valid date/);
  assert.equal(await db.feeCode.count({where: {code: `Y${K}`}}), 0);

  // Editing: the limits, who it is for and the note can change mid-season; the code text and the amount cannot.
  assert.deepEqual(await updateFeeCode(formData({id: limited.id, partner: 'School C (north campus)', maxUses: '3', expiresAt: '2031-03-31', note: 'Extended'})), {saved: true});
  const edited = await db.feeCode.findUniqueOrThrow({where: {code: LIMITED}});
  assert.deepEqual({partner: edited.partner, maxUses: edited.maxUses, expires: edited.expiresAt?.toISOString(), note: edited.note, feeAmount: edited.feeAmount, code: edited.code},
    {partner: 'School C (north campus)', maxUses: 3, expires: '2031-03-31T14:59:59.000Z', note: 'Extended', feeAmount: 20, code: LIMITED});
  assert.ok((await updateFeeCode(formData({id: limited.id, partner: 'School C', maxUses: '0'}))).error);
  assert.ok((await updateFeeCode(formData({id: limited.id, partner: '', maxUses: '3'}))).error);
  assert.ok((await updateFeeCode(formData({id: limited.id, partner: 'School C', expiresAt: '2020-01-01'}))).error);
  assert.ok((await updateFeeCode(formData({id: 'no-such-id', partner: 'School C'}))).error);
  // Back to one use and the original day for the cases below; empty fields clear a limit.
  assert.deepEqual(await updateFeeCode(formData({id: limited.id, partner: 'School C', maxUses: '1', expiresAt: '2031-01-15'})), {saved: true});
  assert.equal((await db.feeCode.findUniqueOrThrow({where: {code: LIMITED}})).note, null);
  outsider.signIn();
  assert.match((await updateFeeCode(formData({id: limited.id, partner: 'Hijacked', maxUses: '999'}))).error, /Administrator/);
  assert.equal((await db.feeCode.findUniqueOrThrow({where: {code: LIMITED}})).maxUses, 1);
  asAdmin();

  // An expired code: its note and partner can be corrected with the day left as it is, and it stays expired. Only a
  // day that is changed has to be today or later.
  const past = await db.feeCode.create({data: {code: `P${K}`, partner: 'Past partner', feeAmount: 0, expiresAt: new Date('2025-03-31T14:59:59Z')}});
  assert.deepEqual(await updateFeeCode(formData({id: past.id, partner: 'Past partner (invoiced)', maxUses: '', expiresAt: '2025-03-31', note: '12 used'})), {saved: true});
  const corrected = await db.feeCode.findUniqueOrThrow({where: {code: `P${K}`}});
  assert.deepEqual({partner: corrected.partner, note: corrected.note, expires: corrected.expiresAt?.toISOString()}, {partner: 'Past partner (invoiced)', note: '12 used', expires: '2025-03-31T14:59:59.000Z'});
  assert.match((await updateFeeCode(formData({id: past.id, partner: 'Past partner', expiresAt: '2025-04-30'}))).error, /already passed/);
  assert.deepEqual(await updateFeeCode(formData({id: past.id, partner: 'Past partner', expiresAt: '2031-04-30'})), {saved: true});
  assert.equal((await db.feeCode.findUniqueOrThrow({where: {code: `P${K}`}})).expiresAt?.toISOString(), '2031-04-30T14:59:59.000Z');

  // Switching off and on again.
  await setFeeCodeActive(formData({id: waive.id, active: 'false'}));
  assert.equal((await db.feeCode.findUniqueOrThrow({where: {code: WAIVE}})).active, false);
  await setFeeCodeActive(formData({id: waive.id, active: 'true'}));
  assert.equal((await db.feeCode.findUniqueOrThrow({where: {code: WAIVE}})).active, true);
});

test('the form check says what a code would do, and why a code cannot be used', async () => {
  await db.feeCode.create({data: {code: EXPIRED, partner: 'Old partner', feeAmount: 0, expiresAt: new Date(Date.now() - 1000)}});
  session = null;
  assert.deepEqual(await checkFeeCode(WAIVE), {ok: false, code: 'applySignIn'});
  asAdmin();
  assert.deepEqual(await checkFeeCode(WAIVE), {ok: false, code: 'applySignIn'});
  const checker = await student('checker');
  checker.signIn();
  assert.deepEqual(await checkFeeCode(` ${WAIVE.toLowerCase()} `), {ok: true, code: WAIVE, feeAmount: 0});
  assert.deepEqual(await checkFeeCode(REDUCE), {ok: true, code: REDUCE, feeAmount: 20});
  assert.deepEqual(await checkFeeCode(`NOPE${K}`), {ok: false, code: 'feeCodeInvalid'});
  assert.deepEqual(await checkFeeCode('a b'), {ok: false, code: 'feeCodeInvalid'});
  assert.deepEqual(await checkFeeCode(EXPIRED), {ok: false, code: 'feeCodeExpired'});
  await db.feeCode.update({where: {code: REDUCE}, data: {active: false}});
  assert.deepEqual(await checkFeeCode(REDUCE), {ok: false, code: 'feeCodeInvalid'});
  await db.feeCode.update({where: {code: REDUCE}, data: {active: true, maxUses: 3, usedCount: 3}});
  assert.deepEqual(await checkFeeCode(REDUCE), {ok: false, code: 'feeCodeUsedUp'});
  await db.feeCode.update({where: {code: REDUCE}, data: {maxUses: null, usedCount: 0}});
  // Ten typed tries per ten minutes (seven used above). A page reload re-checking a code that works is answered from
  // its own budget and spends none of them.
  for (let i = 0; i < 12; i++) assert.deepEqual(await checkFeeCode(WAIVE, true), {ok: true, code: WAIVE, feeAmount: 0});
  for (let i = 0; i < 3; i++) assert.equal((await checkFeeCode(WAIVE)).ok, true);
  assert.deepEqual(await checkFeeCode(WAIVE), {ok: false, code: 'feeCodeRate'});
  // Once the typed tries are used up the reload budget answers nothing either, hit or miss: it cannot be used to keep
  // guessing. (The form keeps a code it had already applied; the server prices the order again at Pay.)
  assert.deepEqual(await checkFeeCode(WAIVE, true), {ok: false, code: 'feeCodeRate'});
  assert.deepEqual(await checkFeeCode(`NOPE${K}`, true), {ok: false, code: 'feeCodeRate'});
  // Every miss through the reload path counts as a typed try.
  const guesser = await student('guesser');
  guesser.signIn();
  for (let i = 0; i < 10; i++) assert.deepEqual(await checkFeeCode(`GUESS${i}${K}`, true), {ok: false, code: 'feeCodeInvalid'});
  assert.deepEqual(await checkFeeCode(`GUESS10${K}`, true), {ok: false, code: 'feeCodeRate'});
  assert.deepEqual(await checkFeeCode(WAIVE), {ok: false, code: 'feeCodeRate'});
});

test('reduced fee: the server prices the order, the provider is asked for that amount, and the use is counted once', async () => {
  const s = await student('reduced');
  s.signIn();
  sent.meta.length = 0;
  const first = await beginApplicationCheckout(p1, s.form, REDUCE.toLowerCase());
  assert.deepEqual({amount: first.amount, currency: first.currency}, {amount: 20, currency: 'USD'}, JSON.stringify(first));
  assert.deepEqual(await db.applicationCheckout.findUnique({where: {id: first.orderId}, select: {amount: true, feeCode: true, keyTracked: true}}), {amount: 20, feeCode: REDUCE, keyTracked: true});
  assert.deepEqual(sent.meta.at(-1), {name: 'InitiateCheckout', value: 20});
  // Removing the code prices a new order at the full fee; applying it again prices another at the reduced fee. One row.
  const full = await beginApplicationCheckout(p1, s.form);
  assert.equal(full.amount, 50); assert.notEqual(full.orderId, first.orderId);
  assert.equal((await db.applicationCheckout.findUnique({where: {id: full.orderId}}))?.feeCode, null);
  const order = await beginApplicationCheckout(p1, s.form, REDUCE);
  assert.equal(order.amount, 20);
  assert.equal(await db.applicationCheckout.count({where: {userId: s.id, programId: p1}}), 1);
  // The orders that were replaced can no longer be paid.
  assert.equal((await finalizePaidApplication({orderId: first.orderId, paymentKey: 'stale-key', amount: 20})).code, 'paymentSuperseded');
  const provider = approvingProvider(order.orderId, 20);
  // The browser cannot change what is charged: the amount must equal the order's own.
  assert.equal((await finalizePaidApplication({orderId: order.orderId, paymentKey: `key-${order.orderId}`, amount: 50})).code, 'paymentMismatch');
  assert.equal((await finalizePaidApplication({orderId: order.orderId, paymentKey: `key-${order.orderId}`, amount: 1})).code, 'paymentMismatch');
  assert.equal(provider.posts.length, 0);
  sent.received.length = 0; sent.confirmations.length = 0;
  const done = await finalizePaidApplication({orderId: order.orderId, paymentKey: `key-${order.orderId}`, amount: 20});
  assert.equal(done.success, true, JSON.stringify(done));
  assert.deepEqual(provider.posts, [{paymentKey: `key-${order.orderId}`, orderId: order.orderId, amount: 20}]);
  assert.deepEqual({amount: done.receipt.amount, currency: done.receipt.currency}, {amount: 20, currency: 'USD'});
  const recorded = await payment(done.applicationId);
  assert.deepEqual({feeStatus: recorded.feeStatus, amount: recorded.amount, currency: recorded.currency, code: recorded.code, normalFee: recorded.normalFee, orderId: recorded.orderId}, {feeStatus: 'PAID', amount: 20, currency: 'USD', code: REDUCE, normalFee: 50, orderId: order.orderId});
  assert.equal(await uses(REDUCE), 1);
  // Admissions and the family are told the code and the amount actually paid.
  assert.deepEqual({code: sent.received[0].feeCode, amount: sent.received[0].payment.amount}, {code: REDUCE, amount: 20});
  assert.deepEqual({code: sent.confirmations[0].feeCode, amount: sent.confirmations[0].payment.amount}, {code: REDUCE, amount: 20});
  assert.deepEqual(sent.meta.filter(m => m.name === 'Purchase'), [{name: 'Purchase', value: 20}]);
  // A repeated return, and a reload of the receipt page, show the same application and count nothing twice.
  const repeated = await finalizePaidApplication({orderId: order.orderId, paymentKey: `key-${order.orderId}`, amount: 20});
  assert.equal(repeated.applicationId, done.applicationId); assert.equal(provider.posts.length, 1);
  const reloaded = await settleReturnedOrder(order.orderId);
  assert.deepEqual({id: reloaded.applicationId, amount: reloaded.receipt.amount}, {id: done.applicationId, amount: 20});
  assert.equal(await uses(REDUCE), 1);
  assert.equal(sent.received.length, 1);
  assert.equal((await beginApplicationCheckout(p1, s.form, REDUCE)).code, 'alreadyApplied');
});

test('reduced fee: an order already priced keeps its price when the code is switched off before payment; new orders do not get it', async () => {
  const s = await student('priced');
  s.signIn();
  const order = await beginApplicationCheckout(p1, s.form, LIMITED);
  assert.equal(order.amount, 20, JSON.stringify(order));
  await db.feeCode.update({where: {code: LIMITED}, data: {active: false}});
  approvingProvider(order.orderId, 20);
  const done = await finalizePaidApplication({orderId: order.orderId, paymentKey: `key-${order.orderId}`, amount: 20});
  assert.equal(done.success, true, JSON.stringify(done));
  assert.equal((await payment(done.applicationId)).amount, 20);
  assert.equal(await uses(LIMITED), 1);
  const next = await student('late');
  next.signIn();
  assert.equal((await beginApplicationCheckout(p1, next.form, LIMITED)).code, 'feeCodeInvalid');
  await db.feeCode.update({where: {code: LIMITED}, data: {active: true}});
  // Its single use is spent.
  assert.equal((await beginApplicationCheckout(p1, next.form, LIMITED)).code, 'feeCodeUsedUp');
  assert.equal((await beginApplicationCheckout(p1, next.form, EXPIRED)).code, 'feeCodeExpired');
  assert.equal((await beginApplicationCheckout(p1, next.form, `NOPE${K}`)).code, 'feeCodeInvalid');
  // A waiving code never creates an order: the form submits without payment instead.
  assert.equal((await beginApplicationCheckout(p1, next.form, WAIVE)).code, 'feeCodeWaives');
  assert.equal(await db.applicationCheckout.count({where: {userId: next.id}}), 0);
});

test('waived fee: only a waiving code submits without payment, and it is counted once', async () => {
  const s = await student('waived');
  s.signIn();
  assert.equal((await submitApplicationWithoutFee(p2, s.form)).code, 'feeRequired');
  assert.equal((await submitApplicationWithoutFee(p2, s.form, 'not a code')).code, 'feeRequired');
  // A code that only reduces the fee, an unknown one and an expired one do not open the no-payment path.
  assert.equal((await submitApplicationWithoutFee(p2, s.form, REDUCE)).code, 'feeCodeInvalid');
  assert.equal((await submitApplicationWithoutFee(p2, s.form, `NOPE${K}`)).code, 'feeCodeInvalid');
  assert.equal((await submitApplicationWithoutFee(p2, s.form, EXPIRED)).code, 'feeCodeExpired');
  assert.equal(await db.application.count({where: {userId: s.id}}), 0);
  assert.equal(await uses(REDUCE), 1);
  sent.received.length = 0;
  const done = await submitApplicationWithoutFee(p2, s.form, WAIVE.toLowerCase());
  assert.ok(done.success && done.applicationId && !done.duplicate, JSON.stringify(done));
  assert.deepEqual(await payment(done.applicationId), {feeStatus: 'WAIVED', amount: 0, currency: 'USD', submittedAt: (await payment(done.applicationId)).submittedAt, code: WAIVE, normalFee: 50});
  assert.equal(await uses(WAIVE), 1);
  assert.deepEqual({code: sent.received[0].feeCode, payment: sent.received[0].payment}, {code: WAIVE, payment: null});
  const again = await submitApplicationWithoutFee(p2, s.form, WAIVE);
  assert.deepEqual({duplicate: again.duplicate, id: again.applicationId}, {duplicate: true, id: done.applicationId});
  assert.equal(await uses(WAIVE), 1);

  // An order left by a payment attempt that never reached the provider does not block the waiver and is cleared.
  const abandoned = await student('abandoned');
  abandoned.signIn();
  assert.ok((await beginApplicationCheckout(p2, abandoned.form)).orderId);
  const cleared = await submitApplicationWithoutFee(p2, abandoned.form, WAIVE);
  assert.ok(cleared.success && !cleared.duplicate, JSON.stringify(cleared));
  assert.equal(await db.applicationCheckout.count({where: {userId: abandoned.id}}), 0);
  assert.equal(await uses(WAIVE), 2);

  // A payment that reached the provider and is not settled is never waived over; the code is not counted.
  const unsettled = await student('unsettled');
  unsettled.signIn();
  const order = await beginApplicationCheckout(p2, unsettled.form);
  await db.applicationCheckout.update({where: {id: order.orderId}, data: {paymentKey: 'unsettled-key', paymentKeyAt: new Date()}});
  assert.equal((await submitApplicationWithoutFee(p2, unsettled.form, WAIVE)).code, 'checkoutReview');
  assert.equal(await db.application.count({where: {userId: unsettled.id}}), 0);
  assert.equal(await db.applicationCheckout.count({where: {userId: unsettled.id}}), 1);
  assert.equal(await uses(WAIVE), 2);
});

test('a limited waiving code cannot be over-used by submissions that arrive together', async () => {
  const group = await Promise.all(['r1', 'r2', 'r3', 'r4', 'r5'].map(tag => student(tag)));
  // Each call reads the session when it starts; the calls then run together.
  const results = await Promise.all(group.map(s => { s.signIn(); return submitApplicationWithoutFee(p3, s.form, TWICE); }));
  assert.equal(results.filter((r: any) => r.success).length, 2, JSON.stringify(results));
  // The ones that lost the race are told the code is used up, not that it is misspelled.
  assert.equal(results.filter((r: any) => r.code === 'feeCodeUsedUp').length, 3, JSON.stringify(results));
  assert.equal(await uses(TWICE), 2);
  assert.equal(await db.application.count({where: {programId: p3}}), 2);
  group[0].signIn();
  assert.deepEqual(await checkFeeCode(TWICE), {ok: false, code: 'feeCodeUsedUp'});
});

test('recovery: a reduced payment that went through without being recorded is recorded at the reduced amount, once', async () => {
  // 1. The confirm gets no clear answer; when the applicant reopens the form the provider reports the payment as done.
  const s = await student('recover');
  s.signIn();
  const order = await beginApplicationCheckout(p4, s.form, REDUCE);
  assert.equal(order.amount, 20, JSON.stringify(order));
  let state = 'IN_PROGRESS', total = 20, posts = 0;
  globalThis.fetch = (async (_url: any, init?: any) => {
    if (init?.method === 'POST') { posts++; return Response.json({code: 'PROVIDER_ERROR'}, {status: 500}); }
    return Response.json({status: state, orderId: order.orderId, totalAmount: total, currency: 'USD', paymentKey: 'reduced-key', method: '카드'});
  }) as any;
  sent.reviews.length = 0;
  assert.equal((await finalizePaidApplication({orderId: order.orderId, paymentKey: 'reduced-key', amount: 20})).code, 'paymentUnconfirmed');
  assert.equal(sent.reviews.length, 1);
  assert.deepEqual(await resolvePendingCheckout(p4), {state: 'wait'});
  // The provider's record must match the order's own amount: a done payment for another amount is not accepted.
  state = 'DONE'; total = 50;
  assert.equal((await beginApplicationCheckout(p4, s.form, REDUCE)).code, 'checkoutReview');
  assert.equal(await db.application.count({where: {userId: s.id}}), 0);
  total = 20;
  const before = await uses(REDUCE);
  const settled = await resolvePendingCheckout(p4);
  assert.equal(settled.state, 'paid', JSON.stringify(settled));
  const recorded = await payment(settled.applicationId);
  assert.deepEqual({feeStatus: recorded.feeStatus, amount: recorded.amount, code: recorded.code}, {feeStatus: 'PAID', amount: 20, code: REDUCE});
  assert.equal(await uses(REDUCE), before + 1);
  assert.deepEqual(await resolvePendingCheckout(p4), {state: 'none'});
  assert.equal(await uses(REDUCE), before + 1);
  assert.equal(posts, 1);

  // 2. The applicant presses Pay again without the code while the earlier reduced payment is done: it is recorded at
  //    the reduced amount instead of a second, full-price charge.
  const t = await student('repay');
  t.signIn();
  const earlier = await beginApplicationCheckout(p5, t.form, REDUCE);
  state = 'IN_PROGRESS';
  globalThis.fetch = (async (_url: any, init?: any) => {
    if (init?.method === 'POST') { posts++; return Response.json({code: 'PROVIDER_ERROR'}, {status: 500}); }
    return Response.json({status: state, orderId: earlier.orderId, totalAmount: 20, currency: 'USD', paymentKey: 'repay-key', method: '카드'});
  }) as any;
  assert.equal((await finalizePaidApplication({orderId: earlier.orderId, paymentKey: 'repay-key', amount: 20})).code, 'paymentUnconfirmed');
  state = 'DONE';
  const repay = await beginApplicationCheckout(p5, t.form);
  assert.equal(repay.alreadyPaid, true, JSON.stringify(repay));
  assert.equal((await payment(repay.applicationId)).amount, 20);
  assert.equal(await db.application.count({where: {userId: t.id}}), 1);
  assert.equal(await uses(REDUCE), before + 2);
});

test('a waiving code works until its last moment whatever the database session time zone, and says why it stops', async () => {
  // This file runs its database session in Korea's zone (see the top): make sure that really took effect.
  assert.deepEqual(await db.$queryRaw`SHOW TimeZone`, [{TimeZone: 'Asia/Seoul'}]);
  // Expires in three hours: a comparison done in a non-UTC session would already call it expired (Korea is UTC+9).
  const SOON = `S${K}`, ONCE = `O${K}`;
  await db.feeCode.createMany({data: [{code: SOON, partner: 'Ends today', feeAmount: 0, expiresAt: new Date(Date.now() + 3 * 3600_000)}, {code: ONCE, partner: 'One use', feeAmount: 0, maxUses: 1}]});
  const a = await student('soon');
  a.signIn();
  assert.deepEqual(await checkFeeCode(SOON), {ok: true, code: SOON, feeAmount: 0});
  const done = await submitApplicationWithoutFee(p6, a.form, SOON);
  assert.ok(done.success && !done.duplicate, JSON.stringify(done));
  const row = await db.feeCode.findUniqueOrThrow({where: {code: SOON}});
  assert.equal(row.usedCount, 1);
  // The raw statement writes the same UTC clock Prisma does.
  assert.ok(Math.abs(row.updatedAt.getTime() - Date.now()) < 60_000, row.updatedAt.toISOString());
  // Used up, then switched off: the refusal names the reason the form can show.
  const b = await student('once1'), c = await student('once2');
  b.signIn();
  assert.ok((await submitApplicationWithoutFee(p6, b.form, ONCE)).success);
  c.signIn();
  assert.equal((await submitApplicationWithoutFee(p6, c.form, ONCE)).code, 'feeCodeUsedUp');
  await db.feeCode.update({where: {code: SOON}, data: {active: false}});
  assert.equal((await submitApplicationWithoutFee(p6, c.form, SOON)).code, 'feeCodeInvalid');
  assert.equal(await db.application.count({where: {userId: c.id}}), 0);
});

test('reduced fee: a declined attempt keeps the price and counts nothing; a stale order with a dead code is not charged', async () => {
  const s = await student('declined');
  s.signIn();
  const before = await uses(REDUCE);
  const first = await beginApplicationCheckout(p7, s.form, REDUCE);
  assert.equal(first.amount, 20, JSON.stringify(first));
  globalThis.fetch = (async (_url: any, init?: any) => init?.method === 'POST' ? Response.json({code: 'REJECT_CARD_COMPANY', message: 'declined'}, {status: 403}) : Response.json({status: 'ABORTED', orderId: first.orderId, totalAmount: 20, currency: 'USD'})) as any;
  assert.equal((await finalizePaidApplication({orderId: first.orderId, paymentKey: 'declined-key', amount: 20})).code, 'paymentDeclined');
  assert.equal(await db.applicationCheckout.count({where: {userId: s.id}}), 0);
  assert.equal(await db.applicationDraft.count({where: {userId: s.id, programId: p7}}), 1);
  assert.equal(await uses(REDUCE), before);
  // The retry is priced with the code again, under a new order number.
  const retry = await beginApplicationCheckout(p7, s.form, REDUCE);
  assert.equal(retry.amount, 20); assert.notEqual(retry.orderId, first.orderId);
  assert.equal(await db.applicationCheckout.findUnique({where: {id: retry.orderId}}).then(row => row?.feeCode), REDUCE);

  // The order is older than 30 minutes and the code has been switched off since: nothing is charged, the order goes,
  // the draft stays, and the applicant prices a new order from the form.
  await db.applicationCheckout.update({where: {id: retry.orderId}, data: {expiresAt: new Date(Date.now() - 1000)}});
  await db.feeCode.update({where: {code: REDUCE}, data: {active: false}});
  // The form re-checks the dead code of the applicant's own unpaid order on every load: that never uses up their
  // tries for typing another code.
  for (let i = 0; i < 12; i++) assert.deepEqual(await checkFeeCode(REDUCE, true), {ok: false, code: 'feeCodeInvalid'});
  assert.deepEqual(await checkFeeCode(WAIVE), {ok: true, code: WAIVE, feeAmount: 0});
  const provider = approvingProvider(retry.orderId, 20);
  const lapsed = await finalizePaidApplication({orderId: retry.orderId, paymentKey: `key-${retry.orderId}`, amount: 20});
  assert.equal(lapsed.code, 'feeCodeLapsed', JSON.stringify(lapsed));
  assert.equal(provider.posts.length, 0);
  assert.equal(await db.applicationCheckout.count({where: {userId: s.id}}), 0);
  assert.equal(await db.applicationDraft.count({where: {userId: s.id, programId: p7}}), 1);
  assert.equal(await db.application.count({where: {userId: s.id}}), 0);
  assert.equal((await beginApplicationCheckout(p7, s.form, REDUCE)).code, 'feeCodeInvalid');
  // While the code works, an order older than 30 minutes is still honoured.
  await db.feeCode.update({where: {code: REDUCE}, data: {active: true}});
  const old = await beginApplicationCheckout(p7, s.form, REDUCE);
  await db.applicationCheckout.update({where: {id: old.orderId}, data: {expiresAt: new Date(Date.now() - 1000)}});
  approvingProvider(old.orderId, 20);
  const paid = await finalizePaidApplication({orderId: old.orderId, paymentKey: `key-${old.orderId}`, amount: 20});
  assert.equal(paid.success, true, JSON.stringify(paid));
  assert.equal(await uses(REDUCE), before + 1);
});

test('an unsettled payment is escalated to admissions after 40 minutes, with the amount and code of the order', async () => {
  const s = await student('slow');
  s.signIn();
  const order = await beginApplicationCheckout(p6, s.form, REDUCE);
  let state = 'IN_PROGRESS';
  globalThis.fetch = (async (_url: any, init?: any) => init?.method === 'POST' ? Response.json({code: 'PROVIDER_ERROR'}, {status: 500}) : Response.json({status: state, orderId: order.orderId, totalAmount: 20, currency: 'USD', paymentKey: 'slow-key'})) as any;
  sent.reviews.length = 0;
  assert.equal((await finalizePaidApplication({orderId: order.orderId, paymentKey: 'slow-key', amount: 20})).code, 'paymentUnconfirmed');
  // The first alert names what the Toss admin should show for this order.
  assert.equal(sent.reviews.length, 1);
  assert.match(sent.reviews[0].expected, new RegExp(`^20\\.00 USD \\(referral code ${REDUCE}; the normal fee is 50\\.00 USD\\)$`));
  await db.applicationCheckout.update({where: {id: order.orderId}, data: {paymentKeyAt: new Date(Date.now() - 39 * 60_000)}});
  assert.deepEqual(await resolvePendingCheckout(p6), {state: 'wait'});
  await db.applicationCheckout.update({where: {id: order.orderId}, data: {paymentKeyAt: new Date(Date.now() - 41 * 60_000)}});
  assert.deepEqual(await resolvePendingCheckout(p6), {state: 'review'});
  assert.deepEqual(await resolvePendingCheckout(p6), {state: 'review'});
  // At most one mail an hour per order: the alert from the confirm already used it.
  assert.equal(sent.reviews.length, 1);
  // The provider lets the payment expire: the order is released and the form is editable again.
  state = 'EXPIRED';
  assert.deepEqual(await resolvePendingCheckout(p6), {state: 'released'});
  assert.equal(await db.applicationCheckout.count({where: {userId: s.id}}), 0);
  assert.equal(await db.applicationDraft.count({where: {userId: s.id, programId: p6}}), 1);

  // The 40-minute mail on its own: the server stored the key and never heard back (no alert was sent at confirm).
  const t = await student('silent');
  t.signIn();
  const silent = `CRI_silent_${key}`;
  await db.applicationCheckout.create({data: {id: silent, userId: t.id, programId: p6, status: 'PENDING', amount: 20, currency: 'USD', feeCode: REDUCE, formData: t.form, keyTracked: true, paymentKey: 'silent-key', paymentKeyAt: new Date(Date.now() - 41 * 60_000), expiresAt: new Date(Date.now() - 11 * 60_000)}});
  globalThis.fetch = (async () => Response.json({status: 'IN_PROGRESS', orderId: silent, totalAmount: 20, currency: 'USD', paymentKey: 'silent-key'})) as any;
  sent.reviews.length = 0;
  assert.deepEqual(await resolvePendingCheckout(p6), {state: 'review'});
  assert.equal(sent.reviews.length, 1);
  assert.deepEqual({order: sent.reviews[0].orderId, expected: sent.reviews[0].expected, program: sent.reviews[0].programTitle}, {order: silent, expected: `20.00 USD (referral code ${REDUCE}; the normal fee is 50.00 USD)`, program: 'QA Codes 6'});
});

test('a failure in the payment window is reported to admissions with its code only, within its own budget', async () => {
  const s = await student('failed');
  s.signIn();
  sent.problems.length = 0;
  // From the failure page: the code is cleaned, and free text from the address bar is never passed on.
  await reportPaymentProblem(p1, 'return', '20 03<script>', 'text anyone could put in the address bar');
  assert.deepEqual(sent.problems, [{accountEmail: `failed-${key}@example.test`, programTitle: 'QA Codes 1', where: 'return', code: '2003script', message: ''}]);
  // Three reports per account in ten minutes, then silence.
  await reportPaymentProblem(p1, 'return', '2003');
  await reportPaymentProblem(p1, 'return', '2003');
  await reportPaymentProblem(p1, 'return', '2003');
  assert.equal(sent.problems.length, 3);
  // A payment form that does not load is a different alarm with its own budget, and keeps the SDK's message.
  await reportPaymentProblem(p1, 'form', 'INVALID_CLIENT_KEY', 'The   key is\nwrong');
  assert.deepEqual(sent.problems[3], {accountEmail: `failed-${key}@example.test`, programTitle: 'QA Codes 1', where: 'form', code: 'INVALID_CLIENT_KEY', message: 'The key is wrong'});
  // Signed out: nothing.
  session = null;
  await reportPaymentProblem(p1, 'return', '2003');
  assert.equal(sent.problems.length, 4);
});

test('deleting an application frees the account to apply again and gives the code use back', async () => {
  const s = await student('deleted');
  s.signIn();
  const before = await uses(REDUCE);
  const order = await beginApplicationCheckout(p7, s.form, REDUCE);
  approvingProvider(order.orderId, 20);
  const paid = await finalizePaidApplication({orderId: order.orderId, paymentKey: `key-${order.orderId}`, amount: 20});
  assert.equal(paid.success, true, JSON.stringify(paid));
  assert.equal(await uses(REDUCE), before + 1);
  assert.equal((await db.applicationCheckout.findUnique({where: {id: order.orderId}}))?.status, 'COMPLETED');
  // Not for applicants.
  assert.equal((await deleteApplication(paid.applicationId)).success, false);
  asAdmin();
  assert.equal((await deleteApplication(paid.applicationId)).success, true);
  assert.equal(await db.application.count({where: {userId: s.id}}), 0);
  assert.equal(await uses(REDUCE), before);
  // The order stays as the site's record of the payment, set aside so it no longer stands for the program.
  const kept = await db.applicationCheckout.findUniqueOrThrow({where: {id: order.orderId}});
  assert.deepEqual({status: kept.status, key: kept.paymentKey, amount: kept.amount, code: kept.feeCode, moved: kept.programId !== p7 && kept.programId.startsWith(p7)}, {status: 'REMOVED', key: `key-${order.orderId}`, amount: 20, code: REDUCE, moved: true});
  // Its old receipt page says what happened, and nothing is confirmed for it again.
  s.signIn();
  const provider = approvingProvider(order.orderId, 20);
  assert.equal((await settleReturnedOrder(order.orderId)).code, 'applicationRemoved');
  assert.equal((await finalizePaidApplication({orderId: order.orderId, paymentKey: `key-${order.orderId}`, amount: 20})).code, 'applicationRemoved');
  assert.equal(provider.posts.length, 0);
  assert.equal(await db.application.count({where: {userId: s.id}}), 0);
  // The same account can save a draft and pay for the same program again, under a new order.
  const again = await beginApplicationCheckout(p7, s.form, REDUCE);
  assert.ok(again.orderId && again.orderId !== order.orderId && again.amount === 20, JSON.stringify(again));
  assert.equal(await db.applicationCheckout.count({where: {userId: s.id}}), 2);

  // A waived application: the use comes back too, and an unsettled payment row of that account is never touched.
  const w = await student('deletedwaived');
  w.signIn();
  const waivedBefore = await uses(WAIVE);
  const waived = await submitApplicationWithoutFee(p7, w.form, WAIVE);
  assert.ok(waived.success, JSON.stringify(waived));
  assert.equal(await uses(WAIVE), waivedBefore + 1);
  await db.applicationCheckout.create({data: {id: `CRI_keep_${key}`, userId: w.id, programId: p7, status: 'PENDING', amount: 50, currency: 'USD', formData: {}, keyTracked: true, paymentKey: 'unsettled', paymentKeyAt: new Date(), expiresAt: new Date(Date.now() + 60_000)}});
  asAdmin();
  assert.equal((await deleteApplication(waived.applicationId)).success, true);
  assert.equal(await uses(WAIVE), waivedBefore);
  assert.equal(await db.applicationCheckout.count({where: {id: `CRI_keep_${key}`}}), 1);
});
