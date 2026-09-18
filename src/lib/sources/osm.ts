import { z } from "zod";
import { getCopy } from "@/lib/copy";
import { emptyAmenities, isGenericCourtName, type Court } from "@/lib/courts";
import { isInFinland } from "@/lib/sources/finland";
import { enrichOsmPlaces } from "@/lib/sources/osm-places";

const USER_AGENT = "HoopFinder/0.1 (https://github.com/kirkkala/hoopfinder)";
const DEFAULT_DISPATCHER = "https://overpass-api.de/api/interpreter";
const LZ4_INTERPRETER = "https://lz4.overpass-api.de/api/interpreter";
const TILE_TIMEOUT_S = 30;
const FETCH_TIMEOUT_MS = 45_000;
const TILE_ATTEMPTS = 5;
const TILE_GAP_MS = 25_000;

/** Public dispatcher often 504s; follow `/api/status` and query Finland in tiles. */
const DISPATCHER = process.env.OVERPASS_API_BASE ?? DEFAULT_DISPATCHER;

type Tile = { south: number; west: number; north: number; east: number };

const FINLAND_TILES: Tile[] = [
  { south: 59.7, west: 19.3, north: 61.4, east: 28.35 },
  { south: 61.4, west: 20.5, north: 64.8, east: 31.6 },
  { south: 64.8, west: 20.5, north: 70.1, east: 31.2 },
];

const OsmSchema = z.object({
  remark: z.string().optional(),
  elements: z.array(
    z.looseObject({
      type: z.enum(["node", "way", "relation"]),
      id: z.number(),
      lat: z.number().optional(),
      lon: z.number().optional(),
      center: z
        .object({
          lat: z.number(),
          lon: z.number(),
        })
        .optional(),
      tags: z.record(z.string(), z.string()).optional(),
    }),
  ),
});

type OsmElement = z.infer<typeof OsmSchema>["elements"][number];

export async function getOsmCourts(): Promise<Court[]> {
  const interpreters = await interpretersToTry();
  const byId = new Map<string, Court>();

  for (const [index, tile] of FINLAND_TILES.entries()) {
    const label = `${index + 1}/${FINLAND_TILES.length}`;
    const elements = await fetchTile(tile, label, interpreters);
    for (const element of elements) {
      const court = toCourt(element);
      if (court) byId.set(court.id, court);
    }
    if (index < FINLAND_TILES.length - 1) {
      console.log(`Waiting ${TILE_GAP_MS / 1000}s before the next OSM tile`);
      await sleep(TILE_GAP_MS);
    }
  }

  const courts = [...byId.values()];
  if (courts.length === 0) {
    throw new Error("Overpass returned no courts");
  }
  return enrichOsmPlaces(courts);
}

async function fetchTile(
  tile: Tile,
  label: string,
  interpreters: string[],
): Promise<OsmElement[]> {
  let lastError: unknown;
  for (let attempt = 0; attempt < TILE_ATTEMPTS; attempt++) {
    const interpreter = interpreters[attempt % interpreters.length];
    await waitForSlot(interpreter);
    try {
      console.log(`OSM tile ${label} via ${interpreter}`);
      return await postOverpass(interpreter, tileQuery(tile));
    } catch (error) {
      lastError = error;
      const delayMs = retryDelayMs(error, attempt);
      const message = error instanceof Error ? error.message : "unknown error";
      console.warn(`OSM tile ${label} failed (${message}); retry in ${Math.round(delayMs / 1000)}s`);
      await sleep(delayMs);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Overpass tile failed");
}

async function postOverpass(interpreter: string, query: string): Promise<OsmElement[]> {
  const response = await fetch(interpreter, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": USER_AGENT,
    },
    body: new URLSearchParams({ data: query }).toString(),
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (response.status === 429 || response.status === 502 || response.status === 504) {
    throw new Error(`Overpass request failed with ${response.status}`);
  }
  if (!response.ok) {
    throw new Error(`Overpass request failed with ${response.status}`);
  }

  const parsed = OsmSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("Overpass payload failed validation");
  }
  if (parsed.data.remark) {
    throw new Error(`Overpass error: ${parsed.data.remark}`);
  }
  return parsed.data.elements;
}

async function interpretersToTry(): Promise<string[]> {
  const announced = await readAnnouncedInterpreter(DISPATCHER);
  const extras = DISPATCHER === DEFAULT_DISPATCHER ? [LZ4_INTERPRETER] : [];
  return unique([announced, DISPATCHER, ...extras].filter((url): url is string => Boolean(url)));
}

async function readAnnouncedInterpreter(interpreter: string): Promise<string | null> {
  try {
    const response = await fetch(statusUrl(interpreter), {
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const match = /Announced endpoint:\s*(\S+)/.exec(await response.text());
    if (!match) return null;
    const host = match[1].replace(/\/+$/, "");
    const origin = host.includes("://") ? host : `https://${host}`;
    return `${origin}/api/interpreter`;
  } catch {
    return null;
  }
}

async function waitForSlot(interpreter: string): Promise<void> {
  try {
    const response = await fetch(statusUrl(interpreter), {
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return;
    const text = await response.text();
    const available = /(\d+) slots available now/.exec(text);
    if (available && Number(available[1]) > 0) return;
    const wait = /Slot available after:\s*(\d+)/.exec(text);
    const seconds = wait ? Number(wait[1]) + 2 : 20;
    console.log(`Overpass busy (${interpreter}); waiting ${seconds}s for a slot`);
    await sleep(seconds * 1000);
  } catch {
    // Status is advisory; still try the query.
  }
}

function tileQuery(tile: Tile): string {
  return `[out:json][timeout:${TILE_TIMEOUT_S}];
nwr["leisure"="pitch"]["sport"~"basketball"]["indoor"!="yes"]["location"!="indoor"](${tile.south},${tile.west},${tile.north},${tile.east});
out center tags;`;
}

function statusUrl(interpreter: string): string {
  return interpreter.replace(/\/interpreter\/?$/, "/status");
}

function retryDelayMs(error: unknown, attempt: number): number {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("429")) return Math.min(30_000 * 2 ** attempt, 120_000);
  if (message.includes("504") || message.includes("502")) return 8_000 * (attempt + 1);
  return 3_000 * (attempt + 1);
}

function unique(urls: string[]): string[] {
  return [...new Set(urls)];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toCourt(element: OsmElement): Court | null {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  if (!isInFinland(lat, lon)) return null;

  const tags = element.tags ?? {};
  if (tags.location === "indoor") return null;

  const taggedName = text(tags["name:fi"]) || text(tags.name);
  const nameFi =
    taggedName && !isGenericCourtName(taggedName)
      ? taggedName
      : getCopy("fi").unnamedCourt;
  const taggedEn = text(tags["name:en"]);
  const name =
    taggedEn && !isGenericCourtName(taggedEn) ? taggedEn : nameFi;
  const hoops = text(tags.hoops);

  return {
    id: `osm-${element.type}-${element.id}`,
    source: "osm",
    name,
    nameFi,
    status: "active",
    address: text(tags["addr:street"])
      ? [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ")
      : null,
    postalCode: text(tags["addr:postcode"]),
    city: text(tags["addr:city"]) || text(tags["addr:municipality"]),
    neighborhood: text(tags["addr:suburb"]) || text(tags["addr:district"]),
    lat,
    lon,
    comment: text(tags.description) || text(tags.note),
    website: text(tags.website) || text(tags.url),
    constructionYear: null,
    owner: text(tags.operator) || text(tags.owner),
    admin: null,
    amenities: {
      ...emptyAmenities(),
      lighting: yesNo(tags.lit),
      freeUse: accessToFreeUse(tags.access),
      fieldType: hoops ? `${hoops} hoop${hoops === "1" ? "" : "s"}` : null,
      surfaceMaterial: text(tags.surface) ? [tags.surface] : [],
    },
  };
}

function yesNo(value: string | undefined): boolean | null {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

function accessToFreeUse(value: string | undefined): boolean | null {
  if (!value) return null;
  if (value === "yes" || value === "public") return true;
  if (value === "private" || value === "no" || value === "customers") return false;
  return null;
}

function text(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
