import { COURT_DATA_REVALIDATE } from "@/lib/constants";
import {
  cameraBoundsForPlace,
  expandTinyBounds,
  type MapBounds,
} from "@/lib/geo";

export type PlaceMatch = {
  /** Full place area — used to filter courts. */
  bounds: MapBounds;
  /** Tighter camera for city/kunta searches. */
  camera: MapBounds;
};

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const NOMINATIM_REVERSE = "https://nominatim.openstreetmap.org/reverse";
const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "HoopFinder/0.1 (https://github.com/kirkkala/hoopfinder)",
};

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
  lat?: string;
  lon?: string;
  type?: string;
};

function placeScore(hit: NominatimHit): number {
  if (hit.class === "railway" || hit.class === "highway" || hit.class === "amenity") {
    return -1;
  }
  return PLACE_RANK[hit.type ?? ""] ?? (hit.class === "place" || hit.class === "boundary" ? 1 : 0);
}

export async function lookupPlace(query: string): Promise<PlaceMatch | null> {
  const needle = query.trim();
  if (needle.length < 2) return null;

  const url = new URL(NOMINATIM);
  url.searchParams.set("q", `${needle}, Finland`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "8");
  url.searchParams.set("countrycodes", "fi");

  const response = await fetch(url, {
    headers: NOMINATIM_HEADERS,
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
  const bounds = expandTinyBounds({ south, north, west, east });
  const lat = Number(hit.lat);
  const lon = Number(hit.lon);
  const center =
    Number.isFinite(lat) && Number.isFinite(lon)
      ? { lat, lon }
      : {
          lat: (bounds.north + bounds.south) / 2,
          lon: (bounds.east + bounds.west) / 2,
        };

  return { bounds, camera: cameraBoundsForPlace(center, bounds) };
}

type ReverseAddress = {
  house_number?: string;
  road?: string;
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
};

/** Street address for a dropped pin, or null when Nominatim has nothing useful. */
export async function reverseAddress(lat: number, lon: number): Promise<string | null> {
  const url = new URL(NOMINATIM_REVERSE);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "18");
  url.searchParams.set("layer", "address");
  url.searchParams.set("accept-language", "fi");

  const response = await fetch(url, {
    headers: NOMINATIM_HEADERS,
    cache: "force-cache",
    next: { revalidate: COURT_DATA_REVALIDATE },
  });
  if (!response.ok) return null;

  const hit = (await response.json()) as { address?: ReverseAddress };
  return formatReverseAddress(hit.address);
}

function formatReverseAddress(address: ReverseAddress | undefined): string | null {
  if (!address) return null;
  const street = [address.road, address.house_number].filter(Boolean).join(" ");
  const city = address.city || address.town || address.village;
  const place = [address.postcode, city].filter(Boolean).join(" ");
  const line = [street, place].filter(Boolean).join(", ");
  return line || null;
}
