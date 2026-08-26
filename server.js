import { readFileSync, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { parseMessages } from './parser.js';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const DATA_FILE = join(ROOT, 'messages.txt');
const DB_FILE = join(ROOT, 'data', 'mycsd.sqlite');
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.PORT || 3000);

const db = new DatabaseSync(DB_FILE);
db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    dedupe_key TEXT NOT NULL UNIQUE,
    telegram_message_id INTEGER NOT NULL,
    posted_at TEXT NOT NULL,
    title TEXT NOT NULL,
    organizer TEXT,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    registration_link TEXT,
    venue TEXT,
    platform TEXT,
    time_text TEXT,
    mycsd_provided INTEGER NOT NULL DEFAULT 0,
    source_url TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS source_messages (
    telegram_message_id INTEGER PRIMARY KEY,
    posted_at TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    media_type TEXT,
    raw_text TEXT NOT NULL,
    event_id INTEGER REFERENCES events(id) ON DELETE SET NULL
  );
  CREATE TABLE IF NOT EXISTS calendar_entries (
    id INTEGER PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    kind TEXT NOT NULL CHECK(kind IN ('event', 'interview', 'registration', 'deadline')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    raw_value TEXT
  );
  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS calendar_event_index ON calendar_entries(event_id);
  CREATE INDEX IF NOT EXISTS contacts_event_index ON contacts(event_id);
`);

function importMessages() {
  if (!existsSync(DATA_FILE)) throw new Error(`Missing source file: ${DATA_FILE}`);
  const parsed = parseMessages(readFileSync(DATA_FILE, 'utf8'));
  const insertEvent = db.prepare(`
    INSERT INTO events (
      dedupe_key, telegram_message_id, posted_at, title, organizer, category, description,
      registration_link, venue, platform, time_text, mycsd_provided, source_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSource = db.prepare(`
    INSERT INTO source_messages (telegram_message_id, posted_at, sender_id, media_type, raw_text, event_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertSchedule = db.prepare(`
    INSERT INTO calendar_entries (event_id, label, kind, start_date, end_date, raw_value)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertContact = db.prepare('INSERT INTO contacts (event_id, name, phone) VALUES (?, ?, ?)');

  db.exec('BEGIN');
  try {
    db.exec('DELETE FROM source_messages; DELETE FROM contacts; DELETE FROM calendar_entries; DELETE FROM events;');
    const eventIds = new Map();
    for (const event of parsed.events) {
      const result = insertEvent.run(
        event.dedupeKey, event.telegramMessageId, event.postedAt, event.title, event.organizer,
        event.category, event.description, event.registrationLink, event.venue, event.platform,
        event.timeText, Number(event.mycsdProvided), event.sourceUrl
      );
      const eventId = Number(result.lastInsertRowid);
      eventIds.set(event.dedupeKey, eventId);
      for (const item of event.schedules) insertSchedule.run(eventId, item.label, item.kind, item.start, item.end, item.raw);
      for (const contact of event.contacts) insertContact.run(eventId, contact.name, contact.phone);
    }
    for (const message of parsed.messages) {
      const candidate = parsed.candidates.find(event => event.telegramMessageId === message.telegramMessageId);
      insertSource.run(
        message.telegramMessageId, message.postedAt, message.senderId, message.mediaType,
        message.rawText, candidate ? eventIds.get(candidate.dedupeKey) : null
      );
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return { messages: parsed.messages.length, candidates: parsed.candidates.length, events: parsed.events.length };
}

function getEvents() {
  const events = db.prepare('SELECT * FROM events ORDER BY posted_at DESC').all();
  const schedules = db.prepare('SELECT * FROM calendar_entries ORDER BY start_date, id').all();
  const contacts = db.prepare('SELECT * FROM contacts ORDER BY id').all();
  return events.map(event => ({
    id: Number(event.id),
    telegram_message_id: Number(event.telegram_message_id),
    date_posted: event.posted_at,
    title: event.title,
    organization: event.organizer,
    type: event.category,
    description: event.description,
    registration_link: event.registration_link,
    venue: event.venue,
    interview_platform: event.platform,
    time: event.time_text,
    mycsd_provided: Boolean(event.mycsd_provided),
    source_url: event.source_url,
    calendar_entries: schedules.filter(item => item.event_id === event.id).map(item => ({
      label: item.label,
      kind: item.kind,
      start: item.start_date,
      end: item.end_date
    })),
    contacts: contacts.filter(item => item.event_id === event.id).map(item => ({ name: item.name, phone: item.phone }))
  }));
}

function json(response, status, value) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(value));
}

const ASSETS = new Map([
  ['/assets/usm-crest.webp', join(ROOT, 'data', 'usm-crest.webp')],
  ['/assets/national-public-speaking-competition.png', join(ROOT, 'data', 'national public speaking competition.png')]
]);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.ics': 'text/calendar; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };

function sendFile(response, file) {
  response.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
  response.end(readFileSync(file));
}

function serveStatic(request, response) {
  const asset = ASSETS.get(request.url);
  if (asset) return sendFile(response, asset);
  if (!existsSync(DIST)) {
    return json(response, 503, { error: 'Frontend is not built. Run npm run build or use npm run dev.' });
  }
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = resolve(DIST, requested);
  if (file.startsWith(resolve(DIST)) && existsSync(file) && statSync(file).isFile()) return sendFile(response, file);
  return sendFile(response, join(DIST, 'index.html'));
}

if (process.argv.includes('--import')) {
  const result = importMessages();
  console.log(`Imported ${result.messages} messages, found ${result.candidates} event posts, stored ${result.events} unique events.`);
  db.close();
} else {
  if (Number(db.prepare('SELECT COUNT(*) AS count FROM source_messages').get().count) === 0) importMessages();
  const server = createServer((request, response) => {
    try {
      if (request.method !== 'GET' && request.method !== 'HEAD') return json(response, 405, { error: 'Method not allowed' });
      if (request.url === '/api/health') return json(response, 200, { status: 'ok' });
      if (request.url === '/api/events') return json(response, 200, getEvents());
      return serveStatic(request, response);
    } catch (error) {
      console.error(error);
      return json(response, 500, { error: 'Internal server error' });
    }
  });
  server.listen(PORT, () => console.log(`MyCSD Hunter API running at http://localhost:${PORT}`));
}
