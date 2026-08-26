import { createHash } from 'node:crypto';

const MONTHS = {
  january: 1, jan: 1, januari: 1,
  february: 2, feb: 2, februari: 2,
  march: 3, mar: 3, mac: 3,
  april: 4, apr: 4,
  may: 5, mei: 5,
  june: 6, jun: 6,
  july: 7, jul: 7, julai: 7,
  august: 8, aug: 8, ogos: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10, oktober: 10,
  november: 11, nov: 11,
  december: 12, dec: 12, disember: 12, dis: 12
};

const MONTH_PATTERN = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');
const JOINER = String.raw`(?:\s*(?:-|–|—|hingga|sehingga|to|dan|and|&)\s*)`;
const EVENT_INTENT = /pencarian|pendaftaran|permohonan|pengambilan|recruit(?:ment|ing)?|program(?:me)?|competition|quiz|symposium|committee|sukarelawan|volunteer|temu\s*duga|interview|\bexco\b|keahlian|sharing session|monthly quiz|save the dates/i;
const EVENT_SIGNAL = /https?:\/\/|my\s*csd|scan (?:the )?qr|imbas kod qr|tarikh|\bdate\b|venue|tempat|lokasi|platform|register|daftar|mohon/i;
const NON_EVENT = /telegram mycsd hunter|group rasmi mycsd hunter|kerja kosong admin|baju kurung batik|shopee\.com/i;

function cleanText(value) {
  return value
    .normalize('NFKC')
    .replace(/\u00a0/g, ' ')
    .replace(/[*`]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}

function cleanTitle(value) {
  return cleanText(value)
    .replace(/^[\s_\[\]〚〛📢📣🔥🚨🎉🎖️✨🎤]+|[\s_\[\]〚〛📢📣🔥🚨🎉🎖️✨🎤]+$/gu, '')
    .trim();
}

function isoDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function textDate(day, month, year, fallbackYear) {
  return isoDate(Number(year || fallbackYear), MONTHS[month.toLowerCase()], Number(day));
}

export function extractDateRanges(value, fallbackYear = new Date().getUTCFullYear()) {
  const text = cleanText(value).replace(/(\d)(?:st|nd|rd|th)\b/gi, '$1');
  const ranges = [];
  let match;

  const numericRange = new RegExp(String.raw`\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})${JOINER}(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b`, 'gi');
  while ((match = numericRange.exec(text))) {
    const start = isoDate(Number(match[3]), Number(match[2]), Number(match[1]));
    const end = isoDate(Number(match[6]), Number(match[5]), Number(match[4]));
    if (start && end) ranges.push({ start, end, raw: match[0] });
  }

  const crossMonthRange = new RegExp(String.raw`\b(\d{1,2})\s+(${MONTH_PATTERN})(?:\s+(\d{4}))?${JOINER}(\d{1,2})\s+(${MONTH_PATTERN})(?:\s+(\d{4}))?\b`, 'gi');
  while ((match = crossMonthRange.exec(text))) {
    const endYear = Number(match[6] || match[3] || fallbackYear);
    const startYear = Number(match[3] || endYear);
    const start = textDate(match[1], match[2], startYear, fallbackYear);
    const end = textDate(match[4], match[5], endYear, fallbackYear);
    if (start && end) ranges.push({ start, end, raw: match[0] });
  }

  const sameMonthRange = new RegExp(String.raw`\b(\d{1,2})${JOINER}(\d{1,2})\s+(${MONTH_PATTERN})(?:\s+(\d{4}))?\b`, 'gi');
  while ((match = sameMonthRange.exec(text))) {
    const start = textDate(match[1], match[3], match[4], fallbackYear);
    const end = textDate(match[2], match[3], match[4], fallbackYear);
    if (start && end) ranges.push({ start, end, raw: match[0] });
  }

  if (ranges.length) return ranges;

  const numericDate = /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/g;
  while ((match = numericDate.exec(text))) {
    const date = isoDate(Number(match[3]), Number(match[2]), Number(match[1]));
    if (date) ranges.push({ start: date, end: date, raw: match[0] });
  }

  const singleTextDate = new RegExp(String.raw`\b(\d{1,2})\s+(${MONTH_PATTERN})(?:\s+(\d{4}))?\b`, 'gi');
  while ((match = singleTextDate.exec(text))) {
    const date = textDate(match[1], match[2], match[3], fallbackYear);
    if (date) ranges.push({ start: date, end: date, raw: match[0] });
  }
  return ranges;
}

export function parseMessageBlocks(input) {
  const text = input.replace(/\r\n/g, '\n');
  const pattern = /^Message ID:\s*(\d+)\nDate:\s*([^\n]+)\nSender ID:\s*(\d+)(?:\nMedia:\s*([^\n]+))?\n-+\n([\s\S]*?)(?=\n={20,}|(?![\s\S]))/gm;
  return [...text.matchAll(pattern)].map(match => ({
    telegramMessageId: Number(match[1]),
    postedAt: match[2].trim(),
    senderId: match[3].trim(),
    mediaType: match[4]?.trim() || null,
    rawText: match[5].trim()
  }));
}

function isEventMessage(body) {
  if (body.length < 120 || NON_EVENT.test(body)) return false;
  return EVENT_INTENT.test(body) && EVENT_SIGNAL.test(body);
}

function extractTitle(body) {
  const lines = body.split('\n').map(cleanTitle).filter(Boolean);
  const candidates = lines.filter(line => EVENT_INTENT.test(line) && !/^(pengumuman|announcement|calling all usm students)!?$/i.test(line));
  const firstLineIsUseful = lines[0] && !/^(?:assalam|salam|hi!?$|pengumuman|announcement|calling all usm students)/i.test(lines[0]);
  let title = (firstLineIsUseful ? lines[0] : candidates[0]) || lines[0] || 'Untitled event';
  const opened = title.match(/(?:membuka|mengadakan)\s+(.{5,110}?)(?:\s+bagi|\s+kepada|[.!]|$)/i);
  const joined = title.match(/join (?:the )?(.{5,100}?)(?:\s+as\s+|[.!]|$)/i);
  if (opened) title = opened[1];
  else if (joined) title = joined[1];
  if (title.length > 140) title = `${title.slice(0, 137).trim()}...`;
  return cleanTitle(title);
}

function extractOrganizer(body, title) {
  const matches = [...cleanText(body).matchAll(/((?:Kelab|Sekretariat|Persatuan|Angkatan|Gabungan)[^\n.!?]{2,150}?)(?:\s+kini|\s+is looking|\s+mengadakan)/gi)];
  const organization = matches.sort((a, b) => Number(/universiti/i.test(b[1])) - Number(/universiti/i.test(a[1])) || b[1].length - a[1].length)[0];
  if (organization) return organization[1].trim().replace(/,$/, '');
  const acs = title.match(/American Chemical Society[^\]]*?Chapter/i);
  return acs?.[0] || null;
}

function classifyEvent(body, title) {
  if (/quiz/i.test(title)) return 'Quiz';
  if (/join[^\n]{0,100}committee|looking[^\n]{0,100}(?:committee|commitee)/i.test(body)) return 'Recruitment';
  if (/pencarian ahli|keahlian|membership|debaters/i.test(title)) return 'Membership';
  if (/exco|sekretariat|committee|commitee|recruit|pengambilan/i.test(title)) return 'Recruitment';
  if (/sukarelawan|volunteer/i.test(title)) return 'Volunteer';
  if (/competition|pertandingan|ideathon/i.test(title)) return 'Competition';
  if (/keahlian|membership/i.test(body)) return 'Membership';
  if (/exco|recruit|pengambilan|pencarian/i.test(body)) return 'Recruitment';
  if (/sukarelawan|volunteer/i.test(body)) return 'Volunteer';
  if (/competition|pertandingan|ideathon/i.test(body)) return 'Competition';
  return 'Programme';
}

function scheduleKind(line, context) {
  if (/tarikh akhir|register by|registration deadline|closes? at|dibuka sehingga/i.test(line)) return 'deadline';
  if (/temu\s*duga|interview/i.test(line)) return 'interview';
  if (/permohonan|pendaftaran|application period|registration period/i.test(line)) return 'registration';
  if (/programme details|program details|event details/i.test(line)) return 'event';
  if (/\btarikh\b|\bdate\b|save the dates/i.test(line)) return context || 'event';
  return context;
}

function scheduleLabel(kind) {
  return { deadline: 'Registration deadline', interview: 'Interview', registration: 'Registration', event: 'Event' }[kind];
}

function extractSchedules(body, postedAt) {
  const fallbackYear = new Date(postedAt).getUTCFullYear();
  const lines = cleanText(body).split('\n').filter(Boolean);
  const schedules = [];
  let context = null;

  for (const line of lines) {
    const detected = scheduleKind(line, context);
    if (detected) context = detected;
    const ranges = extractDateRanges(line, fallbackYear);
    if (!ranges.length || !detected) continue;
    for (const range of ranges) {
      if (!schedules.some(item => item.kind === detected && item.start === range.start && item.end === range.end)) {
        schedules.push({ kind: detected, label: scheduleLabel(detected), ...range });
      }
    }
  }
  return schedules;
}

function extractUrls(body) {
  return [...body.matchAll(/https?:\/\/[^\s*]+/gi)].map(match => match[0].replace(/[),.;]+$/, ''));
}

function extractRegistrationLink(body) {
  const urls = extractUrls(body);
  return urls.find(url => /forms\.gle|docs\.google\.com\/(?:forms|spreadsheets)|shorturl\.|irisusm/i.test(url))
    || urls.find(url => !/t\.me\/mycsd|linktr\.ee|instagram\.com|facebook\.com|tiktok\.com/i.test(url))
    || null;
}

function extractContacts(body) {
  const phonePattern = String.raw`(?:\+?60|0)\s*1\d(?:[-\s]?\d){7,9}`;
  const contacts = [];
  for (const rawLine of cleanText(body).split('\n')) {
    const phone = rawLine.match(new RegExp(phonePattern, 'i'))?.[0];
    if (!phone) continue;
    const before = rawLine.slice(0, rawLine.indexOf(phone)).replace(/^[-📞☎️\s]+/u, '').trim().replace(/\s*[:–-]+$/, '');
    const remainder = rawLine.slice(rawLine.indexOf(phone) + phone.length);
    const after = remainder.match(/\(([^)]+)\)/)?.[1] || remainder.replace(/^\s*[-–:]\s*/, '').trim() || null;
    const name = before || after || null;
    const normalizedPhone = phone.replace(/\s+/g, ' ').trim();
    if (!contacts.some(contact => contact.phone === normalizedPhone)) contacts.push({ name, phone: normalizedPhone });
  }
  return contacts;
}

function extractField(body, labels) {
  const expression = new RegExp(String.raw`^(?:[^\p{L}\p{N}]*)?(?:${labels})\s*:?\s*(.+)$`, 'imu');
  return cleanText(body).match(expression)?.[1]?.trim() || null;
}

function extractFee(body) {
  const text = cleanText(body);
  const freePattern = /\bfree\s+(?:entry|registration|admission|access)\b|(?:^|\W)percuma(?:\W|$)|\bno\s+(?:registration\s+)?fee\b|\bfree\b\s*[!🆓\n]/im;
  const amountPattern = /\bRM\s*(\d+(?:\.\d{1,2})?)\b/i;
  const labelledFree = /(?:fee|yuran|admission|harga|registration fee)\s*[:：]\s*(?:free|percuma)/im;
  const falsePositiveFree = /\bfeel\s+free\b|\bfree\s+to\s+(?:contact|reach|ask|join|message)\b/i;

  if (labelledFree.test(text)) return { free: true, amount: null };

  const amountMatch = text.match(amountPattern);
  if (amountMatch) return { free: false, amount: `RM${amountMatch[1]}` };

  if (freePattern.test(text) && !falsePositiveFree.test(text)) return { free: true, amount: null };

  return { free: null, amount: null };
}

function dedupeKey(event, body) {
  const value = event.registrationLink
    ? event.registrationLink.toLowerCase().replace(/[?#].*$/, '')
    : cleanText(body).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  return createHash('sha256').update(value).digest('hex');
}

export function parseEvent(message) {
  const body = cleanText(message.rawText);
  if (!isEventMessage(body)) return null;
  const title = extractTitle(body);
  const event = {
    ...message,
    title,
    organizer: extractOrganizer(body, title),
    category: classifyEvent(body, title),
    description: body,
    registrationLink: extractRegistrationLink(body),
    venue: extractField(body, 'tempat|venue|lokasi'),
    platform: extractField(body, 'platform'),
    timeText: extractField(body, 'masa|time'),
    mycsdProvided: /my\s*csd/i.test(body),
    fee: extractFee(body),
    schedules: extractSchedules(body, message.postedAt),
    contacts: extractContacts(body),
    sourceUrl: `https://t.me/mycsd/${message.telegramMessageId}`
  };
  event.dedupeKey = dedupeKey(event, body);
  return event;
}

export function parseMessages(input) {
  const messages = parseMessageBlocks(input);
  const candidates = messages.map(parseEvent).filter(Boolean);
  const eventsByKey = new Map();
  for (const event of candidates) {
    const existing = eventsByKey.get(event.dedupeKey);
    if (!existing || event.postedAt > existing.postedAt) eventsByKey.set(event.dedupeKey, event);
  }
  return { messages, events: [...eventsByKey.values()], candidates };
}
