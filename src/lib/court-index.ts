import { getCopy } from "@/lib/copy";
import { type Court, courtHref, courtTitle } from "@/lib/courts";

export type CourtIndexEntry = {
  href: string;
  name: string;
  nameFi: string;
  status: string;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  amenities: Pick<Court["amenities"], "lighting" | "freeUse">;
};

export type CourtIndexGroup = {
  /** Null when the court has no city. */
  city: string | null;
  anchor: string;
  courts: CourtIndexEntry[];
};

/**
 * Public court pages grouped by city, in Finnish alphabetical order.
 * Each pad keeps the same URL and title as its court page.
 */
export function courtIndex(courts: Court[]): CourtIndexGroup[] {
  const finnish = getCopy("fi");
  const byCity = new Map<string | null, CityBucket>();

  for (const court of courts) {
    for (const page of court.members ?? [court]) {
      const city = page.city?.trim() || null;
      const key = city?.toLocaleLowerCase("fi") ?? null;
      const bucket: CityBucket = byCity.get(key) ?? { labels: new Map(), courts: [] };
      if (city) bucket.labels.set(city, (bucket.labels.get(city) ?? 0) + 1);
      bucket.courts.push({
        href: courtHref(page),
        name: page.name,
        nameFi: page.nameFi,
        status: page.status,
        address: page.address,
        neighborhood: page.neighborhood,
        city: page.city,
        amenities: {
          lighting: page.amenities.lighting,
          freeUse: page.amenities.freeUse,
        },
      });
      byCity.set(key, bucket);
    }
  }

  const usedAnchors = new Set<string>();
  return [...byCity.values()]
    .map((bucket) => {
      const city = readableCity(mostCommonLabel(bucket.labels));
      return {
        city,
        anchor: cityAnchor(city, usedAnchors),
        courts: bucket.courts.sort((a, b) =>
          compareFi(courtTitle(a, finnish), courtTitle(b, finnish)),
        ),
      };
    })
    .sort((a, b) => byCityName(a.city, b.city));
}

type CityBucket = {
  labels: Map<string, number>;
  courts: CourtIndexEntry[];
};

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
  const base = city ? slug(city) : "muu";
  let anchor = base || "muu";
  let suffix = 2;
  while (used.has(anchor)) {
    anchor = `${base || "muu"}-${suffix}`;
    suffix += 1;
  }
  used.add(anchor);
  return anchor;
}

function slug(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("fi")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
