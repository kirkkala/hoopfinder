export type Coordinates = {
  lat: number;
  lon: number;
};

/** Nationwide first camera — all courts should land in view; fitBounds refines this. */
export const DEFAULT_MAP_CENTER: Coordinates = {
  lat: 63.7,
  lon: 25.4,
};

export const DEFAULT_MAP_ZOOM = 5;

/** Nearby starting view after the user shares their location. */
export const NEAR_ME_ZOOM = 13;

const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  from: Coordinates,
  to: Coordinates,
): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLon = toRadians(to.lon - from.lon);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function formatDistanceParts(km: number): { value: string; unit: "m" | "km" } {
  if (km < 1) {
    return { value: String(Math.round(km * 1000)), unit: "m" };
  }
  if (km < 10) {
    return { value: km.toFixed(1), unit: "km" };
  }
  return { value: String(Math.round(km)), unit: "km" };
}

export type MapBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export function isInBounds(
  point: Coordinates,
  bounds: MapBounds,
): boolean {
  if (point.lat < bounds.south || point.lat > bounds.north) {
    return false;
  }
  if (bounds.west <= bounds.east) {
    return point.lon >= bounds.west && point.lon <= bounds.east;
  }
  return point.lon >= bounds.west || point.lon <= bounds.east;
}

export function boundsFromCoordinates(
  points: Coordinates[],
): MapBounds | null {
  if (points.length === 0) return null;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const point of points) {
    west = Math.min(west, point.lon);
    east = Math.max(east, point.lon);
    south = Math.min(south, point.lat);
    north = Math.max(north, point.lat);
  }
  return { west, south, east, north };
}

/** Keep a neighborhood-sized view when Nominatim returns a point. */
export function expandTinyBounds(bounds: MapBounds): MapBounds {
  const minSpan = 0.015;
  const latSpan = bounds.north - bounds.south;
  const lonSpan = bounds.east - bounds.west;
  if (latSpan >= minSpan && lonSpan >= minSpan) return bounds;
  const latMid = (bounds.north + bounds.south) / 2;
  const lonMid = (bounds.east + bounds.west) / 2;
  const dLat = Math.max(latSpan, minSpan) / 2;
  const dLon = Math.max(lonSpan, minSpan) / 2;
  return {
    south: latMid - dLat,
    north: latMid + dLat,
    west: lonMid - dLon,
    east: lonMid + dLon,
  };
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
