"use client";

import { X } from "lucide-react";
import { useCopy } from "@/components/brand/LocaleProvider";
import { searchText } from "@/lib/courts";

/** City list starts here. */
export const COURT_LIST_ID = "court-list";
/** Set on the document from the search bar height, so a city anchor scrolls clear of the search. */
export const CITY_SEARCH_HEIGHT = "--city-search-height";

export function cityMatchesQuery(label: string, query: string): boolean {
  const needle = searchText(query);
  if (!needle) return true;
  return searchText(label).includes(needle);
}

export function SearchBox({
  id,
  label,
  placeholder,
  query,
  onQueryChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  query: string;
  onQueryChange: (query: string) => void;
}) {
  const copy = useCopy();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink-muted sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="search"
          value={query}
          placeholder={placeholder}
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

export function CitySelect({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (query: string) => void;
}) {
  const copy = useCopy();
  return (
    <SearchBox
      id="court-city"
      label={copy.allCourtsCities}
      placeholder={copy.citySearchPlaceholder}
      query={query}
      onQueryChange={onQueryChange}
    />
  );
}
