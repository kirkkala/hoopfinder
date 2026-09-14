"use client";

import {
  LoaderCircle,
  Locate,
  LocateFixed,
  LocateOff,
  Search,
} from "lucide-react";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { LocationStatus } from "@/lib/origin";

const LOCATION_ICON = {
  idle: Locate,
  pending: LoaderCircle,
  granted: LocateFixed,
  denied: LocateOff,
  unavailable: LocateOff,
} as const;

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
  const LocationIcon = LOCATION_ICON[locationStatus];

  return (
    <div className="space-y-3">
      <p className="hidden text-sm text-ink-muted sm:block">
        {copy.searchInstructions}
      </p>
      <label className="relative block">
        <span className="sr-only">{copy.searchLabel}</span>
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-white/35"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={copy.searchPlaceholder}
          className="w-full rounded-2xl border border-white/10 bg-asphalt py-3 pr-4 pl-11 text-sm text-white outline-none placeholder:text-white/35 focus:ring-4"
        />
      </label>

      <button
        type="button"
        onClick={onUseLocation}
        disabled={locationStatus === "pending"}
        className="inline-flex items-center gap-1.5 rounded-full bg-blue-800 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-900 disabled:cursor-default disabled:opacity-70"
      >
        <LocationIcon
          aria-hidden
          className={`size-3.5 ${locationStatus === "pending" ? "animate-spin" : ""}`}
        />
        {copy.nearMe[locationStatus]}
      </button>
    </div>
  );
}
