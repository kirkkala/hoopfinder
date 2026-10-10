import { expect, test } from "vitest";
import {
  boundsAround,
  cameraBoundsForPlace,
  expandTinyBounds,
  formatDistanceParts,
  haversineKm,
  isInBounds,
} from "./geo";

test("measures about 111 km per degree of latitude", () => {
  expect(haversineKm({ lat: 60, lon: 25 }, { lat: 61, lon: 25 })).toBeCloseTo(111.2, 0);
});

test("formats metres, one decimal, and whole kilometres", () => {
  expect(formatDistanceParts(0.42)).toEqual({ value: "420", unit: "m" });
  expect(formatDistanceParts(1)).toEqual({ value: "1.0", unit: "km" });
  expect(formatDistanceParts(9.96)).toEqual({ value: "10.0", unit: "km" });
  expect(formatDistanceParts(10)).toEqual({ value: "10", unit: "km" });
});

test("treats a bounds box that crosses the date line as one region", () => {
  const bounds = { west: 170, south: -10, east: -170, north: 10 };
  expect(isInBounds({ lat: 0, lon: 175 }, bounds)).toBe(true);
  expect(isInBounds({ lat: 0, lon: 0 }, bounds)).toBe(false);
  expect(isInBounds({ lat: 11, lon: 175 }, bounds)).toBe(false);
});

test("gives a point-sized place a neighborhood-sized box", () => {
  const point = { west: 24.94, south: 60.17, east: 24.94, north: 60.17 };
  const expanded = expandTinyBounds(point);
  expect(expanded.north - expanded.south).toBeCloseTo(0.015);
  expect(expanded.east - expanded.west).toBeCloseTo(0.015);

  const alreadyWide = { west: 24.9, south: 60.15, east: 24.95, north: 60.2 };
  expect(expandTinyBounds(alreadyWide)).toEqual(alreadyWide);
});

test("keeps a neighborhood view and caps a large city around its center", () => {
  const center = { lat: 60.17, lon: 24.94 };
  const neighborhood = boundsAround(center, 2);
  expect(cameraBoundsForPlace(center, neighborhood)).toEqual(neighborhood);

  const city = boundsAround(center, 30);
  const camera = cameraBoundsForPlace(center, city);
  expect(camera).not.toEqual(city);
  const spanKm = (camera.north - camera.south) * 111;
  expect(spanKm).toBeCloseTo(10, 0);
});
