<script>
  import CalendarActions from './CalendarActions.svelte';
  import { translations } from './i18n.js';

  let { event, lang = 'ms' } = $props();
  const t = $derived(translations[lang]);
  const crestUrl = `${import.meta.env.BASE_URL}assets/usm-crest.webp`;

  const displayTitle = $derived(event.title || event.organization || t.untitledEvent);
  const initials = $derived(displayTitle.split(/\s+/).filter(word => /^[A-Za-z0-9]/.test(word)).slice(0, 3).map(word => word[0]).join('').toUpperCase());
  const summary = $derived(event.description?.replace(/\s+/g, ' ').slice(0, 190) || t.noDescription);
  const primarySchedule = $derived(event.calendar_entries?.[0]);
  const feeLabel = $derived(event.fee?.free === true ? t.free : event.fee?.amount || t.feeNotStatedText);
  const actionUrl = $derived(safeUrl(event.registration_link) || safeUrl(event.source_url));
  const actionLabel = $derived(safeUrl(event.registration_link) ? t.openRegistration : t.viewTelegramPost);

  function parseDate(value) {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function formatDate(value) {
    const date = parseDate(value);
    return date ? new Intl.DateTimeFormat(t.locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(date) : '';
  }

  function formatSchedule(schedule) {
    if (!schedule) return t.dateNotStated;
    if (schedule.start === schedule.end) return formatDate(schedule.start);
    return `${formatDate(schedule.start)} - ${formatDate(schedule.end)}`;
  }

  function formatPosted(value) {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? t.recently : new Intl.DateTimeFormat(t.locale, { day: 'numeric', month: 'short' }).format(date);
  }

  function safeUrl(value) {
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  }
</script>

<article class:mycsd={event.mycsd_provided} class="event-card">
  <div class="card-visual">
    <img src={crestUrl} alt="" aria-hidden="true" />
    <span class="monogram" aria-hidden="true">{initials}</span>
    <span class="posted">{t.postedPrefix} {formatPosted(event.date_posted)}</span>
    {#if event.mycsd_provided}<span class="mycsd-badge">MyCSD</span>{/if}
  </div>
  <div class="card-body">
    <p class="category">{event.type || 'Programme'}</p>
    <h3>{displayTitle}</h3>
    {#if event.organization && event.organization !== displayTitle}
      <p class="organizer">{event.organization}</p>
    {/if}
    <p class="description">{summary}{event.description?.replace(/\s+/g, ' ').length > 190 ? '...' : ''}</p>
    <div class="fee-block">
      <span class="fee-icon" class:free={event.fee?.free === true} class:paid={event.fee?.free === false} class:not-stated={event.fee?.free == null} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2m0 4v2m0 4v2"/></svg>
      </span>
      <span><small>{t.feeLabelHeader}</small>{feeLabel}</span>
    </div>
    <div class="schedule">
      <span class="date-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><path d="M7 3v4m10-4v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"/></svg>
      </span>
      <span><small>{primarySchedule?.label || t.scheduleLabelHeader}</small>{formatSchedule(primarySchedule)}</span>
    </div>
  </div>
  {#if primarySchedule}
    <CalendarActions {event} schedule={primarySchedule} {lang} />
  {/if}
  {#if actionUrl}
    <a class="card-action" href={actionUrl} target="_blank" rel="noreferrer">
      <span>{actionLabel}</span><span aria-hidden="true">&rarr;</span>
    </a>
  {/if}
</article>
