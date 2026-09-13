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

export const getCourtCatalog = cache(async (): Promise<CourtCatalog> => {
  const snapshot = await readSnapshot();
  const loaded: SourceSnapshot[] = [];
  let snapshotChanged = false;

  const batches = await Promise.all(
    COURT_SOURCES.map(async (source) => {
      const previous = snapshot[source.id];
      if (previous && isFresh(previous.fetchedAt)) {
        loaded.push(previous);
        return previous.courts;
      }

      try {
        const courts = await FETCHERS[source.id]();
        const entry = { fetchedAt: new Date().toISOString(), courts };
        snapshot[source.id] = entry;
        snapshotChanged = true;
        loaded.push(entry);
        return courts;
      } catch (error) {
        if (previous) {
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
  return {
    courts: mergeCourts(batches),
    fetchedAt: oldestFetchedAt(loaded),
  };
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
  if (snapshotMemory) return { ...snapshotMemory };

  if (process.env.NODE_ENV === "development") {
    try {
      const parsed: unknown = JSON.parse(await readFile(SNAPSHOT_PATH, "utf8"));
      snapshotMemory = asSnapshot(parsed);
      return { ...snapshotMemory };
    } catch {
      // First run, or the cache file is missing/unreadable.
    }
  }

  snapshotMemory = {};
  return {};
}

async function writeSnapshot(snapshot: Snapshot) {
  snapshotMemory = snapshot;
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
