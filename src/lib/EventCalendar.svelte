<script>
  import { createAppleSubscriptionUrl, createGoogleSubscriptionUrl, createGoogleCalendarUrl, createIcsCalendar, calendarFilename } from './calendar.js';
  import { translations } from './i18n.js';

  import { onMount } from 'svelte';
  let { events, lang = 'en' } = $props();
  const t = $derived(translations[lang]);

  const MAX_VISIBLE_LANES = 3;

  const today = atMidnight(new Date());
  let mode = $state('month');
  let cursor = $state(new Date(today));
  let selected = $state(new Date(today));
  let isMobile = $state(false);

  const items = $derived(events.flatMap(event => (event.calendar_entries || []).map((entry, index) => ({
    ...entry,
    event,
    scheduleIndex: index,
    id: `${event.id}-${index}`,
    displayLabel: entry.label,
  }))));
  const period = $derived(getPeriod(cursor, isMobile ? 'week' : mode));
  const weeks = $derived(makeWeeks(period.start, period.end));
  const selectedKey = $derived(toKey(selected));
  const agenda = $derived(items.filter(item => item.start <= selectedKey && item.end >= selectedKey));
  const feedUrl = new URL(`${import.meta.env.BASE_URL}calendar.ics`, window.location.origin).href;
  const googleSubscriptionUrl = createGoogleSubscriptionUrl(feedUrl);
  const appleSubscriptionUrl = createAppleSubscriptionUrl(feedUrl);

  // Days of the current week for the mobile date-strip
  const weekDays = $derived(Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i)));

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
      const end = endOfWeek(date);
      return { start, end, label: `${formatDate(start)} - ${formatDate(end)}` };
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
    const mapped = segments.map(item => {
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

    // Build per-day overflow counts for the "+N more" badges
    const overflowByDay = {};
    for (let i = 0; i < 7; i++) {
      const dayKey = toKey(addDays(weekStart, i));
      const hidden = mapped.filter(s => s.lane >= MAX_VISIBLE_LANES && s.start <= dayKey && s.end >= dayKey);
      if (hidden.length) overflowByDay[i] = hidden.length;
    }

    return { segments: mapped.filter(s => s.lane < MAX_VISIBLE_LANES), overflowByDay };
  }

  function formatDate(date, full = false) {
    if (full) {
      const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date);
      const short   = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
      return { weekday, short };
    }
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
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

  // Count events on a given date key for the mobile strip dots
  function eventCountOn(date) {
    const key = toKey(date);
    return items.filter(item => item.start <= key && item.end >= key).length;
  }

  onMount(() => {
    const mq = window.matchMedia('(max-width: 620px)');
    isMobile = mq.matches;
    mq.addEventListener('change', e => { isMobile = e.matches; });
  });

  function safeUrl(value) {
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  }

  function downloadIcs(item) {
    const content = createIcsCalendar([{ event: item.event, schedule: item, index: item.scheduleIndex }], item.event.title);
    const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = calendarFilename(item.event);
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
</script>

<div class="calendar-toolbar">
  <div class="period-controls">
    <button onclick={() => movePeriod(-1)} aria-label="Previous period">&larr;</button>
    <button onclick={goToday}>{t.today}</button>
    <button onclick={() => movePeriod(1)} aria-label="Next period">&rarr;</button>
    <h3>{period.label}</h3>
  </div>
  <div class="calendar-toolbar-actions">
    {#if !isMobile}
    <div class="mode-controls" aria-label="Calendar period">
        <button class:active={mode === 'month'} onclick={() => setMode('month')} aria-pressed={mode === 'month'}>{t.monthMode}</button>
        <button class:active={mode === 'week'} onclick={() => setMode('week')} aria-pressed={mode === 'week'}>{t.weekMode}</button>
    </div>
    <nav class="subscription-actions" aria-label="Subscribe to the full calendar">
      <span>{t.subscribe}</span>
      <a href={googleSubscriptionUrl} target="_blank" rel="noreferrer">Google</a>
      <a href={appleSubscriptionUrl}>Apple</a>
    </nav>
  {/if}
  </div>
</div>

<div class="legend" aria-label="Calendar legend">
  <span><i class="event"></i>{t.legendEvent}</span><span><i class="interview"></i>{t.legendInterview}</span>
  <span><i class="registration"></i>{t.legendRegistration}</span><span><i class="deadline"></i>{t.legendDeadline}</span>
</div>

<div class="calendar-body">
  <div class="calendar-main">
    {#if isMobile}
      <!-- Mobile: compact week date-strip -->
      <div class="date-strip" role="group" aria-label="Select a day">
        {#each weekDays as date}
          {@const count = eventCountOn(date)}
          <button
            class="strip-day"
            class:today={toKey(date) === toKey(today)}
            class:selected={toKey(date) === selectedKey}
            onclick={() => selectDate(date)}
            aria-label={`Show activities for ${formatDate(date)}`}
            aria-pressed={toKey(date) === selectedKey}
          >
            <span class="strip-weekday">{new Intl.DateTimeFormat('en-GB', { weekday: 'narrow' }).format(date)}</span>
            <span class="strip-date">{date.getDate()}</span>
            {#if count > 0}<span class="strip-dot" aria-hidden="true"></span>{/if}
          </button>
        {/each}
      </div>
    {:else}
      <!-- Desktop/tablet: full grid -->
      <div class="calendar-scroll">
        <div class="calendar-canvas">
          <div class="weekdays">
          {#each t.weekdays as day}<span>{day}</span>{/each}
          </div>
          {#each weeks as weekStart}
            {@const wd = weekData(weekStart)}
            {@const segments = wd.segments}
            {@const overflowByDay = wd.overflowByDay}
            {@const laneCount = Math.min(MAX_VISIBLE_LANES, Math.max(1, ...segments.map(item => item.lane + 1)))}
            <div class="calendar-week" style={`grid-template-rows: 2.4rem repeat(${laneCount}, 1.75rem) 1.1rem`}>
              {#each Array(7) as _, index}
                {@const date = addDays(weekStart, index)}
                <button
                  class:outside={mode === 'month' && date.getMonth() !== cursor.getMonth()}
                  class:today={toKey(date) === toKey(today)}
                  class:selected={toKey(date) === selectedKey}
                  class:has-overflow={!!overflowByDay[index]}
                  class="calendar-day"
                  style={`grid-column: ${index + 1}; grid-row: 1 / -1`}
                  onclick={() => selectDate(date)}
                  aria-label={`Show activities for ${formatDate(date)}`}
                >
                  <span>{date.getDate()}</span>
                </button>
              {/each}
              {#each segments as item (item.id)}
                <button
                  class:continues-left={item.continuesLeft}
                  class:continues-right={item.continuesRight}
                  class={`calendar-entry ${item.kind}`}
                  style={`grid-column: ${item.column} / span ${item.span}; grid-row: ${item.lane + 2}`}
                  onclick={() => selectDate(parseDate(item.start < toKey(weekStart) ? toKey(weekStart) : item.start))}
                  title={`${item.displayLabel}: ${item.event.title}`}
                >{item.displayLabel}: {item.event.title}</button>
              {/each}
              {#each Object.entries(overflowByDay) as [col, count]}
                <button
                  class="overflow-badge"
                  style={`grid-column: ${Number(col) + 1}; grid-row: ${laneCount + 2}`}
                  onclick={() => selectDate(addDays(weekStart, Number(col)))}
                  title="{count} more — click to view"
                >{t.moreEvents(count)}</button>
              {/each}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <aside class="agenda" aria-labelledby="agenda-heading">
    <div class="agenda-heading">
      <div>
        <p>{t.selectedDate}</p>
        <span class="agenda-weekday">{formatDate(selected, true).weekday}</span>
        <h3 id="agenda-heading">{formatDate(selected, true).short}</h3>
      </div>
      <span class="agenda-count">{t.activityCount(agenda.length)}</span>
    </div>
    {#if agenda.length === 0}
      <p class="empty-agenda">{t.noActivities}</p>
    {:else}
      <div class="agenda-list">
        {#each agenda as item (item.id)}
          <article>
            <div class="agenda-item-left">
              <i class={item.kind}></i>
              <div class="agenda-item-desc">
                <small>{item.displayLabel} · {formatRange(item)}</small>
                <h4>{item.event.title}</h4>
                <span class="agenda-item-type">{item.event.type}</span>
              </div>
            </div>
            <div class="agenda-item-right">
              {#if item.event.fee?.free === true}
                <span class="fee-badge free">{t.free}</span>
              {:else if item.event.fee?.amount}
                <span class="fee-badge paid">{item.event.fee.amount}</span>
              {:else}
                <span class="fee-badge not-stated">{t.feeNotStated}</span>
              {/if}
              <a href={createGoogleCalendarUrl(item.event, item)} target="_blank" rel="noreferrer" class="agenda-action-btn">Google</a>
              <button type="button" class="agenda-action-btn" onclick={() => downloadIcs(item)}>Apple</button>
              {#if safeUrl(item.event.registration_link || item.event.source_url)}
                <a href={safeUrl(item.event.registration_link || item.event.source_url)} target="_blank" rel="noreferrer" class="agenda-action-btn agenda-action-primary">{t.detailsBtn}</a>
              {/if}
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </aside>
</div>
