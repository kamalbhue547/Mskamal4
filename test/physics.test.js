import test from 'node:test';
import assert from 'node:assert/strict';
import {
  apparentEinsteinRadiusUv,
  projectedRadiusUv,
  schwarzschildRadiusKm,
} from '../src/physics.js';

test('Schwarzschild radius uses about 2.95 km per solar mass', () => {
  assert.equal(schwarzschildRadiusKm(0), 0);
  assert.equal(schwarzschildRadiusKm(1), 2.95);
  assert.ok(Math.abs(schwarzschildRadiusKm(4.3) - 12.685) < 1e-12);
});

test('Schwarzschild radius rejects invalid mass values', () => {
  assert.throws(() => schwarzschildRadiusKm(-1), RangeError);
  assert.throws(() => schwarzschildRadiusKm(Number.NaN), RangeError);
});

test('projected radius matches the perspective camera scale', () => {
  const fov = 43 * Math.PI / 180;
  const expected = 1 / (2 * 12 * Math.tan(fov / 2));
  assert.ok(Math.abs(projectedRadiusUv(1, 12, fov) - expected) < 1e-12);
  assert.ok(projectedRadiusUv(1, 24, fov) < projectedRadiusUv(1, 12, fov));
});

test('apparent Einstein radius scales with the projected horizon', () => {
  assert.ok(Math.abs(apparentEinsteinRadiusUv(0.1) - 0.155) < 1e-12);
  assert.equal(apparentEinsteinRadiusUv(0.1, 2), 0.2);
});
