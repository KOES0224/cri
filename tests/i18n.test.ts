import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dictionaries, LOCALES, DEFAULT_LOCALE, isLocale} from '../src/i18n/config';
import {programFacts, programDate} from '../src/lib/program-policy';
import {admissionLabelLocalized, formatProgramDate, formatProgramDateRange, programFactsLocalized, programFormatLocalized, programNameLocalized} from '../src/lib/program-facts-i18n';

/** Describes the shape of a dictionary so every locale can be compared against English. */
function shape(value: unknown, path = ''): string[] {
  if (typeof value === 'function') return [`${path}:fn`];
  if (Array.isArray(value)) return value.flatMap((item, index) => shape(item, `${path}[${index}]`));
  if (value && typeof value === 'object') return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => shape(item, `${path}.${key}`)).sort();
  return [`${path}:${typeof value}`];
}

test('every locale mirrors the English dictionary shape', () => {
  assert.equal(DEFAULT_LOCALE, 'en');
  assert.equal(isLocale('ko'), true); assert.equal(isLocale('fr'), false); assert.equal(isLocale(undefined), false);
  const reference = shape(dictionaries.en);
  for (const locale of LOCALES) {
    const own = shape(dictionaries[locale]).filter(entry => !entry.startsWith('.apply.fields.'));
    assert.deepEqual(own, reference.filter(entry => !entry.startsWith('.apply.fields.')), `dictionary ${locale} differs from en`);
  }
  // Korean field labels must only use keys that exist in English application labels.
  assert.equal(Object.keys(dictionaries.ko.apply.fields).length > 0, true);
});

test('English program facts are unchanged by localization', () => {
  for (const category of ['Summer Camp', 'Global Research Program', 'Winter Online', 'Research', 'Custom Category']) {
    const program = {category, capacity: 7, locationFormat: 'Hybrid', teachingHoursProf: '5 hours', teachingHoursTA: '6 hours'};
    assert.deepEqual(programFactsLocalized(program, 'en'), programFacts(program));
  }
});

test('Korean program facts keep program names in English and translate operational facts', () => {
  const winter = programFactsLocalized({category: 'Winter Online'}, 'ko');
  assert.equal(winter.name, 'Winter Online Research Program');
  assert.equal(winter.capacity, 5);
  assert.equal(winter.format, dictionaries.ko.facts.format.online);
  assert.equal(winter.professorHours, '10시간');
  const summer = programFactsLocalized({category: 'Summer Camp', locationFormat: 'Online'}, 'ko');
  assert.equal(summer.format, dictionaries.ko.facts.format.inPerson);
  assert.equal(summer.capacity, 10);
  const individual = programFactsLocalized({category: 'Research'}, 'ko');
  assert.equal(individual.capacity, null); assert.match(individual.duration, /2–4개월/);
  const other = programFactsLocalized({category: 'Custom', locationFormat: 'Hybrid', teachingHoursProf: '5 hours'}, 'ko');
  assert.equal(other.name, 'Custom'); assert.equal(other.format, 'Hybrid'); assert.equal(other.professorHours, '5 hours');
  assert.equal(programNameLocalized('other', 'Legacy', 'ko'), 'Legacy');
  assert.equal(programFormatLocalized('winter', 'Online (Remote)', 'ko'), dictionaries.ko.facts.format.online);
  assert.equal(programFormatLocalized('winter', 'Online (Remote)', 'en'), 'Online (Remote)');
});

test('dates render in Seoul time for both locales', () => {
  const start = '2026-12-19T00:00:00+09:00', end = '2026-12-30T00:00:00+09:00';
  assert.equal(formatProgramDate(start, 'en'), programDate(start));
  assert.equal(formatProgramDateRange(start, end, 'en'), `${programDate(start)} – ${programDate(end)}`);
  assert.equal(formatProgramDate(start, 'ko'), '2026년 12월 19일');
  assert.equal(formatProgramDateRange(start, end, 'ko'), '2026년 12월 19일 – 12월 30일');
  assert.equal(formatProgramDateRange(start, '2027-01-05T00:00:00+09:00', 'ko'), '2026년 12월 19일 – 2027년 1월 5일');
  assert.equal(formatProgramDateRange(start, null, 'ko'), '2026년 12월 19일');
  // The Seoul calendar day is used, not UTC.
  assert.equal(formatProgramDate('2026-12-18T15:30:00Z', 'ko'), '2026년 12월 19일');
});

test('admission labels follow the locale', () => {
  const open = {category: 'Winter', status: 'OPEN', isPublished: true, endDate: '2099-01-01T00:00:00+09:00'};
  assert.equal(admissionLabelLocalized(open, 'en'), 'Accepting Applications');
  assert.equal(admissionLabelLocalized(open, 'ko'), dictionaries.ko.facts.admission.open);
  assert.equal(admissionLabelLocalized({category: 'Winter', status: 'COMPLETED'}, 'ko'), dictionaries.ko.facts.admission.ended);
});
