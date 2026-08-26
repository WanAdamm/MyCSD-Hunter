<script>
  import { calendarFilename, createGoogleCalendarUrl, createIcsCalendar } from './calendar.js';

  let { event, schedule, index = 0, compact = false } = $props();
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

<nav class:compact class="calendar-actions" aria-label={`Add ${event.title} to a calendar`}>
  <span>Add to calendar</span>
  <a href={googleUrl} target="_blank" rel="noreferrer">Google</a>
  <button type="button" onclick={downloadAppleCalendar}>Apple</button>
</nav>
