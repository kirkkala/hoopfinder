import type { Coordinates } from "@/lib/geo";
import { haversineKm } from "@/lib/geo";
import type { CourtSourceId } from "@/lib/sources";

export type Court = {
  id: string;
  source: CourtSourceId;
  name: string;
  nameFi: string;
  status: string;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  neighborhood: string | null;
  lat: number;
  lon: number;
  comment: string | null;
  website: string | null;
  phone: string | null;
  constructionYear: number | null;
  owner: string | null;
  admin: string | null;
  amenities: {
    lighting: boolean | null;
    lightingInfo: string | null;
    freeUse: boolean | null;
    schoolUse: boolean | null;
    fieldType: string | null;
    surfaceMaterial: string[];
    surfaceMaterialInfo: string | null;
    lengthM: number | null;
    widthM: number | null;
    areaM2: number | null;
    toilet: boolean | null;
    heightAdjustable: boolean | null;
    waterPoint: string | null;
    matchClock: boolean | null;
    scoreboard: boolean | null;
  };
};

export const DISTANCE_OPTIONS = [1, 2, 5, 10, 25, 50] as const;
export type DistanceFilter = (typeof DISTANCE_OPTIONS)[number] | "any";

export type CourtWithDistance = Court & {
  distanceKm: number | null;
};

export function emptyAmenities(): Court["amenities"] {
  return {
    lighting: null,
    lightingInfo: null,
    freeUse: null,
    schoolUse: null,
    fieldType: null,
    surfaceMaterial: [],
    surfaceMaterialInfo: null,
    lengthM: null,
    widthM: null,
    areaM2: null,
    toilet: null,
    heightAdjustable: null,
    waterPoint: null,
    matchClock: null,
    scoreboard: null,
  };
}

const DUPLICATE_KM = 0.08;

export function mergeCourts(batches: Court[][]): Court[] {
  const merged: Court[] = [];
  for (const batch of batches) {
    for (const candidate of batch) {
      if (!merged.some((existing) => isNearDuplicate(existing, candidate))) {
        merged.push(candidate);
      }
    }
  }
  return merged;
}

function isNearDuplicate(existing: Court, candidate: Court): boolean {
  return (
    haversineKm(
      { lat: existing.lat, lon: existing.lon },
      { lat: candidate.lat, lon: candidate.lon },
    ) < DUPLICATE_KM
  );
}

const SURFACE_LABELS: Record<string, string> = {
  asphalt: "Asphalt",
  concrete: "Concrete",
  synthetic: "Synthetic",
  "artificial-turf": "Artificial turf",
  "sand-infilled-artificial-turf": "Sand-infilled turf",
  sand: "Sand",
  stone: "Stone",
  "rock-dust": "Rock dust",
  gravel: "Gravel",
};

export function filterCourts(
  courts: Court[],
  query: string,
  distanceKm: DistanceFilter,
  origin: Coordinates | null,
): CourtWithDistance[] {
  const needle = query.trim().toLowerCase();

  return courts
    .map((court) => ({
      ...court,
      distanceKm: origin
        ? haversineKm(origin, { lat: court.lat, lon: court.lon })
        : null,
    }))
    .filter((court) => {
      if (
        origin &&
        distanceKm !== "any" &&
        court.distanceKm !== null &&
        court.distanceKm > distanceKm
      ) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return courtHaystack(court).includes(needle);
    })
    .sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm || a.id.localeCompare(b.id);
      }
      const city = compareText(a.city ?? "", b.city ?? "");
      if (city !== 0) return city;
      const name = compareText(a.name, b.name);
      if (name !== 0) return name;
      return a.id.localeCompare(b.id);
    });
}

export function formatSurface(code: string): string {
  return SURFACE_LABELS[code] ?? titleCase(code.replaceAll("-", " "));
}

export function formatReportedBoolean(value: boolean | null): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Not reported";
}

export function formatStatus(status: string): string {
  if (status === "active") return "Open";
  if (status === "out-of-service-temporarily") return "Temporarily closed";
  if (status === "out-of-service-permanently") return "Permanently closed";
  return "Unknown";
}

export function formatAddress(
  parts: Array<string | null | undefined>,
): string {
  return parts.filter((part): part is string => Boolean(part)).join(", ");
}

function courtHaystack(court: Court): string {
  return [
    court.name,
    court.nameFi,
    court.address,
    court.city,
    court.neighborhood,
    court.postalCode,
    court.amenities.fieldType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function compareText(a: string, b: string) {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function titleCase(value: string): string {
  return value.replaceAll(/\b\w/g, (letter) => letter.toUpperCase());
}
