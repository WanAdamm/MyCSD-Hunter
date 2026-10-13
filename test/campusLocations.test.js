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
  assert.equal(campusLocations.length, 97);
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
  assert.equal(g01.lat, 5.3569);
  assert.equal(g01.lng, 100.3031);
  assert.equal(getGoogleMapsUrl(g01), 'https://www.google.com/maps/search/?api=1&query=5.3569,100.3031');

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

  const l10 = campusLocations.find(p => p.code === 'L10');
  assert.ok(l10.categories.includes('kafe'));

  const a03 = campusLocations.find(p => p.code === 'A03');
  assert.ok(a03.categories.includes('kafe'));

  const residenceCodes = ['F27', 'H10', 'H33', 'H38', 'H51', 'K10', 'K18/19', 'L06', 'L11', 'L12', 'M01', 'M03', 'M05', 'M08', 'M10'];
  for (const code of residenceCodes) {
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
