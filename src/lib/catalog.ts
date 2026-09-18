import { cache } from "react";
import bundled from "../../data/courts.json";
import { mergeCourts, type Court } from "@/lib/courts";
import { COURT_SOURCES, type CourtSourceId } from "@/lib/sources";

type SourceSnapshot = {
  fetchedAt: string;
  courts: Court[];
};

type Snapshot = Partial<Record<CourtSourceId, SourceSnapshot>>;

export type FetchedAtBySource = Partial<Record<CourtSourceId, string>>;

export type CourtCatalog = {
  courts: Court[];
  fetchedAtBySource: FetchedAtBySource;
};

/**
 * Court list is the committed snapshot in `data/courts.json`.
 * Runtime never calls Overpass (it is too slow/unreliable on Vercel).
 * Refresh with `npm run refresh-courts` or the weekly GitHub Action.
 * LIPAS only: `npm run refresh-courts:lipas`.
 * OSM place fields only: `npm run refresh-courts:osm-places`.
 */
export const getCourtCatalog = cache(async (): Promise<CourtCatalog> => {
  const snapshot = asSnapshot(bundled);
  const fetchedAtBySource: Partial<Record<CourtSourceId, string>> = {};
  const loaded = COURT_SOURCES.flatMap((source) => {
    const entry = snapshot[source.id];
    if (!entry) return [];
    fetchedAtBySource[source.id] = entry.fetchedAt;
    return [entry];
  });
  return {
    courts: mergeCourts(loaded.map((entry) => entry.courts)),
    fetchedAtBySource,
  };
});

export async function getBasketballCourt(
  id: string,
): Promise<{
  court: Court;
  sourceFetchedAt: string | null;
} | null> {
  const catalog = await getCourtCatalog();
  const court = catalog.courts.find((item) => item.id === id);
  if (!court) return null;
  return {
    court,
    sourceFetchedAt: catalog.fetchedAtBySource[court.source] ?? null,
  };
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
