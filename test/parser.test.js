import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { extractDateRanges, parseMessages } from '../parser.js';

const input = readFileSync(new URL('../messages.txt', import.meta.url), 'utf8');
const result = parseMessages(input);
const eventById = new Map(result.events.map(event => [event.telegramMessageId, event]));

function getEvent(id) {
  const event = eventById.get(id);
  assert.ok(event, `expected message ${id} to produce an event`);
  return event;
}

function schedulesOf(event) {
  return event.schedules.map(item => [item.kind, item.start, item.end]);
}

test('normalizes common English and Malay date ranges', () => {
  assert.deepEqual(extractDateRanges('12 - 13 September 2026'), [
    { start: '2026-09-12', end: '2026-09-13', raw: '12 - 13 September 2026' }
  ]);
  assert.deepEqual(extractDateRanges('4 OGOS SEHINGGA 19 OGOS 2026'), [
    { start: '2026-08-04', end: '2026-08-19', raw: '4 OGOS SEHINGGA 19 OGOS 2026' }
  ]);
  assert.deepEqual(extractDateRanges('3rd August - 15th August 2026'), [
    { start: '2026-08-03', end: '2026-08-15', raw: '3 August - 15 August 2026' }
  ]);
});

test('normalizes cross-month, numeric, weekday, and abbreviated dates', () => {
  assert.deepEqual(extractDateRanges('28 Oktober – 4 November 2026'), [
    { start: '2026-10-28', end: '2026-11-04', raw: '28 Oktober – 4 November 2026' }
  ]);
  assert.deepEqual(extractDateRanges('12/09/2026 - 13/09/2026'), [
    { start: '2026-09-12', end: '2026-09-13', raw: '12/09/2026 - 13/09/2026' }
  ]);
  assert.deepEqual(extractDateRanges('2 November 2026 (Monday)'), [
    { start: '2026-11-02', end: '2026-11-02', raw: '2 November 2026' }
  ]);
  assert.deepEqual(extractDateRanges('28 Okt: WHO AM I?'), [
    { start: '2026-10-28', end: '2026-10-28', raw: '28 Okt' }
  ]);
});

test('reads every scraped message, including optional view metadata', () => {
  const declaredMessageCount = Number(input.match(/^Total Messages:\s*(\d+)/m)?.[1]);
  assert.equal(result.messages.length, declaredMessageCount);
  assert.equal(result.messages.length, 150);
  assert.equal(result.messages[0].telegramMessageId, 44126);
  assert.equal(result.messages[0].views, '1892 | Forwards: 24');
});

test('excludes empty media posts, admin notices, and personal messages', () => {
  const excluded = [44106, 44104, 44103, 44066, 44063, 44062, 44029, 44028, 44007, 44005, 44004, 44003, 43987];
  for (const id of excluded) {
    assert.equal(eventById.has(id), false, `message ${id} should not become an event`);
  }
});

test('deduplicates reposts and keeps the latest message', () => {
  assert.equal(result.events.length, 65);
  assert.equal(result.candidates.length, 137);

  const webinar = getEvent(44085);
  assert.match(webinar.title, /^LDL-C - THE EARLIER, THE BETTER\?/);
  assert.equal(webinar.category, 'Webinar');
  assert.equal(webinar.registrationLink, 'https://forms.gle/2EtBHMkpEKGYT8Ta6');

  for (const duplicate of [44084, 44042, 43980]) {
    assert.equal(eventById.has(duplicate), false, `message ${duplicate} should be merged into 44085`);
  }
});

test('keeps unrelated events that share the carnival registration link', () => {
  const shared = result.events.filter(event => event.registrationLink === 'https://wmhcarnivalmrs2627.base44.app');
  assert.deepEqual(shared.map(event => event.telegramMessageId).sort((a, b) => a - b), [44026, 44050, 44072]);
  assert.equal(getEvent(44050).title, '3 Siri Online Talk Kesihatan Mental & Penjagaan Diri!');
  assert.equal(getEvent(44072).title, 'WHO AM I?');
  assert.equal(getEvent(44026).title, 'FOAM O RUN');
});

test('extracts quiz, registration, interview, and deadline schedules', () => {
  assert.deepEqual(schedulesOf(getEvent(44111)), [['event', '2026-10-20', '2026-11-05']]);
  assert.deepEqual(schedulesOf(getEvent(44123)), [['event', '2026-11-05', '2026-11-19']]);
  assert.deepEqual(schedulesOf(getEvent(44110)), [
    ['registration', '2026-10-19', '2026-11-07'],
    ['event', '2026-11-08', '2026-11-08']
  ]);
  assert.deepEqual(schedulesOf(getEvent(44074)), [
    ['event', '2026-11-07', '2026-11-07'],
    ['deadline', '2026-11-06', '2026-11-06']
  ]);
  assert.deepEqual(schedulesOf(getEvent(44067)), [
    ['deadline', '2026-10-27', '2026-10-27'],
    ['interview', '2026-10-30', '2026-10-31']
  ]);
  assert.deepEqual(schedulesOf(getEvent(44031)), [
    ['registration', '2026-10-15', '2026-10-31'],
    ['interview', '2026-11-01', '2026-11-02']
  ]);
  assert.deepEqual(schedulesOf(getEvent(44050)), [
    ['event', '2026-10-28', '2026-10-28'],
    ['event', '2026-11-04', '2026-11-04']
  ]);
});

test('handles events that do not advertise dates', () => {
  for (const id of [44039, 44013, 43995]) {
    assert.deepEqual(schedulesOf(getEvent(id)), []);
  }
});

test('extracts registration fees and free admission', () => {
  assert.deepEqual(getEvent(44074).fee, { free: false, amount: 'RM35' });
  assert.deepEqual(getEvent(44026).fee, { free: false, amount: 'RM18' });
  assert.deepEqual(getEvent(44050).fee, { free: false, amount: 'RM2' });
  assert.deepEqual(getEvent(44113).fee, { free: true, amount: null });
  assert.deepEqual(getEvent(43995).fee, { free: true, amount: null });
  assert.deepEqual(getEvent(44108).fee, { free: null, amount: null });
});

test('extracts clean titles and categories', () => {
  const expectations = new Map([
    [44124, ['Leprosy Awareness Talk', 'Talk']],
    [44125, ['Virtual Fun Run Lawatan Akademik 26/27', 'Sports']],
    [44081, ['BEYOND THE TEMPLATE: Designing Better Content with Canva & AI', 'Workshop']],
    [44112, ['Public Health Campaign 26/27: Quiz Challenge 1: From A to Z: Your Guide to Vitamins & Everyday Wellness', 'Quiz']],
    [44107, ['WIE IS RECRUITING!', 'Recruitment']],
    [44016, ['PENCARIAN AHLI AKTIF SEKRETARIAT IBOS USM', 'Membership']],
    [44034, ['JM 12.0 & COP 6.0: Photography Competition', 'Competition']],
    [44122, ['WEBINAR 2: ARTIFICIAL INTELLIGENCE IN HEALTHCARE: THE FUTURE OF PHARMACY', 'Webinar']]
  ]);
  for (const [id, [title, category]] of expectations) {
    const event = getEvent(id);
    assert.equal(event.title, title);
    assert.equal(event.category, category);
  }

  for (const event of result.events) {
    assert.ok(event.title.length > 0);
    assert.doesNotMatch(event.title, /^(?:MAKLUMAT PROGRAM|Daftar Sekarang|Registration Link|Webinar 1 - Countdown)/i);
  }
});

test('cleans markdown links and extracts contacts', () => {
  assert.equal(getEvent(44124).registrationLink, 'https://forms.gle/oAkk9xtdmJuHSmyB7');
  assert.equal(getEvent(44067).registrationLink, 'https://forms.gle/dSHYYX3ytfmqTTZ67');
  assert.equal(getEvent(43989).registrationLink, null);

  assert.deepEqual(getEvent(44067).contacts.map(contact => contact.phone), ['010-3902376', '012-2939138']);
  assert.equal(getEvent(44124).contacts.length, 2);
  assert.equal(getEvent(44085).contacts.length, 2);

  for (const event of result.events) {
    assert.equal(event.sourceUrl, `https://t.me/mycsd/${event.telegramMessageId}`);
    if (event.registrationLink) assert.match(event.registrationLink, /^https:\/\//);
  }
});
