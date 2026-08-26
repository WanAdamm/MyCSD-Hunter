<script>
  import CalendarActions from './CalendarActions.svelte';

  let { event } = $props();
  const crestUrl = `${import.meta.env.BASE_URL}assets/usm-crest.webp`;

  const displayTitle = $derived(event.title || event.organization || 'Untitled event');
  const initials = $derived(displayTitle.split(/\s+/).filter(word => /^[A-Za-z0-9]/.test(word)).slice(0, 3).map(word => word[0]).join('').toUpperCase());
  const summary = $derived(event.description?.replace(/\s+/g, ' ').slice(0, 190) || 'No description was extracted.');
  const primarySchedule = $derived(event.calendar_entries?.[0]);
  const actionUrl = $derived(safeUrl(event.registration_link) || safeUrl(event.source_url));
  const actionLabel = $derived(safeUrl(event.registration_link) ? 'Open registration' : 'View Telegram post');

  function parseDate(value) {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function formatDate(value) {
    const date = parseDate(value);
    return date ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date) : '';
  }

  function formatSchedule(schedule) {
    if (!schedule) return 'Date not stated';
    if (schedule.start === schedule.end) return formatDate(schedule.start);
    return `${formatDate(schedule.start)} - ${formatDate(schedule.end)}`;
  }

  function formatPosted(value) {
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? 'Recently' : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date);
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
    <span class="posted">Posted {formatPosted(event.date_posted)}</span>
    {#if event.mycsd_provided}<span class="mycsd-badge">MyCSD</span>{/if}
  </div>
  <div class="card-body">
    <p class="category">{event.type || 'Programme'}</p>
    <h3>{displayTitle}</h3>
    {#if event.organization && event.organization !== displayTitle}
      <p class="organizer">{event.organization}</p>
    {/if}
    <p class="description">{summary}{event.description?.replace(/\s+/g, ' ').length > 190 ? '...' : ''}</p>
    <div class="schedule">
      <span class="date-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><path d="M7 3v4m10-4v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"/></svg>
      </span>
      <span><small>{primarySchedule?.label || 'Schedule'}</small>{formatSchedule(primarySchedule)}</span>
    </div>
  </div>
  {#if primarySchedule}
    <CalendarActions {event} schedule={primarySchedule} />
  {/if}
  {#if actionUrl}
    <a class="card-action" href={actionUrl} target="_blank" rel="noreferrer">
      <span>{actionLabel}</span><span aria-hidden="true">&rarr;</span>
    </a>
  {/if}
</article>
