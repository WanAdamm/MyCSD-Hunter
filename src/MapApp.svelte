<script>
  import { onMount, tick } from 'svelte';
  import { campusLocations, campusZones, getGoogleMapsUrl } from './lib/campusLocations.js';
  import { translations } from './lib/i18n.js';

  const baseUrl = import.meta.env.BASE_URL;
  const zoneEntries = Object.entries(campusZones);
  let lang = $state('en');
  let search = $state('');
  let activeZone = $state('all');
  let selected = $state(null);
  let zoom = $state(1);
  let mapViewport;
  let mapAvailable = $state(true);
  const t = $derived(translations[lang]);
  const filteredLocations = $derived(campusLocations.filter((place) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = `${place.code} ${place.name} ${place.aliases}`.toLowerCase().includes(query);
    return matchesSearch && (activeZone === 'all' || place.zone === activeZone);
  }));

  onMount(() => {
    const code = new URLSearchParams(location.search).get('place')?.toUpperCase();
    const place = campusLocations.find((item) => item.code === code);
    if (place) selectPlace(place, false);
  });

  async function selectPlace(place, updateUrl = true) {
    selected = place;
    activeZone = place.zone;
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set('place', place.code);
      history.replaceState({}, '', url);
    }
    await tick();
    const marker = mapViewport?.querySelector(`[data-code="${place.code}"]`);
    if (!marker) return;
    marker.focus({ preventScroll: true });
    mapViewport?.scrollTo({
      left: marker.offsetLeft - mapViewport.clientWidth / 2,
      top: marker.offsetTop - mapViewport.clientHeight / 2,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }

  async function setZoom(nextZoom) {
    const x = (mapViewport.scrollLeft + mapViewport.clientWidth / 2) / mapViewport.scrollWidth;
    const y = (mapViewport.scrollTop + mapViewport.clientHeight / 2) / mapViewport.scrollHeight;
    zoom = Math.max(1, Math.min(3, nextZoom));
    await tick();
    mapViewport.scrollTo({
      left: x * mapViewport.scrollWidth - mapViewport.clientWidth / 2,
      top: y * mapViewport.scrollHeight - mapViewport.clientHeight / 2,
    });
  }

  function resetMap() {
    zoom = 1;
    mapViewport.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
  }
</script>

<svelte:head>
  <title>{t.mapPageTitle}</title>
</svelte:head>

<header class="map-header">
  <nav class="nav-shell" aria-label={t.navLabel}>
    <a class="brand" href={baseUrl} aria-label={t.brandLabel}>
      <img class="brand-crest" src={baseUrl + 'assets/usm-crest.webp'} alt="Jata USM" />
      <span>MyCSD Hunter</span>
    </a>
    <div class="map-nav-links">
      <a href={baseUrl}>{t.eventsNav}</a>
      <a class="active" href={baseUrl + 'map/'} aria-current="page">{t.mapNav}</a>
      <button class="lang-toggle" onclick={() => (lang = lang === 'en' ? 'ms' : 'en')} aria-label="Toggle language">
        {t.langToggle}
      </button>
    </div>
  </nav>
  <div class="map-intro">
    <p class="eyebrow">{t.mapEyebrow}</p>
    <h1>{t.mapHeading}</h1>
    <p>{t.mapIntro}</p>
  </div>
</header>

<main class="map-page">
  <div class="map-workspace">
    <aside class="place-directory" aria-label={t.directoryLabel}>
      <label class="map-search">
        <span class="sr-only">{t.mapSearchLabel}</span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></svg>
        <input bind:value={search} type="search" placeholder={t.mapSearchPlaceholder} />
      </label>

      <div class="zone-filter" aria-label={t.zoneFilterLabel}>
        <button class:active={activeZone === 'all'} onclick={() => (activeZone = 'all')}>{t.allZones}</button>
        {#each zoneEntries as [code, zone]}
          <button
            class:active={activeZone === code}
            style:--zone-color={zone.color}
            onclick={() => (activeZone = code)}
            aria-label={`${t.zoneLabel} ${code}: ${zone.name}`}
          >{code}</button>
        {/each}
      </div>

      {#if selected}
        <section class="selected-place" style:--zone-color={campusZones[selected.zone].color} aria-live="polite">
          <span>{t.zoneLabel} {selected.zone}</span>
          <strong>{selected.code}</strong>
          <h2>{selected.name}</h2>
          <div class="selected-coords">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>{selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}</span>
          </div>
          <a
            class="selected-gmaps-link"
            href={getGoogleMapsUrl(selected)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span>{t.openInGoogleMaps}</span>
            <svg class="external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </section>
      {/if}

      <div class="directory-heading">
        <strong>{t.directoryLabel}</strong>
        <span>{t.placesFound(filteredLocations.length)}</span>
      </div>
      <div class="place-list">
        {#each filteredLocations as place (place.code)}
          <button class:selected={selected?.code === place.code} onclick={() => selectPlace(place)}>
            <span style:background={campusZones[place.zone].color}>{place.code}</span>
            <span>{place.name}<small>{t.zoneLabel} {place.zone}</small></span>
          </button>
        {:else}
          <p class="no-places">{t.noPlaces}</p>
        {/each}
      </div>
    </aside>

    <section class="map-panel" aria-label={t.interactiveMapLabel}>
      <div class="map-toolbar">
        <div>
          <strong>{t.mainCampus}</strong>
          <span>{t.mapHint}</span>
        </div>
        <div class="zoom-controls" aria-label={t.zoomControlsLabel}>
          <button onclick={() => setZoom(zoom - .25)} disabled={zoom === 1} aria-label={t.zoomOut}>−</button>
          <output aria-live="polite">{Math.round(zoom * 100)}%</output>
          <button onclick={() => setZoom(zoom + .25)} disabled={zoom === 3} aria-label={t.zoomIn}>+</button>
          <button class="reset-map" onclick={resetMap}>{t.resetMap}</button>
        </div>
      </div>

      <div class="map-viewport" bind:this={mapViewport}>
        <div class="map-canvas" style={`--map-width: ${zoom * 100}%; --map-min-width: ${48 * zoom}rem`}>
          <img
            src={baseUrl + 'assets/usm-main-campus-map.webp'}
            alt={t.mapImageAlt}
            onerror={() => (mapAvailable = false)}
          />
          {#if !mapAvailable}
            <div class="map-missing" role="status">
              <strong>{t.mapMissingTitle}</strong>
              <span>{t.mapMissingText}</span>
            </div>
          {/if}
          {#each campusLocations as place (place.code)}
            <button
              class="map-marker"
              class:selected={selected?.code === place.code}
              class:dimmed={activeZone !== 'all' && activeZone !== place.zone}
              style:left={`${place.x}%`}
              style:top={`${place.y}%`}
              style:--zone-color={campusZones[place.zone].color}
              data-code={place.code}
              onclick={() => selectPlace(place)}
              aria-label={`${place.code}: ${place.name}`}
              aria-pressed={selected?.code === place.code}
            >{place.code}</button>
          {/each}
        </div>
      </div>
    </section>
  </div>
</main>

<footer>
  <div><a class="brand footer-brand" href={baseUrl}>MyCSD Hunter</a><p>{t.footerTagline}</p></div>
  <a href={baseUrl}>{t.backToEvents}</a>
</footer>
