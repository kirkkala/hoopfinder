"use client";

import { useLayoutEffect, useRef } from "react";
import { AppFooter } from "@/components/brand/AppFooter";
import { AppHeader } from "@/components/brand/AppHeader";
import { useCopy } from "@/components/brand/LocaleProvider";
import { CITY_SEARCH_HEIGHT, CitySelect, COURT_LIST_ID } from "@/components/court/CitySelect";
import type { FetchedAtBySource } from "@/lib/catalog";
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
      <AppHeader courtCount={courtCount} fetchedAtBySource={fetchedAtBySource} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <h1 className="font-display text-4xl tracking-wide text-white">{copy.allCourts}</h1>
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
                {group.city ?? copy.cityUnknown}
              </h2>
              <ul className="mt-1">
                {group.courts.map((court) => (
                  <li key={court.href} className="border-b border-white/10">
                    <a
                      href={court.href}
                      className="block rounded-sm py-2.5 text-white outline-none hover:text-gold focus-visible:ring-2 focus-visible:ring-gold/60"
                    >
                      {copy.locale === "en" ? court.name : court.nameFi}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <AppFooter hideCourtIndex />
    </div>
  );
}
