import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calendarFilename,
  createAppleSubscriptionUrl,
  createGoogleCalendarUrl,
  createGoogleSubscriptionUrl,
  createIcsCalendar
} from '../src/lib/calendar.js';

const event = {
  id: 42,
  telegram_message_id: 43372,
  date_posted: '2026-08-25T13:44:13+00:00',
  title: 'Leadership, Service; USM',
  description: 'First line\nSecond line',
  venue: 'Dewan A, USM',
  time: '8:00 PM',
  registration_link: 'https://example.com/register'
};

const schedule = { label: 'Interview', kind: 'interview', start: '2026-09-12', end: '2026-09-13' };

test('creates an Apple-compatible all-day ICS event', () => {
  const ics = createIcsCalendar([{ event, schedule, index: 1 }]);

  assert.match(ics, /UID:43372-1-interview@mycsd-hunter/);
  assert.match(ics, /DTSTART;VALUE=DATE:20260912/);
  assert.match(ics, /DTEND;VALUE=DATE:20260914/);
  assert.match(ics, /SUMMARY:Interview: Leadership\\, Service\\; USM/);
  assert.match(ics, /DESCRIPTION:First line\\nSecond line/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 1);
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75, `ICS line exceeds 75 bytes: ${line}`);
});

test('creates Google and subscription calendar links', () => {
  const google = new URL(createGoogleCalendarUrl(event, schedule));
  assert.equal(google.searchParams.get('dates'), '20260912/20260914');
  assert.equal(google.searchParams.get('text'), 'Interview: Leadership, Service; USM');
  assert.equal(google.searchParams.get('location'), 'Dewan A, USM');

  const feed = 'https://wanadamm.github.io/MyCSD-Hunter/calendar.ics';
  assert.equal(new URL(createGoogleSubscriptionUrl(feed)).searchParams.get('cid'), feed);
  assert.equal(createAppleSubscriptionUrl(feed), 'webcal://wanadamm.github.io/MyCSD-Hunter/calendar.ics');
  assert.equal(calendarFilename(event), 'leadership-service-usm.ics');
});
