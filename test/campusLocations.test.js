import assert from 'node:assert/strict';
import test from 'node:test';
import {
  campusCategories,
  campusLocations,
  campusZones,
  getCategoryName,
  getGoogleMapsUrl,
  getPlaceName,
  getZoneName,
} from '../src/lib/campusLocations.js';

test('campus directory contains valid, uniquely coded map locations with GPS coordinates and bilingual names', () => {
  assert.equal(campusLocations.length, 102);
  assert.equal(new Set(campusLocations.map(({ code }) => code)).size, campusLocations.length);

  for (const place of campusLocations) {
    assert.ok(place.code && place.name);
    assert.ok(place.nameMs, `Missing Malay name for ${place.code}`);
    assert.ok(campusZones[place.zone], `Unknown zone for ${place.code}`);
    assert.ok(campusZones[place.zone].nameMs, `Missing Malay zone name for ${place.zone}`);
    assert.ok(place.x >= 0 && place.x <= 100, `Invalid x coordinate for ${place.code}`);
    assert.ok(place.y >= 0 && place.y <= 100, `Invalid y coordinate for ${place.code}`);
    assert.ok(typeof place.lat === 'number' && place.lat >= 5.35 && place.lat <= 5.37, `Invalid lat for ${place.code}`);
    assert.ok(typeof place.lng === 'number' && place.lng >= 100.28 && place.lng <= 100.32, `Invalid lng for ${place.code}`);
    assert.ok(Array.isArray(place.categories), `Missing categories array for ${place.code}`);
  }

  const g01 = campusLocations.find(p => p.code === 'G01');
  assert.ok(g01);
  assert.equal(g01.lat, 5.356954);
  assert.equal(g01.lng, 100.303111);
  assert.equal(getGoogleMapsUrl(g01), 'https://www.google.com/maps/search/?api=1&query=5.356954,100.303111');

  const g26 = campusLocations.find(p => p.code === 'G26');
  assert.ok(g26);
  assert.equal(g26.lat, 5.35752);
  assert.equal(g26.lng, 100.302533);
  assert.ok(g26.categories.includes('kafe'));

  const d12 = campusLocations.find(p => p.code === 'D12');
  assert.ok(d12);
  assert.equal(d12.lat, 5.357225);
  assert.equal(d12.lng, 100.305473);

  const d19 = campusLocations.find(p => p.code === 'D19');
  assert.ok(d19);
  assert.equal(d19.lat, 5.356868);
  assert.equal(d19.lng, 100.304535);

  const e42 = campusLocations.find(p => p.code === 'E42');
  assert.ok(e42);
  assert.equal(e42.lat, 5.356225);
  assert.equal(e42.lng, 100.303903);

  const e42a = campusLocations.find(p => p.code === 'E42A');
  assert.ok(e42a);
  assert.equal(e42a.lat, 5.356777);
  assert.equal(e42a.lng, 100.30422);
  assert.ok(e42a.categories.includes('kafe'));

  const l05 = campusLocations.find(p => p.code === 'L05');
  assert.ok(l05);
  assert.equal(l05.lat, 5.355787);
  assert.equal(l05.lng, 100.295504);

  const l10 = campusLocations.find(p => p.code === 'L10');
  assert.ok(l10);
  assert.equal(l10.lat, 5.356333);
  assert.equal(l10.lng, 100.294917);

  const l11 = campusLocations.find(p => p.code === 'L11');
  assert.ok(l11);
  assert.equal(l11.lat, 5.356729);
  assert.equal(l11.lng, 100.295195);

  const l12 = campusLocations.find(p => p.code === 'L12');
  assert.ok(l12);
  assert.equal(l12.lat, 5.357199);
  assert.equal(l12.lng, 100.29512);

  const m09 = campusLocations.find(p => p.code === 'M09');
  assert.ok(m09);
  assert.equal(m09.lat, 5.35623);
  assert.equal(m09.lng, 100.291294);
  assert.ok(m09.categories.includes('kafe'));

  assert.equal(getPlaceName(g01, 'en'), 'Tuanku Syed Putra Hall (Main Hall)');
  assert.equal(getPlaceName(g01, 'ms'), 'Dewan Tuanku Syed Putra (DTSP / Dewan Utama)');
  assert.equal(getPlaceName(g01), 'Dewan Tuanku Syed Putra (DTSP / Dewan Utama)');
  assert.equal(getZoneName('A', 'en'), 'Recreation');
  assert.equal(getZoneName('A', 'ms'), 'Rekreasi');
  assert.equal(getZoneName('A'), 'Rekreasi');
});

test('campus categories and facility classification work correctly', () => {
  assert.equal(campusCategories.length, 4);
  const catIds = campusCategories.map(c => c.id);
  assert.deepEqual(catIds, ['surau', 'kafe', 'desasiswa', 'pejabat']);

  assert.equal(getCategoryName('surau', 'ms'), 'Surau');
  assert.equal(getCategoryName('surau', 'en'), 'Surau');
  assert.equal(getCategoryName('kafe', 'ms'), 'Kafe');
  assert.equal(getCategoryName('kafe', 'en'), 'Cafe');
  assert.equal(getCategoryName('desasiswa', 'ms'), 'Desasiswa');
  assert.equal(getCategoryName('desasiswa', 'en'), 'Hostel');
  assert.equal(getCategoryName('pejabat', 'ms'), 'Pejabat');
  assert.equal(getCategoryName('pejabat', 'en'), 'Office');

  const f02 = campusLocations.find(p => p.code === 'F02');
  assert.ok(f02.categories.includes('surau'));

  const l05 = campusLocations.find(p => p.code === 'L05');
  assert.ok(l05.categories.includes('surau'));
  assert.ok(l05.categories.includes('kafe'));
  assert.ok(l05.categories.includes('desasiswa'));

  const l10 = campusLocations.find(p => p.code === 'L10');
  assert.ok(l10.categories.includes('kafe'));
  assert.ok(l10.categories.includes('desasiswa'));

  const a03 = campusLocations.find(p => p.code === 'A03');
  assert.ok(a03.categories.includes('kafe'));

  const desasiswaCodes = [
    'F25', 'F27', 'H10', 'H33', 'H38', 'H51', 'K10', 'K18/19',
    'L05', 'L06', 'L10', 'L11', 'L12', 'M01', 'M03', 'M05', 'M07', 'M08', 'M09', 'M10'
  ];
  for (const code of desasiswaCodes) {
    const loc = campusLocations.find(p => p.code === code);
    assert.ok(loc, `Location ${code} not found`);
    assert.ok(loc.categories.includes('desasiswa'), `Expected ${code} to be classified as desasiswa`);
  }

  const b02 = campusLocations.find(p => p.code === 'B02');
  assert.ok(!b02.categories.includes('desasiswa'), 'B02 should not be categorized as student desasiswa');

  const officeCodes = ['C03', 'C04', 'C22', 'D01', 'D05', 'L01', 'L21'];
  for (const code of officeCodes) {
    const loc = campusLocations.find(p => p.code === code);
    assert.ok(loc, `Location ${code} not found`);
    assert.ok(loc.categories.includes('pejabat'), `Expected ${code} to be classified as pejabat`);
  }
});
