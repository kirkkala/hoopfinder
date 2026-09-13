import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";
import { COURT_DATA_REVALIDATE } from "@/lib/constants";
import { mergeCourts, type Court } from "@/lib/courts";
import { COURT_SOURCES, type CourtSourceId } from "@/lib/sources";
import { getLipasCourts } from "@/lib/sources/lipas";
import { getOsmCourts } from "@/lib/sources/osm";

const FETCHERS = {
  lipas: getLipasCourts,
  osm: getOsmCourts,
} satisfies Record<CourtSourceId, () => Promise<Court[]>>;

const CACHE_DIR = join(process.cwd(), ".hoopfinder-cache");
const SNAPSHOT_PATH = join(CACHE_DIR, "courts.json");
const FETCH_COOLDOWN_MS = 2 * 60 * 1000;

type SourceSnapshot = {
  fetchedAt: string;
  courts: Court[];
};

type Snapshot = Partial<Record<CourtSourceId, SourceSnapshot>>;

export type CourtCatalog = {
  courts: Court[];
  fetchedAt: string | null;
};

let snapshotMemory: Snapshot | null = null;
let catalogMemory: CourtCatalog | null = null;
let catalogKey = "";
const fetchFailedAt: Partial<Record<CourtSourceId, number>> = {};

export const getCourtCatalog = cache(async (): Promise<CourtCatalog> => {
  const snapshot = await readSnapshot();
  const loaded: SourceSnapshot[] = [];
  let snapshotChanged = false;

  const batches = await Promise.all(
    COURT_SOURCES.map(async (source) => {
      const previous = snapshot[source.id];
      if (previous && previous.courts.length > 0 && isFresh(previous.fetchedAt)) {
        loaded.push(previous);
        return previous.courts;
      }

      if (isCoolingDown(source.id) && previous && previous.courts.length > 0) {
        loaded.push(previous);
        return previous.courts;
      }
      if (isCoolingDown(source.id)) {
        return [] as Court[];
      }

      try {
        const courts = await FETCHERS[source.id]();
        if (courts.length === 0) {
          throw new Error(`${source.label} returned no courts`);
        }
        delete fetchFailedAt[source.id];
        const entry = { fetchedAt: new Date().toISOString(), courts };
        snapshot[source.id] = entry;
        snapshotChanged = true;
        loaded.push(entry);
        return courts;
      } catch (error) {
        fetchFailedAt[source.id] = Date.now();
        if (previous && previous.courts.length > 0) {
          console.warn(
            `${source.label} fetch failed (${errorMessage(error)}); using saved courts from ${previous.fetchedAt}`,
          );
          loaded.push(previous);
          return previous.courts;
        }
        if (source.required) throw error;
        console.warn(
          `${source.label} fetch failed (${errorMessage(error)}); no saved courts yet`,
        );
        return [] as Court[];
      }
    }),
  );

  if (snapshotChanged) await writeSnapshot(snapshot);

  const nextKey = loaded
    .map((entry) => `${entry.fetchedAt}:${entry.courts.length}`)
    .join("|");
  if (catalogMemory && catalogKey === nextKey) return catalogMemory;

  catalogMemory = {
    courts: mergeCourts(batches),
    fetchedAt: oldestFetchedAt(loaded),
  };
  catalogKey = nextKey;
  return catalogMemory;
});

export async function getBasketballCourt(
  id: string,
): Promise<{ court: Court; fetchedAt: string | null } | null> {
  const catalog = await getCourtCatalog();
  const court = catalog.courts.find((item) => item.id === id);
  if (!court) return null;
  return { court, fetchedAt: catalog.fetchedAt };
}

function isFresh(fetchedAt: string): boolean {
  const fetchedMs = Date.parse(fetchedAt);
  if (!Number.isFinite(fetchedMs)) return false;
  return Date.now() - fetchedMs < COURT_DATA_REVALIDATE * 1000;
}

function isCoolingDown(source: CourtSourceId): boolean {
  const failedAt = fetchFailedAt[source];
  return failedAt !== undefined && Date.now() - failedAt < FETCH_COOLDOWN_MS;
}

function oldestFetchedAt(entries: SourceSnapshot[]): string | null {
  if (entries.length === 0) return null;
  return entries.reduce(
    (oldest, entry) => (entry.fetchedAt < oldest ? entry.fetchedAt : oldest),
    entries[0].fetchedAt,
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}

async function readSnapshot(): Promise<Snapshot> {
  const disk = await readDiskSnapshot();
  snapshotMemory = combineSnapshots(snapshotMemory, disk);
  return { ...snapshotMemory };
}

async function readDiskSnapshot(): Promise<Snapshot> {
  if (process.env.NODE_ENV !== "development") return {};

  try {
    return asSnapshot(JSON.parse(await readFile(SNAPSHOT_PATH, "utf8")));
  } catch {
    return {};
  }
}

function combineSnapshots(memory: Snapshot | null, disk: Snapshot): Snapshot {
  const combined: Snapshot = {};
  for (const source of COURT_SOURCES) {
    const picked = pickSnapshot(memory?.[source.id], disk[source.id]);
    if (picked) combined[source.id] = picked;
  }
  return combined;
}

function pickSnapshot(
  memory: SourceSnapshot | undefined,
  disk: SourceSnapshot | undefined,
): SourceSnapshot | undefined {
  const memoryOk = memory && memory.courts.length > 0;
  const diskOk = disk && disk.courts.length > 0;
  if (memoryOk && diskOk) {
    return memory.fetchedAt >= disk.fetchedAt ? memory : disk;
  }
  if (diskOk) return disk;
  if (memoryOk) return memory;
  return memory ?? disk;
}

async function writeSnapshot(snapshot: Snapshot) {
  snapshotMemory = snapshot;
  catalogMemory = null;
  catalogKey = "";
  if (process.env.NODE_ENV !== "development") return;

  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot));
  } catch (error) {
    console.warn("Could not persist court snapshot:", errorMessage(error));
  }
}

function asSnapshot(value: unknown): Snapshot {
  if (!value || typeof value !== "object") return {};

  const snapshot: Snapshot = {};
  for (const source of COURT_SOURCES) {
    const entry = (value as Record<string, unknown>)[source.id];
    if (!entry || typeof entry !== "object") continue;
    const fetchedAt = (entry as { fetchedAt?: unknown }).fetchedAt;
    const courts = (entry as { courts?: unknown }).courts;
    if (typeof fetchedAt !== "string" || !Array.isArray(courts)) continue;
    snapshot[source.id] = { fetchedAt, courts: courts as Court[] };
  }
  return snapshot;
}
