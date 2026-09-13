import { COURT_DATA_REVALIDATE } from "@/lib/constants";
import { expandTinyBounds, type MapBounds } from "@/lib/geo";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

/** Prefer real neighborhoods and towns over stations, shops, and roads. */
const PLACE_RANK: Record<string, number> = {
  suburb: 5,
  quarter: 5,
  neighbourhood: 5,
  neighborhood: 5,
  city_district: 4,
  administrative: 4,
  city: 3,
  town: 3,
  village: 2,
  hamlet: 2,
};

type NominatimHit = {
  boundingbox?: string[];
  class?: string;
  type?: string;
};

function placeScore(hit: NominatimHit): number {
  if (hit.class === "railway" || hit.class === "highway" || hit.class === "amenity") {
    return -1;
  }
  return PLACE_RANK[hit.type ?? ""] ?? (hit.class === "place" || hit.class === "boundary" ? 1 : 0);
}

export async function lookupPlace(query: string): Promise<MapBounds | null> {
  const needle = query.trim();
  if (needle.length < 2) return null;

  const url = new URL(NOMINATIM);
  url.searchParams.set("q", `${needle}, Finland`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "8");
  url.searchParams.set("countrycodes", "fi");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "HoopFinder/0.1 (https://github.com/kirkkala/hoopfinder)",
    },
    cache: "force-cache",
    next: { revalidate: COURT_DATA_REVALIDATE },
  });
  if (!response.ok) return null;

  const hits = (await response.json()) as NominatimHit[];
  if (!Array.isArray(hits) || hits.length === 0) return null;

  const hit = hits.reduce((best, candidate) =>
    placeScore(candidate) > placeScore(best) ? candidate : best,
  );
  const box = hit.boundingbox?.map(Number);
  if (!box || box.length !== 4 || box.some((value) => !Number.isFinite(value))) {
    return null;
  }

  const [south, north, west, east] = box;
  return expandTinyBounds({ south, north, west, east });
}
