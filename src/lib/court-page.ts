import { cache } from "react";
import { type FetchedAtBySource, getCourtCatalog, getCourtPlace } from "@/lib/catalog";
import { SITE_URL } from "@/lib/constants";
import { courtOnPlace, courtPageCount } from "@/lib/court-groups";
import { type CourtIndexGroup, courtIndex } from "@/lib/court-index";
import type { Court } from "@/lib/courts";
import { isDatabaseUnavailable } from "@/lib/db";
import { getSubmittedCourt, listSubmittedCourts } from "@/lib/submitted-courts";

export function breadcrumbJsonLd(items: { name: string; path: string | null }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: `${SITE_URL}${item.path}` } : {}),
    })),
  };
}

export type LoadedCourt = {
  court: Court;
  place: Court;
  sourceFetchedAt: string | null;
  email?: string;
};

export type CourtIndexData = {
  groups: CourtIndexGroup[];
  courtCount: number;
  fetchedAtBySource: FetchedAtBySource;
};

export const loadCourtIndex = cache(async (): Promise<CourtIndexData> => {
  const { courts, fetchedAtBySource } = await getCourtCatalog();
  const submitted = await listSubmittedCourts();
  return {
    groups: courtIndex(courts, submitted),
    courtCount: courtPageCount(courts) + submitted.length,
    fetchedAtBySource,
  };
});

export async function loadCourtById(id: string): Promise<LoadedCourt | null> {
  const catalogCourt = await getCourtPlace(id);
  if (catalogCourt) {
    return {
      court: courtOnPlace(catalogCourt.court, id),
      place: catalogCourt.court,
      sourceFetchedAt: catalogCourt.sourceFetchedAt,
    };
  }
  const submitted = await getSubmittedCourt(id);
  if (!submitted) {
    if (isDatabaseUnavailable()) throw new Error("database unavailable");
    return null;
  }
  return {
    court: submitted.court,
    place: submitted.court,
    sourceFetchedAt: submitted.createdAt,
    email: submitted.email,
  };
}
