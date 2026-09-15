import { cache } from "react";
import bundled from "../../data/courts.json";
import { mergeCourts, type Court } from "@/lib/courts";
import { COURT_SOURCES, type CourtSourceId } from "@/lib/sources";

type SourceSnapshot = {
  fetchedAt: string;
  courts: Court[];
};

type Snapshot = Partial<Record<CourtSourceId, SourceSnapshot>>;

export type CourtCatalog = {
  courts: Court[];
  fetchedAt: string | null;
};

/**
 * Court list is the committed snapshot in `data/courts.json`.
 * Runtime never calls Overpass (it is too slow/unreliable on Vercel).
 * Refresh with `npm run refresh-courts` or the weekly GitHub Action.
 * LIPAS only: `npm run refresh-courts:lipas`.
 */
export const getCourtCatalog = cache(async (): Promise<CourtCatalog> => {
  const snapshot = asSnapshot(bundled);
  const loaded = COURT_SOURCES.flatMap((source) => {
    const entry = snapshot[source.id];
    return entry ? [entry] : [];
  });
  return {
    courts: mergeCourts(loaded.map((entry) => entry.courts)),
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

function oldestFetchedAt(entries: SourceSnapshot[]): string | null {
  if (entries.length === 0) return null;
  return entries.reduce(
    (oldest, entry) => (entry.fetchedAt < oldest ? entry.fetchedAt : oldest),
    entries[0].fetchedAt,
  );
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
