"use client";

import { ArrowRight } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { AppFooter } from "@/components/brand/AppFooter";
import { AppHeader } from "@/components/brand/AppHeader";
import { AppLink, AppLinkPending } from "@/components/brand/AppLink";
import { useCopy } from "@/components/brand/LocaleProvider";
import { ViewJump } from "@/components/brand/ViewJump";
import { CITY_SEARCH_HEIGHT, CitySelect, COURT_LIST_ID } from "@/components/court/CitySelect";
import { CourtBadges } from "@/components/explorer/CourtBadges";
import { CourtHeading } from "@/components/explorer/CourtHeading";
import type { FetchedAtBySource } from "@/lib/catalog";
import { MAP_PATH } from "@/lib/constants";
import type { CourtIndexGroup } from "@/lib/court-index";

const searchHeight = `var(${CITY_SEARCH_HEIGHT}, 0px)`;
/** Header offset is already in the page scroll padding. Sticky `top` still includes it. */
const stuckBelowSearch = `calc(var(--app-header-bottom, 3.5rem) + ${searchHeight})`;

export function CourtIndexView({
  groups,
  courtCount,
  fetchedAtBySource,
}: {
  groups: CourtIndexGroup[];
  courtCount: number;
  fetchedAtBySource: FetchedAtBySource;
}) {
  const copy = useCopy();
  const searchRef = useRef<HTMLDivElement>(null);

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
        <ViewJump href={MAP_PATH} direction="to-map">
          {copy.courtsOnMap}
        </ViewJump>
        <h1 className="mt-4 font-display text-4xl tracking-wide text-white">
          {copy.allCourtsHeading}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">
          {copy.listedCourtCount(courtCount)}
        </p>
        <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">{copy.allCourtsLead}</p>
        <div
          ref={searchRef}
          className="sticky top-[var(--app-header-bottom,3.5rem)] z-30 -mx-4 mt-6 border-b border-white/10 bg-asphalt px-4 py-3 sm:-mx-6 sm:px-6"
        >
          <CitySelect groups={groups} />
        </div>
        <div
          id={COURT_LIST_ID}
          className="mt-8 space-y-8"
          style={{ scrollMarginTop: searchHeight }}
        >
          {groups.map((group) => (
            <section key={group.anchor} id={group.anchor} style={{ scrollMarginTop: searchHeight }}>
              <h2
                className="sticky z-20 -mx-4 border-b border-white/10 bg-asphalt px-4 py-2 font-display text-2xl tracking-wide text-gold sm:-mx-6 sm:px-6"
                style={{ top: stuckBelowSearch }}
              >
                {group.city ?? copy.cityUnknown}{" "}
                <span className="inline-block font-sans text-sm font-medium leading-none tracking-normal text-ink-muted">
                  {`(${copy.cityCourtCount(group.courts.length)})`}
                </span>
              </h2>
              <ul className="mt-3 space-y-2">
                {group.courts.map((court) => (
                  <li key={court.href}>
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
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
