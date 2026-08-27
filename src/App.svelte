<script>
  import { onMount } from "svelte";
  import EventCard from "./lib/EventCard.svelte";
  import EventCalendar from "./lib/EventCalendar.svelte";

  let events = $state([]);
  let loading = $state(true);
  let error = $state("");
  let search = $state("");
  let category = $state("all");
  let mycsdOnly = $state(false);
  let feeFilter = $state("all");
  let activeView = $state("list");
  const baseUrl = import.meta.env.BASE_URL;

  const PAGE_SIZE = 20;
  let currentPage = $state(1);

  const categories = $derived(
    [...new Set(events.map((event) => event.type).filter(Boolean))].sort(),
  );
  const filteredEvents = $derived(
    events.filter((event) => {
      const query = search.trim().toLowerCase();
      const searchable =
        `${event.title || ""} ${event.organization || ""} ${event.type || ""} ${event.description || ""}`.toLowerCase();
      return (
        searchable.includes(query) &&
        (category === "all" || event.type === category) &&
        (!mycsdOnly || event.mycsd_provided) &&
        (feeFilter === "all" ||
          (feeFilter === "free" && event.fee?.free === true) ||
          (feeFilter === "paid" && event.fee?.free === false))
      );
    }),
  );
  const totalPages = $derived(Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE)));
  const activePage = $derived(Math.min(currentPage, totalPages));
  const displayedEvents = $derived(
    filteredEvents.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE),
  );

  function goToPage(page) {
    currentPage = Math.max(1, Math.min(page, totalPages));
    document.getElementById("view-heading")?.scrollIntoView({ behavior: "smooth" });
  }

  onMount(async () => {
    try {
      const response = await fetch(`${baseUrl}events.json`);
      if (!response.ok)
        throw new Error(`Request failed with status ${response.status}`);
      events = await response.json();
    } catch (requestError) {
      error =
        "Events could not be loaded. Refresh the page or try again later.";
      console.error(requestError);
    } finally {
      loading = false;
    }
  });

  function clearFilters() {
    search = "";
    category = "all";
    mycsdOnly = false;
    feeFilter = "all";
    currentPage = 1;
  }
</script>

<svelte:head>
  <title>MyCSD Hunter - Discover USM Events</title>
</svelte:head>

<header class="site-header">
  <nav class="nav-shell" aria-label="Main navigation">
    <a class="brand" href={baseUrl} aria-label="MyCSD Hunter home">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"
          ><path d="M4 8.5 12 4l8 4.5-8 4.5-8-4.5Z" /><path
            d="M7 11v4.5c2.8 2 7.2 2 10 0V11M20 9v6"
          /></svg
        >
      </span>
      <span>MyCSD Hunter</span>
    </a>

    <span class="source-label">Sourced from @mycsd</span>
  </nav>
  <div class="hero">
    <p class="eyebrow">Universiti Sains Malaysia · Pulau Pinang</p>
    <h1>Your campus,<br /><em>all in one place.</em></h1>
    <p class="hero-copy">Clubs, events, recruitment, and MyCSD-eligible activities across USM, pulled from the telegram channel and laid out so you never miss a deadline or an opportunity.</p>
    <div class="hero-rule" aria-hidden="true"><span></span></div>
  </div>
</header>

<main>
  <section class="filter-panel" aria-label="Event filters">
    <label class="search-field">
      <span class="sr-only">Search events</span>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"
        ><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg
      >
      <input
        bind:value={search}
        type="search"
        placeholder="Search title, organizer, or details"
      />
    </label>
    <label class="select-field">
      <span class="sr-only">Filter by category</span>
      <select bind:value={category}>
        <option value="all">All categories</option>
        {#each categories as item}
          <option value={item}>{item}</option>
        {/each}
      </select>
    </label>
    <label class="select-field">
      <span class="sr-only">Filter by fee</span>
      <select bind:value={feeFilter}>
        <option value="all">All fees</option>
        <option value="free">Free only</option>
        <option value="paid">Paid only</option>
      </select>
    </label>
    <label class="check-field">
      <input bind:checked={mycsdOnly} type="checkbox" />
      <span>MyCSD only</span>
    </label>
  </section>

  <section class="dashboard" aria-labelledby="view-heading">
    <div class="dashboard-heading">
      <div>
        <p class="section-kicker">Browse opportunities</p>
        <h2 id="view-heading">
          {activeView === "list" ? "Current listings" : "Event calendar"}
        </h2>
        {#if !loading && !error}
          <p class="result-count" aria-live="polite">
            {#if activeView === "list" && filteredEvents.length > 0}
              Showing {(activePage - 1) * PAGE_SIZE + 1}–{Math.min(activePage * PAGE_SIZE, filteredEvents.length)} of {filteredEvents.length} events
            {:else}
              {filteredEvents.length}
              {filteredEvents.length === 1 ? "event" : "events"} found
            {/if}
          </p>
        {/if}
      </div>
      <div class="view-tabs" role="tablist" aria-label="Event view">
        <button
          class:active={activeView === "list"}
          onclick={() => (activeView = "list")}
          role="tab"
          aria-selected={activeView === "list"}>List</button
        >
        <button
          class:active={activeView === "calendar"}
          onclick={() => (activeView = "calendar")}
          role="tab"
          aria-selected={activeView === "calendar"}>Calendar</button
        >
      </div>
    </div>

    {#if loading}
      <div class="status-card" aria-live="polite">
        <span class="loader" aria-hidden="true"></span>
        <h3>Reading the opportunity board</h3>
        <p>Loading extracted events and calendar entries.</p>
      </div>
    {:else if error}
      <div class="status-card error" role="alert">
        <h3>Events are unavailable</h3>
        <p>{error}</p>
        <button onclick={() => location.reload()}>Try again</button>
      </div>
    {:else if filteredEvents.length === 0}
      <div class="status-card">
        <h3>No matching events</h3>
        <p>Try a broader search or remove one of the filters.</p>
        <button onclick={clearFilters}>Clear filters</button>
      </div>
    {:else if activeView === "list"}
      <div class="list-view-container" role="tabpanel" aria-label="Event list">
        <div class="event-grid">
          {#each displayedEvents as event (event.id)}
            <EventCard {event} />
          {/each}
        </div>
        {#if totalPages > 1}
          <nav class="pagination" aria-label="Event list pagination">
            <button
              class="page-btn nav-btn"
              disabled={activePage === 1}
              onclick={() => goToPage(activePage - 1)}
              aria-label="Previous page"
            >
              &larr; Prev
            </button>
            <div class="page-numbers">
              {#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
                <button
                  class="page-btn num-btn"
                  class:active={page === activePage}
                  onclick={() => goToPage(page)}
                  aria-label={`Page ${page}`}
                  aria-current={page === activePage ? "page" : undefined}
                >
                  {page}
                </button>
              {/each}
            </div>
            <button
              class="page-btn nav-btn"
              disabled={activePage === totalPages}
              onclick={() => goToPage(activePage + 1)}
              aria-label="Next page"
            >
              Next &rarr;
            </button>
          </nav>
        {/if}
      </div>
    {:else}
      <div role="tabpanel" aria-label="Event calendar">
        <EventCalendar events={filteredEvents} />
      </div>
    {/if}
  </section>
</main>

<footer>
  <div>
    <a class="brand footer-brand" href={baseUrl}>MyCSD Hunter</a>
    <p>Built for Universiti Sains Malaysia students.</p>
  </div>
  <a href="https://t.me/mycsd" target="_blank" rel="noreferrer"
    >Open Telegram channel</a
  >
</footer>
