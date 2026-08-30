import assert from 'node:assert/strict';
import test from 'node:test';
import { campusLocations, campusZones } from '../src/lib/campusLocations.js';

test('campus directory contains valid, uniquely coded map locations', () => {
  assert.equal(campusLocations.length, 93);
  assert.equal(new Set(campusLocations.map(({ code }) => code)).size, campusLocations.length);

  for (const place of campusLocations) {
    assert.ok(place.code && place.name);
    assert.ok(campusZones[place.zone], `Unknown zone for ${place.code}`);
    assert.ok(place.x >= 0 && place.x <= 100, `Invalid x coordinate for ${place.code}`);
    assert.ok(place.y >= 0 && place.y <= 100, `Invalid y coordinate for ${place.code}`);
  }
});
