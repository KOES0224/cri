import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultCardOrigin, tossCardOptions } from '../src/lib/toss-card';

test('overseas applicants get the international card window in a sensible language', () => {
  assert.equal(defaultCardOrigin('KR'), 'domestic');
  assert.equal(defaultCardOrigin('us'), 'international');
  assert.equal(defaultCardOrigin(''), 'international');
  assert.deepEqual(tossCardOptions('domestic', 'ko', 'KR'), {});
  assert.deepEqual(tossCardOptions('international', 'en', 'US'), { useInternationalCardOnly: true, language: 'EN' });
  assert.deepEqual(tossCardOptions('international', 'en', 'TW'), { useInternationalCardOnly: true, language: 'ZH' });
  assert.deepEqual(tossCardOptions('international', 'en', 'JP'), { useInternationalCardOnly: true, language: 'JA' });
  // A Korean-speaking family abroad keeps Korean.
  assert.deepEqual(tossCardOptions('international', 'ko', 'VN'), { useInternationalCardOnly: true, language: 'KO' });
});
