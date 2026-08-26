import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMessages } from './parser.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const publicDirectory = join(root, 'public');
const assetsDirectory = join(publicDirectory, 'assets');
const { events } = parseMessages(readFileSync(join(root, 'messages.txt'), 'utf8'));

const output = events
  .sort((a, b) => b.postedAt.localeCompare(a.postedAt))
  .map(event => ({
    id: event.telegramMessageId,
    telegram_message_id: event.telegramMessageId,
    date_posted: event.postedAt,
    title: event.title,
    organization: event.organizer,
    type: event.category,
    description: event.description,
    registration_link: event.registrationLink,
    venue: event.venue,
    interview_platform: event.platform,
    time: event.timeText,
    mycsd_provided: event.mycsdProvided,
    source_url: event.sourceUrl,
    calendar_entries: event.schedules.map(item => ({
      label: item.label,
      kind: item.kind,
      start: item.start,
      end: item.end
    })),
    contacts: event.contacts
  }));

mkdirSync(assetsDirectory, { recursive: true });
writeFileSync(join(publicDirectory, 'events.json'), `${JSON.stringify(output, null, 2)}\n`);
copyFileSync(join(root, 'data', 'usm-crest.webp'), join(assetsDirectory, 'usm-crest.webp'));

console.log(`Exported ${output.length} events for the static site.`);
