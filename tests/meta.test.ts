import test from 'node:test';
import assert from 'node:assert/strict';

// The env module is imported first: the meta modules read their environment at load time.
import './helpers/meta-env';
import { normalizePhone, normalizeEmail, normalizeCountry, sha256 } from '../src/lib/meta/normalize';
import { applicantRegion, applicantTypeFromRole, metaHostAllowed, programContent, cleanCustomData, META_VALUES } from '../src/lib/meta/config';
import { buildMetaPayload, metaServerEnabled, safeEventId, metaCustomData } from '../src/lib/meta/payload';

test('phone numbers become E.164 digits for the markets CRI recruits from', () => {
  assert.equal(normalizePhone('010-1234-5678', 'KR'), '821012345678');
  assert.equal(normalizePhone('+82 10-1234-5678'), '821012345678');
  assert.equal(normalizePhone('010 1234 5678'), '821012345678'); // no country: Korean pattern
  assert.equal(normalizePhone('(415) 555-0100', 'US'), '14155550100');
  assert.equal(normalizePhone('1 415 555 0100', 'US'), '14155550100');
  assert.equal(normalizePhone('0912 345 678', 'VN'), '84912345678');
  assert.equal(normalizePhone('081 234 5678', 'TH'), '66812345678');
  assert.equal(normalizePhone('0812-3456-7890', 'ID'), '6281234567890');
  assert.equal(normalizePhone('0917 123 4567', 'PH'), '639171234567');
  assert.equal(normalizePhone('98765 43210', 'IN'), '919876543210');
  assert.equal(normalizePhone('0016505550100'), '16505550100');
  assert.equal(normalizePhone('123', 'KR'), undefined);
  assert.equal(normalizePhone('', 'KR'), undefined);
  assert.equal(normalizePhone('not a phone'), undefined);
});

test('emails and countries are normalised before hashing; invalid values are dropped', () => {
  assert.equal(normalizeEmail('  Parent@Example.COM '), 'parent@example.com');
  assert.equal(normalizeEmail('nope'), undefined);
  assert.equal(normalizeCountry('KR'), 'kr');
  assert.equal(normalizeCountry('Korea'), undefined);
  assert.match(sha256('parent@example.com'), /^[0-9a-f]{64}$/);
});

test('ad reporting dimensions: region, applicant type and content name', () => {
  assert.equal(applicantRegion('KR'), 'KR');
  assert.equal(applicantRegion('vn'), 'SEA');
  assert.equal(applicantRegion('US'), 'NA');
  assert.equal(applicantRegion('DE'), 'OTHER');
  assert.equal(applicantRegion(''), undefined);
  assert.equal(applicantTypeFromRole('PARENT'), 'parent');
  assert.equal(applicantTypeFromRole('STUDENT'), 'student');
  assert.equal(applicantTypeFromRole('ADMIN'), undefined);
  const content = programContent({ id: 'p1', title: 'Behavioral Economics Research', category: 'Research', professors: [{ name: 'David McMillon', university: 'Emory University', relatedMajor: 'Behavioral Economics' }] });
  assert.equal(content.content_name, 'Emory University - David McMillon - Behavioral Economics');
  assert.equal(content.content_category, 'Behavioral Economics');
  assert.deepEqual(content.content_ids, ['p1']);
  // No professor yet: fall back to the program title and category.
  const bare = programContent({ id: 'p2', title: 'Winter Online', category: 'Research', subCategory: 'Online', professors: [] });
  assert.equal(bare.content_name, 'Winter Online');
  assert.equal(bare.content_category, 'Online');
  assert.deepEqual(cleanCustomData({ content_name: 'x', value: undefined, currency: '', content_ids: [] }), { content_name: 'x' });
  assert.equal(META_VALUES.lead, 25);
  assert.equal(META_VALUES.submitApplication, undefined);
});

test('only the production hostnames may send events', () => {
  assert.equal(metaHostAllowed('criglobal.org'), true);
  assert.equal(metaHostAllowed('www.criglobal.org'), true);
  assert.equal(metaHostAllowed('CRIGLOBAL.ORG:443'), true);
  assert.equal(metaHostAllowed('cri-portal-2024.vercel.app'), false);
  assert.equal(metaHostAllowed('cri-git-claude-meta-capi.vercel.app'), false);
  assert.equal(metaHostAllowed('localhost:3000'), false);
  assert.equal(metaHostAllowed(null), false);
  const base = { host: 'criglobal.org', ip: '1.2.3.4', userAgent: 'UA', referer: 'https://criglobal.org/contact', fbp: null, fbc: null, attribution: {}, production: true };
  assert.equal(metaServerEnabled(base), true);
  assert.equal(metaServerEnabled({ ...base, production: false }), false);
  assert.equal(metaServerEnabled({ ...base, host: 'cri-portal-2024.vercel.app' }), false);
});

test('browser event ids are validated, never invented', () => {
  assert.equal(safeEventId('7f3d2e6a-1c2b-4d5e-9f0a-1b2c3d4e5f60'), '7f3d2e6a-1c2b-4d5e-9f0a-1b2c3d4e5f60');
  assert.equal(safeEventId('CRI_0b2d7c9e-6f7a-4b1c-8d9e-0f1a2b3c4d5e'), 'CRI_0b2d7c9e-6f7a-4b1c-8d9e-0f1a2b3c4d5e');
  assert.equal(safeEventId('short'), undefined);
  assert.equal(safeEventId('<script>alert(1)</script>'), undefined);
  assert.equal(safeEventId(42), undefined);
});

test('the Conversions API payload carries hashed identifiers, browser ids and the shared event id, never raw PII', () => {
  const ctx = { host: 'criglobal.org', ip: '203.0.113.9', userAgent: 'Mozilla/5.0', referer: 'https://criglobal.org/research/program/p1', fbp: 'fb.1.1700000000000.123', fbc: 'fb.1.1700000000000.AbC', attribution: { utm_source: 'meta', utm_campaign: 'summer26' }, production: true };
  const body = buildMetaPayload(ctx, {
    name: 'Lead', eventId: 'evt-12345678',
    person: { email: 'Parent@Example.com', phone: '010-1234-5678', country: 'KR', firstName: 'Min', lastName: 'Kim', externalId: 'user_1' },
    data: { content_name: 'Emory University - David McMillon - Behavioral Economics', applicant_type: 'parent', applicant_region: 'KR', value: 25, currency: 'USD' },
  }, 1_700_000_000_000) as { test_event_code?: string; data: Array<Record<string, unknown>> };
  const event = body.data[0];
  const user = event.user_data as Record<string, string>;
  assert.equal(event.event_name, 'Lead');
  assert.equal(event.event_id, 'evt-12345678');
  assert.equal(event.event_time, 1_700_000_000);
  assert.equal(event.action_source, 'website');
  assert.equal(event.event_source_url, 'https://criglobal.org/research/program/p1');
  assert.equal(body.test_event_code, 'TEST1234');
  assert.equal(user.em, sha256('parent@example.com'));
  assert.equal(user.ph, sha256('821012345678'));
  assert.equal(user.fn, sha256('min'));
  assert.equal(user.ln, sha256('kim'));
  assert.equal(user.country, sha256('kr'));
  assert.equal(user.external_id, sha256('user_1'));
  assert.equal(user.client_ip_address, '203.0.113.9');
  assert.equal(user.client_user_agent, 'Mozilla/5.0');
  assert.equal(user.fbp, 'fb.1.1700000000000.123');
  assert.equal(user.fbc, 'fb.1.1700000000000.AbC');
  const serialised = JSON.stringify(body);
  for (const raw of ['Parent@Example.com', 'parent@example.com', '1234-5678', '821012345678', 'Min', 'Kim', 'user_1', '"kr"']) assert.equal(serialised.includes(raw), false, `raw value leaked: ${raw}`);
  assert.deepEqual(event.custom_data, { utm_source: 'meta', utm_campaign: 'summer26', content_name: 'Emory University - David McMillon - Behavioral Economics', applicant_type: 'parent', applicant_region: 'KR', value: 25, currency: 'USD' });
  // The browser receives the same custom data so both copies of the event match.
  assert.deepEqual(cleanCustomData(metaCustomData(ctx, { value: 25, currency: 'USD' })), { utm_source: 'meta', utm_campaign: 'summer26', value: 25, currency: 'USD' });
});

test('missing identifiers are omitted rather than sent empty', () => {
  const ctx = { host: 'criglobal.org', ip: null, userAgent: null, referer: null, fbp: null, fbc: null, attribution: {}, production: true };
  const body = buildMetaPayload(ctx, { name: 'ViewContent', person: { email: 'bad', phone: '12' } }) as { data: Array<Record<string, unknown>> };
  assert.deepEqual(body.data[0].user_data, {});
  assert.equal('custom_data' in body.data[0], false);
  assert.equal('event_id' in body.data[0] && body.data[0].event_id !== undefined, false);
});
