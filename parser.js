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
  october: 10, oct: 10, oktober: 10, okt: 10,
  november: 11, nov: 11,
  december: 12, dec: 12, disember: 12, dis: 12
};

const MONTH_PATTERN = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join('|');
const JOINER = String.raw`(?:\s*(?:-|–|—|hingga|sehingga|to|dan|and|&)\s*)`;
const WEEKDAY = String.raw`(?:\s*(?:\([^)\n]{3,24}\)|,\s*(?:mon|tue|wed|thu|fri|sat|sun|isnin|selasa|rabu|khamis|jumaat|sabtu|ahad)[a-z]*))?`;
const EVENT_INTENT = /pencarian|pendaftaran|permohonan|pengambilan|rekrut|recruit(?:ment|ing)?|program(?:me)?|competition|quiz|trivia|symposium|committee|sukarelawan|volunteer|temu\s*duga|interview|\bexco\b|keahlian|membership|sharing session|\bsession\b|monthly quiz|save the dates|webinar|talk|workshop|seminar|forum|training|\bcourse\b|\bclass\b|challenge|tournament|festival|carnival|showcase|performance|movie night|fun run|open show|showtime|persembahan|speaker|bicara|klinik|kesedaran|pembukaan|membuka|jemput|sertai/i;
const EVENT_SIGNAL = /https?:\/\/|my\s*csd|scan (?:the )?qr|imbas kod qr|tarikh|\bdate\b|venue|tempat|lokasi|platform|register|daftar|yuran|\bfee\b|deadline/i;
const NON_EVENT = /telegram mycsd hunter|group rasmi mycsd hunter|kerja kosong admin|baju kurung batik|shopee\.com|admin of mycsd hunter|pastikan caption|makluman untuk semua|poster memaparkan logo|boleh tak bantu|mohon tolong doakan/i;
const SMALL_CAPS = {
  'ᴀ': 'a', 'ʙ': 'b', 'ᴄ': 'c', 'ᴅ': 'd', 'ᴇ': 'e', 'ꜰ': 'f', 'ɢ': 'g', 'ʜ': 'h', 'ɪ': 'i',
  'ᴊ': 'j', 'ᴋ': 'k', 'ʟ': 'l', 'ᴍ': 'm', 'ɴ': 'n', 'ᴏ': 'o', 'ᴘ': 'p', 'ǫ': 'q', 'ʀ': 'r',
  'ꜱ': 's', 'ᴛ': 't', 'ᴜ': 'u', 'ᴠ': 'v', 'ᴡ': 'w', 'ʏ': 'y', 'ᴢ': 'z'
};

const EVENT_TITLE_WORD = /webinar|talk|quiz|trivia|competition|recruitment|program(?:me)?|workshop|bengkel|seminar|forum|training|\bcourse\b|\bclass\b|challenge|tournament|festival|carnival|showcase|performance|movie|fun run|expo|fair|conference|summit|bootcamp|session|membership|keahlian|exco|ajk|volunteer|sukarelawan|open show|showtime|persembahan|bicara|klinik|kesedaran|rekrut|pencarian|pengambilan/i;
const NOISY_TITLE = /^(?:assalam|salam|hi!?$|hey\b|hello\b|greetings\b|pengumuman[!:. ]*$|announcement[!:. ]*$|maklumat\b|butiran\b|program\s+details|event\s+details|details\s*:$|info\s*:$|information\s*:$|calling all|coming up|d-?day|happening|countdown|it'?s\b|last call|tonight\b|tomorrow\b|pov\b|ever wondered|think you|are you|want to|looking for|ready to|step into|dear\b|join us|scan\b|register\b|link\b|date\b|time\b|venue\b|platform\b|fee\b|yuran\b|open to|for enquiries|contact\b|any inquiries|save the date)/i;
const STOP_TITLE_WORDS = new Set([
  'the', 'a', 'an', 'and', 'for', 'from', 'with', 'your', 'our', 'you', 'this', 'that', 'online',
  'programme', 'program', 'event', 'series', 'siri', 'session', 'talk', 'webinar', 'workshop',
  'seminar', 'quiz', 'trivia', 'challenge', 'competition', 'phc', 'pharmex', 'mycsd', 'usm'
]);

function cleanText(value) {
  return value
    .replace(/\r\n?/g, '\n')
    .normalize('NFKC')
    .replace(/[ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡʏᴢ]/g, character => SMALL_CAPS[character])
    .replace(/[\u200b-\u200d\uFE0E\uFE0F]/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[*`]/g, '')
    .replace(/_{2,}/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}

function cleanTitle(value) {
  return cleanText(value)
    .replace(/[“”"]/g, '')
    .replace(/^[\s\p{Extended_Pictographic}\p{Emoji_Modifier}\u{1F1E6}-\u{1F1FF}\u2640\u2642"'_[\]【】〘〙〚〛(){}<>|•·!?:;,.#>\-–—]+/gu, '')
    .replace(/[\s\p{Extended_Pictographic}\p{Emoji_Modifier}\u{1F1E6}-\u{1F1FF}\u2640\u2642"'_[\]【】〘〙〚〛(){}<>|•·]+$/gu, '')
    .replace(/\?\s*!+$/g, '?')
    .replace(/\s*!{2,}$/g, '!')
    .replace(/\s+/g, ' ')
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

function dedupeRanges(ranges) {
  const seen = new Set();
  return ranges.filter(range => {
    const key = `${range.start}|${range.end}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function extractDateRanges(value, fallbackYear = new Date().getUTCFullYear()) {
  const text = cleanText(value).replace(/\b(\d{1,2})(?:st|nd|rd|th)\b/gi, '$1');
  const ranges = [];
  let match;

  const numericRange = new RegExp(String.raw`\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})${JOINER}(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b`, 'gi');
  while ((match = numericRange.exec(text))) {
    const start = isoDate(Number(match[3]), Number(match[2]), Number(match[1]));
    const end = isoDate(Number(match[6]), Number(match[5]), Number(match[4]));
    if (start && end) ranges.push({ start, end, raw: match[0] });
  }

  const crossMonthRange = new RegExp(String.raw`\b(\d{1,2})\s+(${MONTH_PATTERN})(?:\s+(\d{4}))?${WEEKDAY}${JOINER}(\d{1,2})\s+(${MONTH_PATTERN})(?:\s+(\d{4}))?${WEEKDAY}\b`, 'gi');
  while ((match = crossMonthRange.exec(text))) {
    const endYear = Number(match[6] || match[3] || fallbackYear);
    const startYear = Number(match[3] || endYear);
    const start = textDate(match[1], match[2], startYear, fallbackYear);
    const end = textDate(match[4], match[5], endYear, fallbackYear);
    if (start && end) ranges.push({ start, end, raw: match[0] });
  }

  const sameMonthRange = new RegExp(String.raw`\b(\d{1,2})${JOINER}(\d{1,2})\s+(${MONTH_PATTERN})(?:\s+(\d{4}))?${WEEKDAY}\b`, 'gi');
  while ((match = sameMonthRange.exec(text))) {
    const start = textDate(match[1], match[3], match[4], fallbackYear);
    const end = textDate(match[2], match[3], match[4], fallbackYear);
    if (start && end) ranges.push({ start, end, raw: match[0] });
  }

  if (ranges.length) return dedupeRanges(ranges);

  const numericDate = /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/g;
  while ((match = numericDate.exec(text))) {
    const date = isoDate(Number(match[3]), Number(match[2]), Number(match[1]));
    if (date) ranges.push({ start: date, end: date, raw: match[0] });
  }

  const singleTextDate = new RegExp(String.raw`\b(\d{1,2})\s+(${MONTH_PATTERN})(?:\s+(\d{4}))?${WEEKDAY}\b`, 'gi');
  while ((match = singleTextDate.exec(text))) {
    const date = textDate(match[1], match[2], match[3], fallbackYear);
    if (date) ranges.push({ start: date, end: date, raw: match[0] });
  }
  return dedupeRanges(ranges);
}

export function parseMessageBlocks(input) {
  const text = input.replace(/\r\n/g, '\n');
  const pattern = /^Message ID:\s*(\d+)\nDate:\s*([^\n]+)\nSender ID:\s*(\d+)(?:\nMedia:\s*([^\n]+))?(?:\nViews:\s*([^\n]+))?\n-+\n([\s\S]*?)(?=\n={20,}|(?![\s\S]))/gm;
  return [...text.matchAll(pattern)].map(match => ({
    telegramMessageId: Number(match[1]),
    postedAt: match[2].trim(),
    senderId: match[3].trim(),
    mediaType: match[4]?.trim() || null,
    views: match[5]?.trim() || null,
    rawText: match[6].trim()
  }));
}

function isEventMessage(body) {
  if (body.length < 120 || NON_EVENT.test(body)) return false;
  return EVENT_INTENT.test(body) && EVENT_SIGNAL.test(body);
}

function scoreTitleCandidate(value, index, total) {
  if (!value || value.length < 3) return -Infinity;
  if (/^https?:\/\//i.test(value) || /^#\w/.test(value)) return -Infinity;
  if (/@\w+\s*$/.test(value) && value.length < 40) return -Infinity;

  let score = 0;
  const letters = value.replace(/[^A-Za-z]/g, '');
  const uppercaseLetters = letters.replace(/[^A-Z]/g, '').length;
  const uppercaseRatio = letters.length >= 6 ? uppercaseLetters / letters.length : 0;
  const words = value.split(/\s+/);

  if (index === 0) score += 6;
  else if (index <= 2) score += 1;

  if (EVENT_TITLE_WORD.test(value)) score += 5;
  if (/[:–—|]/.test(value)) score += 2;
  if (value.length >= 12 && value.length <= 140) score += 2;
  if (value.length > 140) score -= 3;
  if (uppercaseRatio >= 0.7) score += 1;
  if (NOISY_TITLE.test(value)) score -= 6;
  if (/^[\p{Ll}]/u.test(value)) score -= 6;
  if (/countdown|happening|last call|d-?day|coming up|tonight|tomorrow/i.test(value)) score -= 6;
  if (/^(?:date|time|venue|platform|fee|yuran|location|tempat|masa|deadline|registration|contact|speaker|open to|for enquiries|any inquiries|details)\b\s*[:：]/i.test(value)) score -= 8;
  if (/^(?:for any inquiries|for enquiries|any inquiries|contact|hubungi|sebarang pertanyaan)/i.test(value)) score -= 8;
  if (/\b(?:rm\s*\d|https?:\/\/|@\w+|\+?60\d)/i.test(value)) score -= 4;
  if (/^(?:you|we|our|don't|do not|ever|think|are|want|ready|step|join us|jom)\b/i.test(value)) score -= 2;
  if (words.length > 20) score -= 3;
  else if (words.length > 18 && !EVENT_TITLE_WORD.test(value)) score -= 2;
  if (/[.!?]$/.test(value) && words.length > 12 && !EVENT_TITLE_WORD.test(value)) score -= 2;
  if (index === total - 1 && /(?:inquiries|contact|thank|see you|jumpa|let's|jangan)/i.test(value)) score -= 4;

  return score;
}

function extractQuotedTitles(body) {
  const quoted = [];
  const pattern = /[“"]([\s\S]{8,160}?)[”"]/g;
  let match;
  while ((match = pattern.exec(body))) {
    const value = cleanTitle(match[1]);
    if (value.length < 8 || value.length > 160) continue;
    if (/[.!?]$/.test(value) && !EVENT_TITLE_WORD.test(value)) continue;
    quoted.push(value);
  }
  return quoted;
}

function extractCapsTitles(body) {
  const titles = [];
  const lines = body.split('\n');
  const pattern = /(?:^|\n)[^\n]*?\b([A-Z][A-Z0-9 &'’\-]{5,}?:\s*[A-Z0-9][A-Z0-9 &'’\-]{2,90})/g;
  let match;
  while ((match = pattern.exec(body))) {
    const value = cleanTitle(match[1]);
    if (!value || /^(?:date|time|venue|platform|fee|yuran|location|tempat|masa|deadline|registration|contact|speaker)\b/i.test(value)) continue;
    const containingLine = lines.find(line => cleanTitle(line).includes(value));
    if (containingLine && cleanTitle(containingLine).startsWith(value)) continue;
    titles.push(value);
  }
  return titles;
}

function extractTitle(body) {
  const lines = body.split('\n').map(cleanTitle).filter(Boolean);
  const candidates = [];

  lines.forEach((line, index) => {
    candidates.push({ value: line, score: scoreTitleCandidate(line, index, lines.length), index });

    const characters = [...line];
    const emojiIndex = characters.findIndex((character, position) => position > 10 && /\p{Extended_Pictographic}|\p{Emoji_Modifier}/u.test(character));
    if (emojiIndex > 10) {
      const prefix = cleanTitle(characters.slice(0, emojiIndex).join(''));
      if (prefix.length >= 12 && /[A-Za-z]{3,}/.test(prefix)) {
        candidates.push({ value: prefix, score: scoreTitleCandidate(prefix, index, lines.length) + 2, index });
      }
    }
  });

  for (const quoted of extractQuotedTitles(body)) {
    const index = lines.findIndex(line => line.includes(quoted.slice(0, 20)));
    candidates.push({
      value: quoted,
      score: scoreTitleCandidate(quoted, index < 0 ? 20 : index, lines.length) + 3,
      index: index < 0 ? 20 : index
    });
  }

  for (const caps of extractCapsTitles(body)) {
    const index = lines.findIndex(line => line.includes(caps.slice(0, 20)));
    candidates.push({ value: caps, score: scoreTitleCandidate(caps, index < 0 ? 20 : index, lines.length), index: index < 0 ? 20 : index });
  }

  candidates.sort((a, b) => b.score - a.score || a.index - b.index);
  let title = candidates[0]?.value || lines[0] || 'Untitled event';

  if (/^speaker\s+spotlight\s*[|:–-]\s*/i.test(title)) title = title.replace(/^speaker\s+spotlight\s*[|:–-]\s*/i, '');
  if (/^pov\s*:\s*/i.test(title)) title = title.replace(/^pov\s*:\s*/i, '');
  if (/^jom\s+sertai\s+/i.test(title)) title = title.replace(/^jom\s+sertai\s+/i, '');
  const registrationTitle = title.match(/^registration for (.+?) is now open!?$/i);
  if (registrationTitle) title = registrationTitle[1];

  if (title.endsWith(':') && lines.length > 1) {
    const chosenIndex = lines.indexOf(title);
    const continuation = lines[chosenIndex + 1];
    if (continuation && continuation.length <= 60 && !/^(?:date|time|venue|platform|fee|yuran|location|tempat|masa)\b/i.test(continuation)) {
      title = `${title} ${continuation}`;
    }
  }

  if (title.length > 60) {
    const characters = [...title];
    const emojiIndex = characters.findIndex((character, index) => index > 15 && /\p{Extended_Pictographic}/u.test(character));
    const remainder = emojiIndex > 15 ? characters.slice(emojiIndex + 1).join('') : '';
    if (emojiIndex > 15 && /[A-Za-z]{5,}/.test(remainder)) title = characters.slice(0, emojiIndex).join('').trim();
  }

  title = cleanTitle(title);
  if (title.length > 140) title = `${title.slice(0, 137).trim()}...`;
  return title || 'Untitled event';
}

function extractOrganizer(body, title) {
  const matches = [...cleanText(body).matchAll(/((?:Kelab|Sekretariat|Persatuan|Angkatan|Gabungan)[^\n.!?]{2,150}?)(?:\s+kini|\s+is looking|\s+mengadakan)/gi)];
  const organization = matches.sort((a, b) => Number(/universiti/i.test(b[1])) - Number(/universiti/i.test(a[1])) || b[1].length - a[1].length)[0];
  if (organization) return organization[1].trim().replace(/,$/, '');
  const acs = title.match(/American Chemical Society[^\]]*?Chapter/i);
  return acs?.[0] || null;
}

function classifyEvent(body, title) {
  if (/quiz|trivia/i.test(title)) return 'Quiz';
  if (/pencarian ahli|keahlian|membership|debaters/i.test(title)) return 'Membership';
  if (/exco|sekretariat|committee|commitee|recruit|pengambilan|pencarian|rekrut|ajk/i.test(title)) return 'Recruitment';
  if (/sukarelawan|volunteer/i.test(title)) return 'Volunteer';
  if (/competition|pertandingan|ideathon|photography/i.test(title)) return 'Competition';
  if (/webinar/i.test(title)) return 'Webinar';
  if (/workshop|bengkel|training|course|class/i.test(title)) return 'Workshop';
  if (/talk|seminar|forum|sharing session|bicara|coffee talk|online talk/i.test(title)) return 'Talk';
  if (/fun run|\brun\b|marathon|fitness|sports/i.test(title)) return 'Sports';
  if (/\b(?:online\s+quiz|quiz\s+challenge|trivia\s+quiz|quiz\s+(?:period|competition)|monthly\s+quiz|quiz\s+\d)\b/i.test(body)) return 'Quiz';
  if (/join[^\n]{0,100}committee|looking[^\n]{0,100}(?:committee|commitee)/i.test(body)) return 'Recruitment';
  if (/keahlian|membership/i.test(body)) return 'Membership';
  if (/exco|recruit|pengambilan|pencarian|rekrut/i.test(body)) return 'Recruitment';
  if (/sukarelawan|volunteer/i.test(body)) return 'Volunteer';
  if (/competition|pertandingan|ideathon/i.test(body)) return 'Competition';
  if (/workshop|bengkel/i.test(body)) return 'Workshop';
  if (/webinar/i.test(body)) return 'Webinar';
  if (/talk|seminar|forum|speaker|bicara/i.test(body)) return 'Talk';
  return 'Programme';
}

function scheduleKind(line) {
  const cleaned = line
    .replace(/\b(?:registration|participation|entry)\s+(?:fee|link)\b/gi, '')
    .replace(/\binterview\s+platform\b/gi, '');

  if (/tarikh akhir|deadline|closing date|register by|closes?\b|ditutup|\btutup\b|sebelum\b/i.test(cleaned)) return 'deadline';
  if (/temu\s*duga|interview/i.test(cleaned)) return 'interview';
  if (/registration|pendaftaran|permohonan|application period|recruitment period|tarikh buka|pautan pendaftaran|membuka pendaftaran|membuka permohonan/i.test(cleaned)) return 'registration';
  if (/tarikh|\bdate\b|quiz period|competition period|program(?:me)? period|event period|save the dates|event details|program details/i.test(cleaned)) return 'event';
  return null;
}

function scheduleLabel(kind) {
  return { deadline: 'Registration deadline', interview: 'Interview', registration: 'Registration', event: 'Event' }[kind];
}

function extractSchedules(body, postedAt) {
  const fallbackYear = new Date(postedAt).getUTCFullYear();
  const schedules = [];
  let context = null;

  for (const line of cleanText(body).split('\n')) {
    if (!line.trim()) continue;
    const kind = scheduleKind(line);
    const ranges = extractDateRanges(line, fallbackYear);

    if (!ranges.length) {
      const looksLikeHeader = line.length <= 80
        && !/https?:\/\//i.test(line)
        && !/\b(?:pautan|link)\b/i.test(line)
        && /(?:tarikh|permohonan|temuduga|pendaftaran|interview|deadline|registration|quiz period|competition period|event details|program details)/i.test(line);
      if (looksLikeHeader && kind) context = kind;
      continue;
    }

    const effectiveKind = kind || context || 'event';
    for (const range of ranges) {
      if (!schedules.some(item => item.kind === effectiveKind && item.start === range.start && item.end === range.end)) {
        schedules.push({ kind: effectiveKind, label: scheduleLabel(effectiveKind), ...range });
      }
    }
    context = null;
  }

  return schedules;
}

function extractUrls(body) {
  const urls = [...body.matchAll(/https?:\/\/[^\s<>"'\[\]()*]+/gi)]
    .map(match => match[0].replace(/[),.;!?]+$/g, ''));
  return [...new Set(urls)];
}

function extractRegistrationLink(body) {
  const urls = extractUrls(body);
  return urls.find(url => /forms\.gle|docs\.google\.com\/(?:forms|spreadsheets)|shorturl\.|tinyurl\.|irisusm|me-l\.co|q\.me-qr|base44\.app/i.test(url))
    || urls.find(url => !/t\.me\/mycsd|linktr\.ee|instagram\.com|facebook\.com|tiktok\.com|youtube\.com|youtu\.be/i.test(url))
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
  const freePattern = /\bfree\s+(?:entry|registration|admission|access|of charge)\b|\bFOC\b|(?:^|\W)percuma(?:\W|$)|\bno\s+(?:registration\s+)?fee\b|\bkemasukan\s*[:：]\s*(?:free|percuma)\b|\bfree\b\s*[!🆓\n]/im;
  const amountPattern = /\bRM\s*(\d+(?:\.\d{1,2})?)\b/i;
  const labelledFree = /(?:fee|yuran|admission|harga|kemasukan|registration fee)\s*[:：]\s*(?:free|percuma|foc|free of charge)/im;
  const falsePositiveFree = /\bfeel\s+free\b|\bfree\s+to\s+(?:contact|reach|ask|join|message)\b/i;

  if (labelledFree.test(text)) return { free: true, amount: null };

  const feeLines = text.split('\n').filter(line => /(?:fee|yuran|price|harga|admission|kemasukan|participation|registration)\b/i.test(line) && !/prize|hadiah|winner|1st|2nd|3rd/i.test(line));
  for (const line of feeLines) {
    const amountMatch = line.match(amountPattern);
    if (amountMatch) return { free: false, amount: `RM${amountMatch[1]}` };
    if (/(?:free|percuma|foc)/i.test(line)) return { free: true, amount: null };
  }

  const amountMatch = text.match(amountPattern);
  if (amountMatch) return { free: false, amount: `RM${amountMatch[1]}` };

  if (freePattern.test(text) && !falsePositiveFree.test(text)) return { free: true, amount: null };

  return { free: null, amount: null };
}

function normalizedTitle(title) {
  return cleanTitle(title)
    .toLowerCase()
    .replace(/^speaker\s+spotlight\s*[|:–-]\s*/i, '')
    .replace(/\bonline\b/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function significantTitleTokens(title) {
  return new Set(normalizedTitle(title).split(' ').filter(token => token.length > 2 && !STOP_TITLE_WORDS.has(token)));
}

function titlesMatch(first, second) {
  const a = normalizedTitle(first);
  const b = normalizedTitle(second);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 12 && b.length >= 12 && (a.startsWith(`${b} `) || b.startsWith(`${a} `))) return true;

  const tokensA = significantTitleTokens(first);
  const tokensB = significantTitleTokens(second);
  const smaller = tokensA.size <= tokensB.size ? tokensA : tokensB;
  const larger = tokensA.size <= tokensB.size ? tokensB : tokensA;
  if (smaller.size < 3) return false;
  let overlap = 0;
  for (const token of smaller) if (larger.has(token)) overlap += 1;
  return overlap >= 3 && overlap / smaller.size >= 0.8;
}

const SHARED_REGISTRATION_LINKS = /wmhcarnivalmrs2627\.base44\.app/i;

function sameLinkedEvent(first, second) {
  if (!first.registrationLink || first.registrationLink !== second.registrationLink) return false;
  if (SHARED_REGISTRATION_LINKS.test(first.registrationLink)) return false;
  const firstDates = new Set(first.schedules.map(item => item.start));
  return second.schedules.some(item => firstDates.has(item.start));
}

export function parseEvent(message) {
  const body = cleanText(message.rawText);
  if (!isEventMessage(body)) return null;
  const title = extractTitle(body);
  return {
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
}

export function parseMessages(input) {
  const messages = parseMessageBlocks(input);
  const candidates = messages.map(parseEvent).filter(Boolean);
  const groups = [];

  for (const event of candidates) {
    const group = groups.find(item => titlesMatch(item.event.title, event.title) || sameLinkedEvent(item.event, event));
    if (!group) {
      groups.push({ event, events: [event] });
      continue;
    }
    group.events.push(event);
    if (event.postedAt > group.event.postedAt) group.event = event;
  }

  return { messages, events: groups.map(group => group.event), candidates };
}
