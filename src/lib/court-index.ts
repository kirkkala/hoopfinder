import { COURT_INDEX_PATH } from "@/lib/constants";
import { getCopy } from "@/lib/copy";
import {
  type Court,
  cityFromAddress,
  citySlug,
  courtHref,
  courtTitle,
  type ExplorerCourt,
  listingCity,
  publicCourtId,
} from "@/lib/courts";

export type CourtIndexEntry = {
  href: string;
  name: string;
  nameFi: string;
  status: string;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  source?: ExplorerCourt["source"];
  emailConfirmed?: boolean;
  amenities: Pick<Court["amenities"], "lighting" | "freeUse">;
};

/** A city page needs two public courts. One court redirects to that court. */
export const CITY_PAGE_MIN_COURTS = 2;

/** Address for a city. One public court redirects to that court. */
export function cityIndexHref(anchor: string): string {
  return `${COURT_INDEX_PATH}/${anchor}`;
}

export type CourtIndexGroup = {
  /** Null when the court has no city. */
  city: string | null;
  anchor: string;
  /** Set when the city has its own page. */
  pageHref: string | null;
  courts: CourtIndexEntry[];
};

type IndexCourt = Pick<
  ExplorerCourt,
  "id" | "source" | "name" | "nameFi" | "status" | "address" | "neighborhood" | "city" | "amenities"
> & { emailConfirmed?: boolean };

/**
 * Public court pages grouped by city, in Finnish alphabetical order.
 * Each pad keeps the same URL and title as its court page.
 * `submitted` is the same set the map adds from the database.
 */
export function courtIndex(courts: Court[], submitted: ExplorerCourt[] = []): CourtIndexGroup[] {
  const finnish = getCopy("fi");
  const byCity = new Map<string | null, CityBucket>();

  for (const court of courts) {
    for (const page of court.members ?? [court]) addCourt(byCity, page, false);
  }
  for (const court of submitted) addCourt(byCity, court, true);

  const usedAnchors = new Set<string>();
  return [...byCity.values()]
    .map((bucket) => {
      const city = readableCity(mostCommonLabel(bucket.labels));
      const anchor = cityAnchor(city, usedAnchors);
      const courts = bucket.courts
        .map((court) => ({
          href: courtHref(court, anchor),
          name: court.name,
          nameFi: court.nameFi,
          status: court.status,
          address: court.address,
          neighborhood: court.neighborhood,
          city: court.city,
          source: court.source,
          ...(court.emailConfirmed === undefined ? {} : { emailConfirmed: court.emailConfirmed }),
          amenities: court.amenities,
        }))
        .sort((a, b) => compareFi(courtTitle(a, finnish), courtTitle(b, finnish)));
      const listed = publicCityCourts(courts);
      return {
        city,
        anchor,
        pageHref: listed.length >= CITY_PAGE_MIN_COURTS ? cityIndexHref(anchor) : null,
        courts,
      };
    })
    .sort((a, b) => byCityName(a.city, b.city));
}

function addCourt(byCity: Map<string | null, CityBucket>, page: IndexCourt, fromDatabase: boolean) {
  const place = fromDatabase && !page.city?.trim() ? cityFromAddress(page.address) : null;
  const city = page.city?.trim() || place?.city || null;
  const address = place ? place.address : page.address;
  const key = city?.toLocaleLowerCase("fi") ?? null;
  const bucket: CityBucket = byCity.get(key) ?? { labels: new Map(), courts: [] };
  if (city) bucket.labels.set(city, (bucket.labels.get(city) ?? 0) + 1);
  bucket.courts.push({
    id: page.id,
    href: "",
    name: page.name,
    nameFi: page.nameFi,
    status: page.status,
    address,
    neighborhood: page.neighborhood,
    city,
    source: page.source,
    ...(page.emailConfirmed === undefined ? {} : { emailConfirmed: page.emailConfirmed }),
    amenities: {
      lighting: page.amenities.lighting,
      freeUse: page.amenities.freeUse,
    },
  });
  byCity.set(key, bucket);
}

type DraftCourt = CourtIndexEntry & {
  id: string;
  source: ExplorerCourt["source"];
};

type CityBucket = {
  labels: Map<string, number>;
  courts: DraftCourt[];
};

/** Courts a city page lists. Pending rows stay on the national list only. */
export function publicCityCourts(courts: CourtIndexEntry[]): CourtIndexEntry[] {
  return courts.filter((court) => court.status !== "pending");
}

export function cityCourtFacts(courts: Pick<CourtIndexEntry, "amenities" | "status">[]): {
  lit: number;
  closed: number;
} {
  let lit = 0;
  let closed = 0;
  for (const court of courts) {
    if (court.amenities.lighting === true) lit += 1;
    if (court.status === "out-of-service-temporarily") closed += 1;
  }
  return { lit, closed };
}

/** Index group that contains this court page, matched on the public id. */
export function courtIndexGroup(
  groups: CourtIndexGroup[],
  court: Pick<ExplorerCourt, "id" | "source">,
): CourtIndexGroup | null {
  const publicId = publicCourtId(court);
  if (!publicId) return null;
  return (
    groups.find((group) => group.courts.some((entry) => hrefPublicId(entry.href) === publicId)) ??
    null
  );
}

/** Canonical public path. The index anchor wins when a slug needed a suffix. */
export function canonicalCourtHref(
  court: Pick<Court, "id" | "source" | "city" | "address">,
  groups: CourtIndexGroup[],
): string {
  return courtHref({ ...court, city: listingCity(court) }, courtIndexGroup(groups, court)?.anchor);
}

export function cityHeading(city: string | null | undefined): string | null {
  return readableCity(city?.trim() || null);
}

function hrefPublicId(href: string): string {
  return href.slice(href.lastIndexOf("/") + 1);
}

/** City segment, including a mistyped `Helsinki` or `Järvenpää` instead of the slug. */
export function cityGroupBySegment(
  groups: CourtIndexGroup[],
  segment: string,
): CourtIndexGroup | null {
  const exact = groups.find((group) => group.anchor === segment);
  if (exact) return exact;
  const slug = citySlug(segment);
  return groups.find((group) => group.anchor === slug) ?? null;
}

/** Heading for a case-insensitive group. The spelling used most often wins. */
function mostCommonLabel(labels: Map<string, number>): string | null {
  let chosen: string | null = null;
  let count = 0;
  for (const [label, seen] of labels) {
    if (seen > count) {
      chosen = label;
      count = seen;
    }
  }
  return chosen;
}

/** HALIKKO is shown as Halikko. A name that already has lowercase letters is left as stored. */
function readableCity(city: string | null): string | null {
  if (!city || !isUppercase(city)) return city;
  const lower = city.toLocaleLowerCase("fi");
  return lower.replace(
    /(^|[\s-])(\p{L})/gu,
    (_, boundary: string, letter: string) => boundary + letter.toLocaleUpperCase("fi"),
  );
}

function isUppercase(value: string): boolean {
  return value === value.toLocaleUpperCase("fi") && value !== value.toLocaleLowerCase("fi");
}

function byCityName(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return compareFi(a, b);
}

function compareFi(a: string, b: string): number {
  return a.localeCompare(b, "fi", { sensitivity: "base" });
}

function cityAnchor(city: string | null, used: Set<string>): string {
  const base = city ? citySlug(city) : "muu";
  let anchor = base || "muu";
  let suffix = 2;
  while (used.has(anchor)) {
    anchor = `${base || "muu"}-${suffix}`;
    suffix += 1;
  }
  used.add(anchor);
  return anchor;
}
