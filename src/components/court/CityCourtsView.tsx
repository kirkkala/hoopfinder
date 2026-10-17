"use client";

import { AppFooter } from "@/components/brand/AppFooter";
import { AppHeader } from "@/components/brand/AppHeader";
import { AppLink } from "@/components/brand/AppLink";
import { useCopy } from "@/components/brand/LocaleProvider";
import { ViewJumps } from "@/components/brand/ViewJump";
import { CourtIndexCard } from "@/components/court/CourtIndexView";
import type { FetchedAtBySource } from "@/lib/catalog";
import { COURT_INDEX_PATH } from "@/lib/constants";
import { type CourtIndexEntry, cityAreas } from "@/lib/court-index";

export function CityCourtsView({
  cityName,
  courts,
  lit,
  closed,
  fetchedAtBySource,
}: {
  cityName: string | null;
  courts: CourtIndexEntry[];
  lit: number;
  closed: number;
  fetchedAtBySource: FetchedAtBySource;
}) {
  const copy = useCopy();
  const place = cityName ?? copy.cityUnknown;
  const heading = copy.cityCourtsHeading(place);
  const areas = cityAreas(courts);

  return (
    <div className="flex min-h-dvh flex-col bg-asphalt">
      <AppHeader fetchedAtBySource={fetchedAtBySource} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <ViewJumps also="to-map" />
        <nav aria-label={copy.breadcrumb} className="mt-4 text-sm text-ink-muted">
          <AppLink
            href={COURT_INDEX_PATH}
            prefetch={false}
            trailingPending={false}
            className="font-medium text-gold hover:text-white"
          >
            {copy.allCourts}
          </AppLink>
        </nav>
        <h1 className="mt-3 font-display text-4xl tracking-wide text-white">{heading}</h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {copy.cityCourtsIntro(courts.length, lit, closed)}
        </p>
        {areas.length > 0 ? (
          <p className="sr-only" aria-hidden="true">
            {copy.cityAreasLine(areas)}
          </p>
        ) : null}
        <ul className="mt-6 space-y-2">
          {courts.map((court) => (
            <CourtIndexCard key={court.href} court={court} />
          ))}
        </ul>
      </main>
      <AppFooter />
    </div>
  );
}
