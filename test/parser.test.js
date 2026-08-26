import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { extractDateRanges, parseMessages } from '../parser.js';

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

test('extracts and deduplicates events from the Telegram scrape', () => {
  const input = readFileSync(new URL('../messages.txt', import.meta.url), 'utf8');
  const result = parseMessages(input);
  const declaredMessageCount = Number(input.match(/^Total Messages:\s*(\d+)/m)?.[1]);

  assert.equal(result.messages.length, declaredMessageCount);
  assert.ok(result.events.length > 0);

  const history = result.events.find(event => event.telegramMessageId === 43372);
  assert.equal(history.registrationLink, 'https://q.me-qr.com/w10xtbfb');
  assert.equal(history.mycsdProvided, true);
  assert.deepEqual(history.schedules.map(item => [item.kind, item.start, item.end]), [
    ['interview', '2026-09-12', '2026-09-13'],
    ['deadline', '2026-09-07', '2026-09-07']
  ]);

  const perkim = result.events.find(event => event.telegramMessageId === 43365);
  assert.equal(perkim.title, 'Pendaftaran Calon Exco PERKIM USM');
  assert.equal(perkim.contacts.length, 2);

  const acsEvents = result.events.filter(event => event.registrationLink === 'https://forms.gle/8CxUcDMZN9zZsCXVA');
  assert.equal(acsEvents.length, 1);

  assert.equal(result.events.some(event => event.telegramMessageId === 43347), false);
  assert.equal(result.events.some(event => event.telegramMessageId === 43353), false);
});
