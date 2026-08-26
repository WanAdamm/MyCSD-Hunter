<script>
  import CalendarActions from './CalendarActions.svelte';
  import { createAppleSubscriptionUrl, createGoogleSubscriptionUrl } from './calendar.js';

  let { events } = $props();

  const today = atMidnight(new Date());
  let mode = $state('month');
  let cursor = $state(new Date(today));
  let selected = $state(new Date(today));

  const items = $derived(events.flatMap(event => (event.calendar_entries || []).map((entry, index) => ({ ...entry, event, scheduleIndex: index, id: `${event.id}-${index}` }))));
  const period = $derived(getPeriod(cursor, mode));
  const weeks = $derived(makeWeeks(period.start, period.end));
  const selectedKey = $derived(toKey(selected));
  const agenda = $derived(items.filter(item => item.start <= selectedKey && item.end >= selectedKey));
  const feedUrl = new URL(`${import.meta.env.BASE_URL}calendar.ics`, window.location.origin).href;
  const googleSubscriptionUrl = createGoogleSubscriptionUrl(feedUrl);
  const appleSubscriptionUrl = createAppleSubscriptionUrl(feedUrl);

  function atMidnight(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays(date, amount) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
  }

  function startOfWeek(date) {
    return addDays(date, -((date.getDay() + 6) % 7));
  }

  function endOfWeek(date) {
    return addDays(startOfWeek(date), 6);
  }

  function toKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function parseDate(key) {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function getPeriod(date, calendarMode) {
    if (calendarMode === 'week') {
      const start = startOfWeek(date);
      return { start, end: endOfWeek(date), label: `${formatDate(start)} - ${formatDate(end)}` };
    }
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return {
      start: startOfWeek(monthStart),
      end: endOfWeek(monthEnd),
      label: new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(monthStart)
    };
  }

  function makeWeeks(start, end) {
    const result = [];
    for (let date = start; date <= end; date = addDays(date, 7)) result.push(new Date(date));
    return result;
  }

  function weekData(weekStart) {
    const weekEnd = endOfWeek(weekStart);
    const startKey = toKey(weekStart);
    const endKey = toKey(weekEnd);
    const segments = items
      .filter(item => item.start <= endKey && item.end >= startKey)
      .sort((a, b) => a.start.localeCompare(b.start) || b.end.localeCompare(a.end));
    const laneEnds = [];
    return segments.map(item => {
      let lane = laneEnds.findIndex(end => end < item.start);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = item.end;
      const segmentStart = item.start < startKey ? startKey : item.start;
      const segmentEnd = item.end > endKey ? endKey : item.end;
      return {
        ...item,
        lane,
        column: Math.round((parseDate(segmentStart) - weekStart) / 86400000) + 1,
        span: Math.round((parseDate(segmentEnd) - parseDate(segmentStart)) / 86400000) + 1,
        continuesLeft: item.start < startKey,
        continuesRight: item.end > endKey
      };
    });
  }

  function formatDate(date, full = false) {
    return new Intl.DateTimeFormat('en-GB', full
      ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      : { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  }

  function formatRange(item) {
    if (item.start === item.end) return formatDate(parseDate(item.start));
    return `${formatDate(parseDate(item.start))} - ${formatDate(parseDate(item.end))}`;
  }

  function selectDate(date) {
    selected = new Date(date);
    if (mode === 'month' && selected.getMonth() !== cursor.getMonth()) cursor = new Date(selected);
  }

  function movePeriod(amount) {
    cursor = mode === 'month'
      ? new Date(cursor.getFullYear(), cursor.getMonth() + amount, 1)
      : addDays(cursor, amount * 7);
    selected = new Date(cursor);
  }

  function setMode(nextMode) {
    mode = nextMode;
    cursor = new Date(selected);
  }

  function goToday() {
    cursor = new Date(today);
    selected = new Date(today);
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

<div class="calendar-toolbar">
  <div class="period-controls">
    <button onclick={() => movePeriod(-1)} aria-label="Previous period">&larr;</button>
    <button onclick={goToday}>Today</button>
    <button onclick={() => movePeriod(1)} aria-label="Next period">&rarr;</button>
    <h3>{period.label}</h3>
  </div>
  <div class="calendar-toolbar-actions">
    <div class="mode-controls" aria-label="Calendar period">
      <button class:active={mode === 'month'} onclick={() => setMode('month')} aria-pressed={mode === 'month'}>Month</button>
      <button class:active={mode === 'week'} onclick={() => setMode('week')} aria-pressed={mode === 'week'}>Week</button>
    </div>
    <nav class="subscription-actions" aria-label="Subscribe to the full calendar">
      <span>Subscribe</span>
      <a href={googleSubscriptionUrl} target="_blank" rel="noreferrer">Google</a>
      <a href={appleSubscriptionUrl}>Apple</a>
    </nav>
  </div>
</div>

<div class="legend" aria-label="Calendar legend">
  <span><i class="event"></i>Event</span><span><i class="interview"></i>Interview</span>
  <span><i class="registration"></i>Registration</span><span><i class="deadline"></i>Deadline</span>
</div>

<div class="calendar-scroll">
  <div class="calendar-canvas">
    <div class="weekdays">
      {#each ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as day}<span>{day}</span>{/each}
    </div>
    {#each weeks as weekStart}
      {@const segments = weekData(weekStart)}
      {@const laneCount = Math.max(1, ...segments.map(item => item.lane + 1))}
      <div class="calendar-week" style={`grid-template-rows: 2.4rem repeat(${laneCount}, 1.8rem) .6rem`}>
        {#each Array(7) as _, index}
          {@const date = addDays(weekStart, index)}
          <button
            class:outside={mode === 'month' && date.getMonth() !== cursor.getMonth()}
            class:today={toKey(date) === toKey(today)}
            class:selected={toKey(date) === selectedKey}
            class="calendar-day"
            style={`grid-column: ${index + 1}; grid-row: 1 / -1`}
            onclick={() => selectDate(date)}
            aria-label={`Show activities for ${formatDate(date, true)}`}
          ><span>{date.getDate()}</span></button>
        {/each}
        {#each segments as item (item.id)}
          <button
            class:continues-left={item.continuesLeft}
            class:continues-right={item.continuesRight}
            class={`calendar-entry ${item.kind}`}
            style={`grid-column: ${item.column} / span ${item.span}; grid-row: ${item.lane + 2}`}
            onclick={() => selectDate(parseDate(item.start < toKey(weekStart) ? toKey(weekStart) : item.start))}
            title={`${item.label}: ${item.event.title}`}
          >{item.label}: {item.event.title}</button>
        {/each}
      </div>
    {/each}
  </div>
</div>

<section class="agenda" aria-labelledby="agenda-heading">
  <div class="agenda-heading">
    <div><p>Selected date</p><h3 id="agenda-heading">{formatDate(selected, true)}</h3></div>
    <span>{agenda.length} {agenda.length === 1 ? 'activity' : 'activities'}</span>
  </div>
  {#if agenda.length === 0}
    <p class="empty-agenda">No scheduled activities for this date.</p>
  {:else}
    <div class="agenda-list">
      {#each agenda as item (item.id)}
        <article>
          <i class={item.kind}></i>
          <div><small>{item.label} | {formatRange(item)}</small><h4>{item.event.title}</h4><p>{item.event.type}</p></div>
          <nav class="agenda-item-actions" aria-label={`Actions for ${item.event.title}`}>
            <CalendarActions event={item.event} schedule={item} index={item.scheduleIndex} compact />
            {#if safeUrl(item.event.registration_link || item.event.source_url)}
              <a href={safeUrl(item.event.registration_link || item.event.source_url)} target="_blank" rel="noreferrer">Details</a>
            {/if}
          </nav>
        </article>
      {/each}
    </div>
  {/if}
</section>
