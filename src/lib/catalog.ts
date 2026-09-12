import { cache } from "react";
import { mergeCourts, type Court } from "@/lib/courts";
import { COURT_SOURCES, type CourtSourceId } from "@/lib/sources";
import { getLipasCourts } from "@/lib/sources/lipas";
import { getOsmCourts } from "@/lib/sources/osm";

const FETCHERS = {
  lipas: getLipasCourts,
  osm: getOsmCourts,
} satisfies Record<CourtSourceId, () => Promise<Court[]>>;

export const getBasketballCourts = cache(async (): Promise<Court[]> => {
  const results = await Promise.all(
    COURT_SOURCES.map(async (source) => {
      try {
        return await FETCHERS[source.id]();
      } catch (error) {
        if (source.required) throw error;
        console.error(`${source.label} courts unavailable`, error);
        return [] as Court[];
      }
    }),
  );
  return mergeCourts(results);
});

export async function getBasketballCourt(id: string): Promise<Court | null> {
  const courts = await getBasketballCourts();
  return courts.find((court) => court.id === id) ?? null;
}
