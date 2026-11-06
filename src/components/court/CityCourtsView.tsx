"use client";

import { useState } from "react";
import { AppFooter } from "@/components/brand/AppFooter";
import { AppHeader } from "@/components/brand/AppHeader";
import { AppLink } from "@/components/brand/AppLink";
import { useCopy } from "@/components/brand/LocaleProvider";
import { ViewJumps } from "@/components/brand/ViewJump";
import { SearchBox } from "@/components/court/CitySelect";
import { CourtIndexCard } from "@/components/court/CourtIndexView";
import type { FetchedAtBySource } from "@/lib/catalog";
import { COURT_INDEX_PATH } from "@/lib/constants";
import {
  CITY_COURT_SEARCH_MIN,
  type CourtIndexEntry,
  cityAreas,
  courtMatchesQuery,
} from "@/lib/court-index";

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
  const [query, setQuery] = useState("");
  const showSearch = courts.length > CITY_COURT_SEARCH_MIN;
  const visible = showSearch ? courts.filter((court) => courtMatchesQuery(court, query)) : courts;

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
        {showSearch ? (
          <div className="mt-6">
            <SearchBox
              id="city-court-search"
              label={copy.cityCourtSearch}
              placeholder={copy.cityCourtSearch}
              query={query}
              onQueryChange={setQuery}
            />
          </div>
        ) : null}
        {visible.length > 0 ? (
          <ul className={`${showSearch ? "mt-4" : "mt-6"} space-y-2`}>
            {visible.map((court) => (
              <CourtIndexCard key={court.href} court={court} />
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink-muted">{copy.citySearchEmpty}</p>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
