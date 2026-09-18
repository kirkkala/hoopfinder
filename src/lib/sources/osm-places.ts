import type { Court } from "@/lib/courts";

const USER_AGENT = "HoopFinder/0.1 (https://github.com/kirkkala/hoopfinder)";
const LOOKUP = "https://nominatim.openstreetmap.org/lookup";
const BATCH = 50;
const GAP_MS = 1_100;
const ATTEMPTS = 3;

type NominatimAddress = {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  suburb?: string;
  neighbourhood?: string;
  neighborhood?: string;
  quarter?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  postcode?: string;
};

type NominatimHit = {
  osm_type?: string;
  osm_id?: number;
  address?: NominatimAddress;
};

/** Fill blank OSM city / neighborhood / address from Nominatim's indexed copy of the same objects. */
export async function enrichOsmPlaces(courts: Court[]): Promise<Court[]> {
  const pending = courts.filter(
    (court) => needsPlace(court) && osmLookupId(court.id),
  );
  if (pending.length === 0) return courts;

  console.log(`Nominatim lookup for ${pending.length} OSM courts`);
  const hits = new Map<string, NominatimHit>();
  for (let index = 0; index < pending.length; index += BATCH) {
    if (index > 0) await sleep(GAP_MS);
    const chunk = pending.slice(index, index + BATCH);
    const ids = chunk
      .map((court) => osmLookupId(court.id))
      .filter((id): id is string => Boolean(id));
    for (const hit of await lookupBatch(ids)) {
      const courtId = courtIdFromHit(hit);
      if (courtId) hits.set(courtId, hit);
    }
  }

  let filled = 0;
  const next = courts.map((court) => {
    const hit = hits.get(court.id);
    if (!hit) return court;
    const enriched = applyHit(court, hit);
    if (
      enriched.address !== court.address ||
      enriched.city !== court.city ||
      enriched.neighborhood !== court.neighborhood ||
      enriched.postalCode !== court.postalCode
    ) {
      filled += 1;
    }
    return enriched;
  });
  console.log(`Nominatim filled place fields on ${filled} courts`);
  return next;
}

function needsPlace(court: Court): boolean {
  return !court.address || !court.city || !court.neighborhood;
}

function osmLookupId(courtId: string): string | null {
  const match = /^osm-(node|way|relation)-(\d+)$/.exec(courtId);
  if (!match) return null;
  const prefix = { node: "N", way: "W", relation: "R" }[match[1]];
  return prefix ? `${prefix}${match[2]}` : null;
}

function courtIdFromHit(hit: NominatimHit): string | null {
  if (!hit.osm_type || hit.osm_id == null) return null;
  return `osm-${hit.osm_type}-${hit.osm_id}`;
}

async function lookupBatch(ids: string[]): Promise<NominatimHit[]> {
  if (ids.length === 0) return [];
  let lastError: unknown;
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    try {
      const url = new URL(LOOKUP);
      url.searchParams.set("osm_ids", ids.join(","));
      url.searchParams.set("format", "json");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("accept-language", "fi");
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": USER_AGENT,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      });
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`Nominatim lookup failed with ${response.status}`);
      }
      if (!response.ok) {
        throw new Error(`Nominatim lookup failed with ${response.status}`);
      }
      const payload = (await response.json()) as unknown;
      return Array.isArray(payload) ? (payload as NominatimHit[]) : [];
    } catch (error) {
      lastError = error;
      await sleep(1_000 * (attempt + 1));
    }
  }
  const message = lastError instanceof Error ? lastError.message : "unknown error";
  console.warn(`Nominatim lookup dropped a batch (${message})`);
  return [];
}

function applyHit(court: Court, hit: NominatimHit): Court {
  const address = hit.address;
  if (!address) return court;
  const road = text(address.road) || text(address.pedestrian);
  const house = text(address.house_number);
  const streetAddress = road ? (house ? `${road} ${house}` : road) : null;
  const city =
    court.city ??
    text(address.city) ??
    text(address.town) ??
    text(address.village) ??
    text(address.hamlet);
  const neighborhood =
    court.neighborhood ??
    text(address.suburb) ??
    text(address.quarter) ??
    text(address.neighbourhood) ??
    text(address.neighborhood);
  return {
    ...court,
    address: court.address ?? streetAddress,
    postalCode: court.postalCode ?? text(address.postcode),
    city,
    neighborhood:
      neighborhood && neighborhood !== city ? neighborhood : court.neighborhood,
  };
}

function text(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
