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
  // Distinct IDs from the same registry are separate courts, even when they
  // sit on adjacent pads at one venue (often well under 80 m apart).
  if (existing.source === candidate.source) return false;
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

/** Generic OSM names get a place suffix so list/SEO titles are not identical. */
export function courtTitle(
  court: Pick<Court, "name" | "nameFi" | "neighborhood" | "city">,
  copy: Copy = getCopy(),
): string {
  const name = courtName(court, copy);
  if (!isGenericCourtName(name)) return name;
  const place = court.neighborhood || court.city;
  return place ? `${name}, ${place}` : name;
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

export function withDistance(
  courts: Court[],
  origin: Coordinates | null,
): CourtWithDistance[] {
  return courts
    .map((court) => ({
      ...court,
      distanceKm: origin
        ? haversineKm(origin, { lat: court.lat, lon: court.lon })
        : null,
    }))
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
  return formatCodedLabel(code, copy.surfaces as Record<string, string>);
}

export function formatOwner(value: string, copy: Copy = getCopy()): string {
  return formatCodedLabel(value, copy.owners as Record<string, string>);
}

export function formatAdmin(value: string, copy: Copy = getCopy()): string {
  return formatCodedLabel(value, copy.admins as Record<string, string>);
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

function compareText(a: string, b: string) {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function formatCodedLabel(code: string, labels: Record<string, string>): string {
  if (labels[code]) return labels[code];
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(code)) {
    return titleCase(code.replaceAll("-", " "));
  }
  return code;
}

function titleCase(value: string): string {
  return value.replaceAll(/\b\w/g, (letter) => letter.toUpperCase());
}
