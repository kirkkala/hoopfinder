import { getCopy, type Copy } from "@/lib/copy";
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

export function courtName(
  court: Pick<Court, "name" | "nameFi">,
  copy: Copy = getCopy(),
): string {
  const title =
    copy.locale === "en"
      ? court.name || court.nameFi
      : court.nameFi || court.name;
  if (isGenericCourtName(title)) return copy.unnamedCourt;
  return title;
}

export function isGenericCourtName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return (
    normalized === "basketball court" ||
    normalized === "basketball" ||
    normalized === "basketball pitch" ||
    normalized === "koripallokenttä"
  );
}

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
      const name = compareText(a.nameFi || a.name, b.nameFi || b.name);
      if (name !== 0) return name;
      return a.id.localeCompare(b.id);
    });
}

export function formatSurface(code: string, copy: Copy = getCopy()): string {
  const labels = copy.surfaces as Record<string, string>;
  return labels[code] ?? titleCase(code.replaceAll("-", " "));
}

export function formatReportedBoolean(
  value: boolean | null,
  copy: Copy = getCopy(),
): string {
  if (value === true) return copy.yes;
  if (value === false) return copy.no;
  return copy.notReported;
}

export function formatStatus(status: string, copy: Copy = getCopy()): string {
  if (status === "active") return copy.statusOpen;
  if (status === "out-of-service-temporarily") return copy.statusTemporarilyClosed;
  if (status === "out-of-service-permanently") return copy.statusPermanentlyClosed;
  return copy.statusUnknown;
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
