"use client";

import { X } from "lucide-react";
import { useCopy } from "@/components/brand/LocaleProvider";

/** City list starts here. */
export const COURT_LIST_ID = "court-list";
/** Set on the document from the search bar height, so a city anchor scrolls clear of the search. */
export const CITY_SEARCH_HEIGHT = "--city-search-height";

export function cityMatchesQuery(label: string, query: string): boolean {
  const needle = foldCityName(query);
  if (!needle) return true;
  return foldCityName(label).includes(needle);
}

function foldCityName(value: string) {
  return value.trim().toLocaleLowerCase("fi").normalize("NFD").replace(/\p{M}/gu, "");
}

export function CitySelect({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (query: string) => void;
}) {
  const copy = useCopy();
  return (
    <div>
      <label htmlFor="court-city" className="mb-2 block text-sm font-medium text-ink-muted sr-only">
        {copy.allCourtsCities}
      </label>
      <div className="relative">
        <input
          id="court-city"
          type="search"
          value={query}
          placeholder={copy.citySearchPlaceholder}
          onChange={(event) => onQueryChange(event.target.value)}
          className={`h-12 w-full rounded-2xl border border-white/25 bg-asphalt px-3 text-base text-white outline-none placeholder:text-white/55 focus:border-gold/50 focus:ring-2 focus:ring-gold/60 sm:text-sm [&::-webkit-search-cancel-button]:appearance-none ${
            query ? "pr-10" : ""
          }`}
        />
        {query ? (
          <button
            type="button"
            aria-label={copy.citySearchClear}
            onClick={() => onQueryChange("")}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-white/55 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
