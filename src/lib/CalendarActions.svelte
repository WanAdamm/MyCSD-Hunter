<script>
  import { calendarFilename, createGoogleCalendarUrl, createIcsCalendar } from './calendar.js';
  import { translations } from './i18n.js';

  let { event, schedule, index = 0, compact = false, lang = 'ms' } = $props();
  const t = $derived(translations[lang]);
  const googleUrl = $derived(createGoogleCalendarUrl(event, schedule));

  function downloadAppleCalendar() {
    const content = createIcsCalendar([{ event, schedule, index }], event.title);
    const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = calendarFilename(event);
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
</script>

<nav class:compact class="calendar-actions" aria-label={`${t.addToCalendar}: ${event.title}`}>
  <span>{t.addToCalendar}</span>
  <a href={googleUrl} target="_blank" rel="noreferrer">Google</a>
  <button type="button" onclick={downloadAppleCalendar}>Apple</button>
</nav>
