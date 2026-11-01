"use client";

import { ArrowRight } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { AppFooter } from "@/components/brand/AppFooter";
import { AppHeader } from "@/components/brand/AppHeader";
import { AppLink, AppLinkPending } from "@/components/brand/AppLink";
import { useCopy } from "@/components/brand/LocaleProvider";
import { ViewJumps } from "@/components/brand/ViewJump";
import {
  CITY_SEARCH_HEIGHT,
  CitySelect,
  COURT_LIST_ID,
  cityMatchesQuery,
} from "@/components/court/CitySelect";
import { CourtBadges } from "@/components/explorer/CourtBadges";
import { CourtHeading } from "@/components/explorer/CourtHeading";
import type { FetchedAtBySource } from "@/lib/catalog";
import {
  type CourtIndexEntry,
  type CourtIndexGroup,
  cityIndexHref,
  indexListFacts,
} from "@/lib/court-index";

const searchHeight = `var(${CITY_SEARCH_HEIGHT}, 0px)`;

export function CourtIndexView({
  groups,
  fetchedAtBySource,
}: {
  groups: CourtIndexGroup[];
  fetchedAtBySource: FetchedAtBySource;
}) {
  const copy = useCopy();
  const facts = indexListFacts(groups);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const visibleGroups = groups.filter((group) =>
    cityMatchesQuery(group.city ?? copy.cityUnknown, query),
  );

  useLayoutEffect(() => {
    const search = searchRef.current;
    if (!search) return;
    const root = document.documentElement;
    const sync = () => {
      root.style.setProperty(CITY_SEARCH_HEIGHT, `${search.offsetHeight}px`);
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(search);
    return () => {
      observer.disconnect();
      root.style.removeProperty(CITY_SEARCH_HEIGHT);
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-asphalt">
      <AppHeader fetchedAtBySource={fetchedAtBySource} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <ViewJumps also="to-map" />
        <h1 className="mt-4 font-display text-4xl tracking-wide text-white">
          {copy.allCourtsHeading}
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          {copy.allCourtsIntro(facts.courts, facts.places, facts.lit, facts.closed)}
        </p>
        <p className="mt-2 text-sm leading-6 text-ink-muted">{copy.allCourtsLead}</p>
        <div
          ref={searchRef}
          className="sticky top-[var(--app-header-height,3.5rem)] z-30 -mx-4 mt-2 border-b border-white/10 bg-asphalt px-4 py-3 sm:-mx-6 sm:px-6"
        >
          <CitySelect query={query} onQueryChange={setQuery} />
        </div>
        {visibleGroups.length > 0 ? (
          <ul id={COURT_LIST_ID} className="mt-6" style={{ scrollMarginTop: searchHeight }}>
            {visibleGroups.map((group) => (
              <li key={group.anchor} id={group.anchor} style={{ scrollMarginTop: searchHeight }}>
                <AppLink
                  href={cityIndexHref(group.anchor)}
                  prefetch={false}
                  trailingPending={false}
                  className="flex items-baseline gap-2 border-b border-white/10 py-3 font-display text-xl tracking-wide text-gold outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60"
                >
                  {group.city ?? copy.cityUnknown}{" "}
                  <span className="inline-block font-sans text-sm font-medium leading-none tracking-normal text-ink-muted">
                    {`(${copy.cityCourtCount(group.courts.length)})`}
                  </span>
                </AppLink>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-ink-muted">{copy.citySearchEmpty}</p>
        )}
      </main>
      <AppFooter />
    </div>
  );
}

export function CourtIndexCard({ court }: { court: CourtIndexEntry }) {
  const copy = useCopy();
  return (
    <li>
      <AppLink
        href={court.href}
        prefetch={false}
        trailingPending={false}
        className="group flex w-full flex-col gap-2 rounded-2xl bg-white/5 px-3 py-3 outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        <CourtHeading court={court} />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <CourtBadges court={court} />
          <span className="ml-auto inline-flex items-center gap-1 font-bold text-gold group-hover:text-white">
            {copy.letsGo}
            <ArrowRight className="size-3.5" aria-hidden />
            <AppLinkPending />
          </span>
        </div>
      </AppLink>
    </li>
  );
}
