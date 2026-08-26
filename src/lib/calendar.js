const CALENDAR_NAME = 'MyCSD Hunter';
const TIMEZONE = 'Asia/Kuala_Lumpur';

function addDay(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function compactDate(dateKey) {
  return dateKey.replaceAll('-', '');
}

function timestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '19700101T000000Z';
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcs(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function foldLine(line) {
  const encoder = new TextEncoder();
  let output = '';
  let current = '';
  let bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > 75) {
      output += `${current}\r\n `;
      current = character;
      bytes = 1 + size;
    } else {
      current += character;
      bytes += size;
    }
  }
  return output + current;
}

function titleFor(event, schedule) {
  const title = event.title || event.organization || 'MyCSD event';
  return schedule.label === 'Event' ? title : `${schedule.label}: ${title}`;
}

function descriptionFor(event) {
  return [
    event.description,
    event.time && `Time: ${event.time}`,
    event.interview_platform && `Platform: ${event.interview_platform}`,
    event.registration_link && `Registration: ${event.registration_link}`,
    event.source_url && `Source: ${event.source_url}`
  ].filter(Boolean).join('\n\n');
}

function eventLines({ event, schedule, index = 0 }) {
  const identifier = event.telegram_message_id || event.id;
  const location = event.venue || event.interview_platform;
  const url = event.registration_link || event.source_url;
  const lines = [
    'BEGIN:VEVENT',
    `UID:${identifier}-${index}-${schedule.kind}@mycsd-hunter`,
    `DTSTAMP:${timestamp(event.date_posted)}`,
    `DTSTART;VALUE=DATE:${compactDate(schedule.start)}`,
    `DTEND;VALUE=DATE:${compactDate(addDay(schedule.end))}`,
    `SUMMARY:${escapeIcs(titleFor(event, schedule))}`,
    `DESCRIPTION:${escapeIcs(descriptionFor(event))}`
  ];
  if (location) lines.push(`LOCATION:${escapeIcs(location)}`);
  if (url) lines.push(`URL:${escapeIcs(url)}`);
  lines.push('STATUS:CONFIRMED', 'TRANSP:TRANSPARENT', 'END:VEVENT');
  return lines;
}

export function createIcsCalendar(items, name = CALENDAR_NAME) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MyCSD Hunter//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcs(name)}`,
    `X-WR-TIMEZONE:${TIMEZONE}`,
    ...items.flatMap(eventLines),
    'END:VCALENDAR'
  ];
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}

export function createGoogleCalendarUrl(event, schedule) {
  const parameters = new URLSearchParams({
    action: 'TEMPLATE',
    text: titleFor(event, schedule),
    dates: `${compactDate(schedule.start)}/${compactDate(addDay(schedule.end))}`,
    details: descriptionFor(event).slice(0, 1500),
    ctz: TIMEZONE
  });
  const location = event.venue || event.interview_platform;
  if (location) parameters.set('location', location);
  return `https://calendar.google.com/calendar/render?${parameters}`;
}

export function createGoogleSubscriptionUrl(feedUrl) {
  return `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(feedUrl)}`;
}

export function createAppleSubscriptionUrl(feedUrl) {
  const url = new URL(feedUrl);
  return `webcal://${url.host}${url.pathname}${url.search}${url.hash}`;
}

export function calendarFilename(event) {
  const title = event.title || event.organization || 'mycsd-event';
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'mycsd-event'}.ics`;
}
