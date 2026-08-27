<script>
  import { onMount } from "svelte";
  import EventCard from "./lib/EventCard.svelte";
  import EventCalendar from "./lib/EventCalendar.svelte";
  import { translations } from "./lib/i18n.js";

  let events = $state([]);
  let loading = $state(true);
  let error = $state("");
  let search = $state("");
  let category = $state("all");
  let mycsdOnly = $state(false);
  let feeFilter = $state("all");
  let activeView = $state("list");
  let lang = $state("en");
  const baseUrl = import.meta.env.BASE_URL;

  const t = $derived(translations[lang]);

  const PAGE_SIZE = 12;
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
  const totalPages = $derived(
    Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE)),
  );
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
      error = "Events could not be loaded. Refresh the page or try again later.";
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

  function toggleLang() {
    lang = lang === "en" ? "ms" : "en";
  }
</script>

<svelte:head>
  <title>MyCSD Hunter - Discover USM Events</title>
</svelte:head>

<header class="site-header">
  <nav class="nav-shell" aria-label={t.navLabel}>
    <a class="brand" href={baseUrl} aria-label={t.brandLabel}>
      <img
        class="brand-crest"
        src={baseUrl + 'assets/usm-crest.webp'}
        alt="Jata USM"
      />
      <span>MyCSD Hunter</span>
    </a>

    <div class="nav-right">
      <span class="source-label">{t.sourceLabel}</span>
      <button class="lang-toggle" onclick={toggleLang} aria-label="Toggle language">
        {t.langToggle}
      </button>
    </div>
  </nav>
  <div class="hero">
    <p class="eyebrow">{t.eyebrow}</p>
    <h1>{t.heroH1a}<br /><em>{t.heroH1b}</em></h1>
    <p class="hero-copy">{t.heroCopy}</p>
    <div class="hero-rule" aria-hidden="true"><span></span></div>
  </div>
</header>

<main>
  <section class="filter-panel" aria-label="Event filters">
    <label class="search-field">
      <span class="sr-only">{t.searchSrOnly}</span>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"
        ><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg
      >
      <input
        bind:value={search}
        type="search"
        placeholder={t.searchPlaceholder}
      />
    </label>
    <label class="select-field">
      <span class="sr-only">{t.filterByCategorySr}</span>
      <select bind:value={category}>
        <option value="all">{t.allCategories}</option>
        {#each categories as item}
          <option value={item}>{item}</option>
        {/each}
      </select>
    </label>
    <label class="select-field">
      <span class="sr-only">{t.filterByFeeSr}</span>
      <select bind:value={feeFilter}>
        <option value="all">{t.allFees}</option>
        <option value="free">{t.freeOnly}</option>
        <option value="paid">{t.paidOnly}</option>
      </select>
    </label>
    <label class="check-field">
      <input bind:checked={mycsdOnly} type="checkbox" />
      <span>{t.mycsdOnly}</span>
    </label>
  </section>

  <section class="dashboard" aria-labelledby="view-heading">
    <div class="dashboard-heading">
      <div>
        <p class="section-kicker">{t.browseOpportunities}</p>
        <h2 id="view-heading">
          {activeView === "list" ? t.listingsLabel : t.calendarLabel}
        </h2>
        {#if !loading && !error}
          <p class="result-count" aria-live="polite">
            {#if activeView === "list" && filteredEvents.length > 0}
              {t.showingOf(
                (activePage - 1) * PAGE_SIZE + 1,
                Math.min(activePage * PAGE_SIZE, filteredEvents.length),
                filteredEvents.length,
              )}
            {:else}
              {t.eventsFound(filteredEvents.length)}
            {/if}
          </p>
        {/if}
      </div>
      <div class="view-tabs" role="tablist" aria-label="Event view">
        <button
          class:active={activeView === "list"}
          onclick={() => (activeView = "list")}
          role="tab"
          aria-selected={activeView === "list"}>{t.listTab}</button
        >
        <button
          class:active={activeView === "calendar"}
          onclick={() => (activeView = "calendar")}
          role="tab"
          aria-selected={activeView === "calendar"}>{t.calendarTab}</button
        >
      </div>
    </div>

    {#if loading}
      <div class="status-card" aria-live="polite">
        <span class="loader" aria-hidden="true"></span>
        <h3>{t.loadingTitle}</h3>
        <p>{t.loadingText}</p>
      </div>
    {:else if error}
      <div class="status-card error" role="alert">
        <h3>{t.errorTitle}</h3>
        <p>{error}</p>
        <button onclick={() => location.reload()}>{t.tryAgain}</button>
      </div>
    {:else if filteredEvents.length === 0}
      <div class="status-card">
        <h3>{t.noEventsTitle}</h3>
        <p>{t.noEventsText}</p>
        <button onclick={clearFilters}>{t.clearFilters}</button>
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
              {t.prevPage}
            </button>
            <div class="page-numbers">
              {#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
                <button
                  class="page-btn num-btn"
                  class:active={page === activePage}
                  onclick={() => goToPage(page)}
                  aria-label={t.pageLabel(page)}
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
              {t.nextPage}
            </button>
          </nav>
        {/if}
      </div>
    {:else}
      <div role="tabpanel" aria-label="Event calendar">
        <EventCalendar events={filteredEvents} {lang} />
      </div>
    {/if}
  </section>
</main>

<footer>
  <div>
    <a class="brand footer-brand" href={baseUrl}>MyCSD Hunter</a>
    <p>{t.footerTagline}</p>
  </div>
  <a href="https://t.me/mycsd" target="_blank" rel="noreferrer"
    >{t.openTelegram}</a
  >
</footer>
