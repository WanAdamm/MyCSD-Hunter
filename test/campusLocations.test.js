import assert from 'node:assert/strict';
import test from 'node:test';
import { campusLocations, campusZones, getGoogleMapsUrl } from '../src/lib/campusLocations.js';

test('campus directory contains valid, uniquely coded map locations with GPS coordinates', () => {
  assert.equal(campusLocations.length, 93);
  assert.equal(new Set(campusLocations.map(({ code }) => code)).size, campusLocations.length);

  for (const place of campusLocations) {
    assert.ok(place.code && place.name);
    assert.ok(campusZones[place.zone], `Unknown zone for ${place.code}`);
    assert.ok(place.x >= 0 && place.x <= 100, `Invalid x coordinate for ${place.code}`);
    assert.ok(place.y >= 0 && place.y <= 100, `Invalid y coordinate for ${place.code}`);
    assert.ok(typeof place.lat === 'number' && place.lat >= 5.35 && place.lat <= 5.37, `Invalid lat for ${place.code}`);
    assert.ok(typeof place.lng === 'number' && place.lng >= 100.28 && place.lng <= 100.32, `Invalid lng for ${place.code}`);
  }

  const g01 = campusLocations.find(p => p.code === 'G01');
  assert.ok(g01);
  assert.equal(g01.lat, 5.3569);
  assert.equal(g01.lng, 100.3031);
  assert.equal(getGoogleMapsUrl(g01), 'https://www.google.com/maps/search/?api=1&query=5.3569,100.3031');
});
