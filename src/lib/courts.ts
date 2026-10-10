import { type Copy, getCopy } from "@/lib/copy";
import type { Coordinates } from "@/lib/geo";
import { haversineKm } from "@/lib/geo";
import { type CourtSourceId, parseOsmCourtId } from "@/lib/sources";

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
  /** Open or closed status stored on a submission, including before it is published. */
  reportedStatus?: string | null;
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
    /** Visitor-reported rim height. Catalog sources do not have this. */
    hoopHeight: "official" | "lower" | null;
    waterPoint: string | null;
    matchClock: boolean | null;
    scoreboard: boolean | null;
  };
  /** Other pads on this place page. Set only when a place has two or more. */
  members?: Court[];
  /** Source courts folded into this one. They are not their own pins. */
  hidden?: Court[];
  /** Other ids that open this same place, so an old link still lands here. */
  aliases?: string[];
  /** Other pad coordinates. Placement checks use these as well as lat/lon. */
  nearby?: Coordinates[];
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
  padCount?: number;
  aliases?: string[];
  nearby?: Coordinates[];
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
    ...(court.members && court.members.length > 1 ? { padCount: court.members.length } : {}),
    ...(court.aliases?.length ? { aliases: court.aliases } : {}),
    ...(court.nearby?.length ? { nearby: court.nearby } : {}),
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
    hoopHeight: null,
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
  courts: Array<Coordinates & { nearby?: Coordinates[] }>,
): boolean {
  return courts.some((court) =>
    spotsOf(court).some((spot) => haversineKm(point, spot) < COURT_MATCH_KM),
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
      nearby?: Coordinates[];
    }
  >,
): boolean {
  return courts.some((court) => {
    const unconfirmed =
      court.status === "unconfirmed" ||
      (court.source === "pending" && court.emailConfirmed === false);
    const km = unconfirmed ? SAME_SPOT_KM : COURT_MATCH_KM;
    return spotsOf(court).some((spot) => haversineKm(point, spot) < km);
  });
}

function spotsOf(court: Coordinates & { nearby?: Coordinates[] }): Coordinates[] {
  return [court, ...(court.nearby ?? [])];
}

/**
 * One pin when two sources describe the same pad.
 * Visitor data wins over LIPAS, and LIPAS wins over OSM, whatever order the batches are in.
 * Same-registry ids stay separate: adjacent pads are grouped later, not deleted here.
 * An OSM node and a way on the same spot are one court.
 */
export function mergeCourts(batches: Court[][]): Court[] {
  const merged: Court[] = [];
  for (const batch of batches) {
    for (const candidate of batch) {
      const index = merged.findIndex((existing) => sameMappedCourt(existing, candidate));
      if (index === -1) {
        merged.push(candidate);
        continue;
      }
      merged[index] = combineCourts(merged[index], candidate);
    }
  }
  return merged;
}

function sameMappedCourt(existing: Court, candidate: Court): boolean {
  const km = haversineKm(existing, candidate);
  if (existing.source !== candidate.source) return km < COURT_MATCH_KM;
  if (existing.source !== "osm") return false;
  const left = parseOsmCourtId(existing.id)?.type;
  const right = parseOsmCourtId(candidate.id)?.type;
  if (!left || !right || left === right) return false;
  return km < SAME_SPOT_KM;
}

function combineCourts(existing: Court, candidate: Court): Court {
  const winner = preferCourt(existing, candidate);
  const loser = winner === existing ? candidate : existing;
  return fillEmptyCourt(winner, loser);
}

function preferCourt(a: Court, b: Court): Court {
  const bySource = sourceRank(a) - sourceRank(b);
  if (bySource !== 0) return bySource > 0 ? a : b;
  return geometryRank(a) >= geometryRank(b) ? a : b;
}

function sourceRank(court: Court): number {
  if (court.source === "submitted") return 2;
  if (court.source === "lipas") return 1;
  return 0;
}

function geometryRank(court: Court): number {
  const type = parseOsmCourtId(court.id)?.type;
  if (type === "way") return 2;
  if (type === "relation") return 1;
  return 0;
}

/** A published submission overwrites the facts it actually set. Name and coordinates stay. */
export function applyVisitorCourt(court: Court, visitor: Court): Court {
  return {
    ...court,
    comment: visitor.comment ?? court.comment,
    website: visitor.website ?? court.website,
    constructionYear: visitor.constructionYear ?? court.constructionYear,
    owner: visitor.owner ?? court.owner,
    admin: visitor.admin ?? court.admin,
    status: visitor.reportedStatus ?? court.status,
    amenities: overlayAmenities(court.amenities, visitor.amenities),
    hidden: [...(court.hidden ?? []), visitor],
  };
}

function fillEmptyCourt(winner: Court, loser: Court): Court {
  const stored = { ...loser, hidden: undefined };
  return {
    ...winner,
    name: preferName(winner.name, loser.name),
    nameFi: preferName(winner.nameFi, loser.nameFi),
    address: winner.address ?? loser.address,
    postalCode: winner.postalCode ?? loser.postalCode,
    city: winner.city ?? loser.city,
    neighborhood: winner.neighborhood ?? loser.neighborhood,
    comment: winner.comment ?? loser.comment,
    website: winner.website ?? loser.website,
    constructionYear: winner.constructionYear ?? loser.constructionYear,
    owner: winner.owner ?? loser.owner,
    admin: winner.admin ?? loser.admin,
    amenities: fillEmptyAmenities(winner.amenities, loser.amenities),
    hidden: [...(winner.hidden ?? []), stored, ...(loser.hidden ?? [])],
  };
}

function preferName(current: string, fallback: string): string {
  if (current.trim() && !isGenericCourtName(current)) return current;
  if (fallback.trim() && !isGenericCourtName(fallback)) return fallback;
  return current || fallback;
}

function fillEmptyAmenities(
  winner: Court["amenities"],
  loser: Court["amenities"],
): Court["amenities"] {
  return {
    lighting: winner.lighting ?? loser.lighting,
    lightingInfo: winner.lightingInfo ?? loser.lightingInfo,
    freeUse: winner.freeUse ?? loser.freeUse,
    schoolUse: winner.schoolUse ?? loser.schoolUse,
    fieldType: winner.fieldType ?? loser.fieldType,
    surfaceMaterial: winner.surfaceMaterial.length
      ? winner.surfaceMaterial
      : [...loser.surfaceMaterial],
    surfaceMaterialInfo: winner.surfaceMaterialInfo ?? loser.surfaceMaterialInfo,
    lengthM: winner.lengthM ?? loser.lengthM,
    widthM: winner.widthM ?? loser.widthM,
    areaM2: winner.areaM2 ?? loser.areaM2,
    toilet: winner.toilet ?? loser.toilet,
    heightAdjustable: winner.heightAdjustable ?? loser.heightAdjustable,
    hoopHeight: winner.hoopHeight ?? loser.hoopHeight,
    waterPoint: winner.waterPoint ?? loser.waterPoint,
    matchClock: winner.matchClock ?? loser.matchClock,
    scoreboard: winner.scoreboard ?? loser.scoreboard,
  };
}

function overlayAmenities(
  winner: Court["amenities"],
  visitor: Court["amenities"],
): Court["amenities"] {
  return {
    lighting: visitor.lighting ?? winner.lighting,
    lightingInfo: visitor.lightingInfo ?? winner.lightingInfo,
    freeUse: visitor.freeUse ?? winner.freeUse,
    schoolUse: visitor.schoolUse ?? winner.schoolUse,
    fieldType: visitor.fieldType ?? winner.fieldType,
    surfaceMaterial: visitor.surfaceMaterial.length
      ? [...visitor.surfaceMaterial]
      : winner.surfaceMaterial,
    surfaceMaterialInfo: visitor.surfaceMaterialInfo ?? winner.surfaceMaterialInfo,
    lengthM: visitor.lengthM ?? winner.lengthM,
    widthM: visitor.widthM ?? winner.widthM,
    areaM2: visitor.areaM2 ?? winner.areaM2,
    toilet: visitor.toilet ?? winner.toilet,
    heightAdjustable: visitor.heightAdjustable ?? winner.heightAdjustable,
    hoopHeight: visitor.hoopHeight ?? winner.hoopHeight,
    waterPoint: visitor.waterPoint ?? winner.waterPoint,
    matchClock: visitor.matchClock ?? winner.matchClock,
    scoreboard: visitor.scoreboard ?? winner.scoreboard,
  };
}

export function courtName(court: Pick<Court, "name" | "nameFi">, copy: Copy = getCopy()): string {
  const title = copy.locale === "en" ? court.name || court.nameFi : court.nameFi || court.name;
  if (isGenericCourtName(title)) return copy.unnamedCourt;
  return title;
}

/** Generic OSM names get a place suffix so list/SEO titles are not identical. */
/** Label of one pad on a place page: the part after " / ", or the full name. */
export function courtPadLabel(
  court: Pick<Court, "name" | "nameFi">,
  copy: Copy = getCopy(),
): string {
  const name = copy.locale === "en" ? court.name || court.nameFi : court.nameFi || court.name;
  const slash = name.split(" / ");
  if (slash.length > 1) return slash.slice(1).join(" / ").trim() || name;
  return name;
}

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
      distanceKm: origin ? haversineKm(origin, { lat: court.lat, lon: court.lon }) : null,
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

export const COURT_STATUS_CODES = [
  "active",
  "out-of-service-temporarily",
  "out-of-service-permanently",
] as const;

export const FIELD_TYPE_CODES = ["full", "one-hoop", "mini", "street", "hoop-only"] as const;

/** Official rim is 305 cm. Visitors only say whether it is that or lower. */
export const HOOP_HEIGHT_CODES = ["official", "lower"] as const;

export const WATER_POINT_CODES = ["yes", "no", "seasonal"] as const;

export const SURFACE_CODES = [
  "asphalt",
  "concrete",
  "synthetic",
  "artificial-turf",
  "sand-infilled-artificial-turf",
  "sand",
  "stone",
  "rock-dust",
  "gravel",
  "fine_gravel",
  "other",
] as const;

export const COMMON_SURFACE_CODES = [
  "asphalt",
  "artificial-turf",
  "synthetic",
  "fine_gravel",
  "other",
] as const satisfies readonly (typeof SURFACE_CODES)[number][];

export const OWNER_CODES = [
  "city",
  "city-main-owner",
  "company-ltd",
  "foundation",
  "municipal-consortium",
  "other",
  "registered-association",
  "state",
  "unknown",
] as const;

export const ADMIN_CODES = [
  "city-education",
  "city-other",
  "city-sports",
  "city-technical-services",
  "municipal-consortium",
  "other",
  "private-association",
  "private-company",
  "private-foundation",
  "state",
  "unknown",
] as const;

export function formatSurface(code: string, copy: Copy = getCopy()): string {
  return formatCodedLabel(code, copy.surfaces as Record<string, string>);
}

export function formatFieldType(code: string, copy: Copy = getCopy()): string {
  return formatCodedLabel(code, copy.fieldTypes as Record<string, string>);
}

export function formatWaterPoint(code: string, copy: Copy = getCopy()): string {
  return formatCodedLabel(code, copy.waterPoints as Record<string, string>);
}

export function formatOwner(value: string, copy: Copy = getCopy()): string {
  return formatCodedLabel(value, copy.owners as Record<string, string>);
}

export function formatAdmin(value: string, copy: Copy = getCopy()): string {
  return formatCodedLabel(value, copy.admins as Record<string, string>);
}

export function formatReportedBoolean(value: boolean | null, copy: Copy = getCopy()): string {
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

export function formatAddress(parts: Array<string | null | undefined>): string {
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

/** Court page opened from a map popup. An alias keeps the pad the visitor asked for. */
export function focusedCourtHref(
  court: Pick<ExplorerCourt, "id" | "source" | "aliases">,
  focusId: string | null,
): string {
  const id =
    focusId && (focusId === court.id || court.aliases?.includes(focusId)) ? focusId : court.id;
  return courtHref({ id, source: court.source });
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
export function parseCourtPath(segments: string[]): "index" | { id: string } | null {
  if (segments.length === 0) return "index";
  if (segments[0] === "submitted") {
    if (segments.length === 1) return "index";
    return segments.length === 2 && /^\d+$/.test(segments[1])
      ? { id: `submitted-${segments[1]}` }
      : null;
  }
  if (segments.length === 1) {
    return segments[0] === "lipas" || segments[0] === "osm" || isOsmType(segments[0])
      ? "index"
      : null;
  }
  if (segments[0] === "lipas") {
    return segments.length === 2 && /^\d+$/.test(segments[1]) ? { id: segments[1] } : null;
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
