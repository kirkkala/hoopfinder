import { getCopy, type Copy } from "@/lib/copy";
import type { Coordinates } from "@/lib/geo";
import { haversineKm } from "@/lib/geo";
import { parseOsmCourtId, type CourtSourceId } from "@/lib/sources";

export type Court = {
  id: string;
  source: CourtSourceId | "submitted";
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
  /** Visitor submission whose email link has been opened. */
  emailConfirmed?: boolean;
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

export type ExplorerCourt = {
  id: string;
  name: string;
  nameFi: string;
  status: string;
  address: string | null;
  city: string | null;
  neighborhood: string | null;
  lat: number;
  lon: number;
  amenities: Pick<Court["amenities"], "lighting" | "freeUse">;
} & (
  | { source: CourtSourceId | "submitted" }
  | { source: "pending"; createdAt: string; emailConfirmed: boolean }
);

export type CourtWithDistance = ExplorerCourt & {
  distanceKm: number | null;
};

export function toExplorerCourt(court: Court): ExplorerCourt {
  return {
    id: court.id,
    source: court.source,
    name: court.name,
    nameFi: court.nameFi,
    status: court.status,
    address: court.address,
    city: court.city,
    neighborhood: court.neighborhood,
    lat: court.lat,
    lon: court.lon,
    amenities: {
      lighting: court.amenities.lighting,
      freeUse: court.amenities.freeUse,
    },
  };
}

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

/** Same pad as LIPAS/OSM merge — pending pins drop off once a source court lands here. */
export const COURT_MATCH_KM = 0.08;

/** Unconfirmed pins may sit nearby, but not on top of each other. */
export const SAME_SPOT_KM = 0.015;

export function isTooCloseToCourt(
  point: Coordinates,
  courts: Coordinates[],
): boolean {
  return courts.some(
    (court) => haversineKm(point, { lat: court.lat, lon: court.lon }) < COURT_MATCH_KM,
  );
}

/** Catalog and email-confirmed courts block 80 m. Unconfirmed courts block the same spot only. */
export function courtPlacementBlocked(
  point: Coordinates,
  courts: Array<
    Coordinates & {
      source?: ExplorerCourt["source"];
      emailConfirmed?: boolean;
      status?: string;
    }
  >,
): boolean {
  return courts.some((court) => {
    const unconfirmed =
      court.status === "unconfirmed" ||
      (court.source === "pending" && court.emailConfirmed === false);
    const km = unconfirmed ? SAME_SPOT_KM : COURT_MATCH_KM;
    return haversineKm(point, court) < km;
  });
}

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
    ) < COURT_MATCH_KM
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
  courts: ExplorerCourt[],
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
  if (status === "pending") return copy.statusPending;
  if (status === "out-of-service-temporarily") return copy.statusTemporarilyClosed;
  if (status === "out-of-service-permanently") return copy.statusPermanentlyClosed;
  return copy.statusUnknown;
}

/** Set before leaving the email link, so the court page can say thanks without a query param. */
export const COURT_THANKS_KEY = "hf-court-thanks";

export function isAwaitingEmail(court: ExplorerCourt | Court): boolean {
  return "emailConfirmed" in court && court.emailConfirmed === false;
}

export function isPendingCourt(
  court: Pick<ExplorerCourt, "source">,
): court is Extract<ExplorerCourt, { source: "pending" }> {
  return court.source === "pending";
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

function isOsmType(segment: string): boolean {
  return segment === "node" || segment === "way" || segment === "relation";
}

function courtSegments(court: Pick<ExplorerCourt, "id" | "source">): string[] {
  switch (court.source) {
    case "osm": {
      const osm = parseOsmCourtId(court.id);
      return osm ? ["osm", osm.type, osm.osmId] : [court.id];
    }
    case "lipas":
      return ["lipas", court.id];
    case "pending":
    case "submitted":
      return ["submitted", submittedCourtKey(court.id)];
  }
}

/** Numeric id in `submitted_courts`; `submitted-` is only for the merged map list. */
export function submittedCourtKey(id: string): string {
  return id.startsWith("submitted-") ? id.slice("submitted-".length) : id;
}

/** `lipas/82547` or `osm/way/1095396325` — court page path after `/courts/`. */
export function courtPath(court: Pick<ExplorerCourt, "id" | "source">): string {
  return courtSegments(court).join("/");
}

/** `lipas-82547` or `osm-way-1095396325` — hyphen form for `?court=` (no `%2F`). */
export function courtParam(court: Pick<ExplorerCourt, "id" | "source">): string {
  return courtSegments(court).join("-");
}

export function courtHref(court: Pick<ExplorerCourt, "id" | "source">): string {
  return `/courts/${courtPath(court)}`;
}

/** Home map with that court’s popup open. Works for published and pending pins. */
export function homeCourtHref(
  court: Pick<ExplorerCourt, "id" | "source">,
  options?: { thanks?: boolean },
): string {
  const href = `/?court=${encodeURIComponent(courtParam(court))}`;
  return options?.thanks ? `${href}&thanks=1` : href;
}

export function courtOgHref(
  court: Pick<ExplorerCourt, "id" | "source">,
  fetchedAt?: string | null,
): string {
  const path = `/images/og/${courtParam(court)}`;
  if (!fetchedAt) return path;
  const version = Date.parse(fetchedAt);
  return Number.isFinite(version) ? `${path}?v=${version}` : path;
}

export function courtIdFromParam(value: string): string | null {
  const parsed = parseCourtPath(value.split("-"));
  return parsed && parsed !== "index" ? parsed.id : null;
}

/** `"index"` → home; `{ id }` → court; `null` → 404. */
export function parseCourtPath(
  segments: string[],
): "index" | { id: string } | null {
  if (segments.length === 0) return "index";
  if (segments[0] === "submitted") {
    if (segments.length === 1) return "index";
    return segments.length === 2 && /^\d+$/.test(segments[1])
      ? { id: `submitted-${segments[1]}` }
      : null;
  }
  if (segments.length === 1) {
    return segments[0] === "lipas" ||
      segments[0] === "osm" ||
      isOsmType(segments[0])
      ? "index"
      : null;
  }
  if (segments[0] === "lipas") {
    return segments.length === 2 && /^\d+$/.test(segments[1])
      ? { id: segments[1] }
      : null;
  }
  if (segments[0] === "osm") {
    if (segments.length === 2 && isOsmType(segments[1])) return "index";
    if (segments.length === 3) {
      const id = `${segments[1]}-${segments[2]}`;
      return parseOsmCourtId(id) ? { id } : null;
    }
  }
  return null;
}
