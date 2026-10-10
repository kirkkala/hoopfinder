import { cache } from "react";
import { groupCourtPlaces } from "@/lib/court-groups";
import { type Court, mergeCourts } from "@/lib/courts";
import { COURT_SOURCES, type CourtSourceId } from "@/lib/sources";
import bundled from "../../data/courts.json";

type SourceSnapshot = {
  fetchedAt: string;
  courts: Court[];
};

type Snapshot = Partial<Record<CourtSourceId, SourceSnapshot>>;

export type FetchedAtBySource = Partial<Record<CourtSourceId, string>>;

export type CourtCatalog = {
  /** One court per place. LIPAS pads at the same place are already grouped. */
  courts: Court[];
  fetchedAtBySource: FetchedAtBySource;
  placeById: Map<string, Court>;
  sourceById: Map<string, Court>;
};

/**
 * Court list is the committed snapshot in `data/courts.json`.
 * Runtime never calls Overpass (it is too slow/unreliable on Vercel).
 * Grouping and OSM field-fill happen here. Refresh still writes one row per source court.
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
  const grouped = groupCourtPlaces(mergeCourts(loaded.map((entry) => entry.courts)));
  return {
    courts: grouped.courts,
    fetchedAtBySource,
    placeById: grouped.placeById,
    sourceById: grouped.sourceById,
  };
});

/** The source row for this id. Photo files stay under this court's path. */
export async function getBasketballCourt(id: string): Promise<{
  court: Court;
  sourceFetchedAt: string | null;
} | null> {
  const catalog = await getCourtCatalog();
  const court = catalog.sourceById.get(id);
  if (!court) return null;
  return { court, sourceFetchedAt: fetchedAtFor(catalog, court) };
}

/** Public place for this id, including a pad or a folded OSM court. */
export async function getCourtPlace(id: string): Promise<{
  court: Court;
  sourceFetchedAt: string | null;
} | null> {
  const catalog = await getCourtCatalog();
  const court = catalog.placeById.get(id);
  if (!court) return null;
  return { court, sourceFetchedAt: fetchedAtFor(catalog, court) };
}

function fetchedAtFor(catalog: CourtCatalog, court: Court): string | null {
  if (court.source === "submitted") return null;
  return catalog.fetchedAtBySource[court.source] ?? null;
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
