export type Coordinates = {
  lat: number;
  lon: number;
};

/** Helsinki metro — first map camera, with Espoo and Vantaa in view. */
export const DEFAULT_MAP_CENTER: Coordinates = {
  lat: 60.21,
  lon: 24.89,
};

export const DEFAULT_MAP_ZOOM = 10.5;

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

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

export function formatCoordinates(lat: number, lon: number): string {
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
