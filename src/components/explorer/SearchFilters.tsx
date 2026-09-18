"use client";

import { Search } from "lucide-react";
import { useCopy } from "@/components/brand/LocaleProvider";
import { LocateMeButton, locationHint } from "@/components/LocateMeButton";
import type { LocationStatus } from "@/lib/origin";

export function SearchFilters({
  query,
  onQueryChange,
  locationStatus,
  onUseLocation,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  locationStatus: LocationStatus;
  onUseLocation: () => void;
}) {
  const copy = useCopy();
  const hint = locationHint(copy, locationStatus);

  return (
    <div className="space-y-3">
      <p className="hidden text-sm text-ink-muted sm:block">
        {copy.searchInstructions}
      </p>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-3">
        <label className="relative min-w-0 sm:col-span-2">
          <span className="sr-only">{copy.searchLabel}</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/55"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="h-12 w-full appearance-none rounded-2xl border border-white/25 bg-asphalt pr-4 pl-11 text-base text-white outline-none placeholder:text-white/55 focus:border-gold/50 focus:ring-2 focus:ring-gold/60 sm:text-sm"
          />
        </label>

        <LocateMeButton
          compact
          status={locationStatus}
          onClick={onUseLocation}
        />

        {hint ? (
          <p className="col-span-2 min-w-0 text-sm text-ink-muted sm:col-span-1">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
