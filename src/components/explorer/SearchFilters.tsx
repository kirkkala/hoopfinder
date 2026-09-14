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
  const locationHint =
    locationStatus === "denied"
      ? copy.locationBlockedHelp
      : locationStatus === "idle" || locationStatus === "unavailable"
        ? copy.locateToSeeDistance
        : null;

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

        <button
          type="button"
          onClick={onUseLocation}
          disabled={locationStatus === "pending"}
          aria-label={copy.nearMe[locationStatus]}
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-800 text-white hover:bg-blue-900 disabled:cursor-default disabled:opacity-70 sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm sm:font-bold"
        >
          <LocationIcon
            aria-hidden
            className={`size-5 sm:size-3.5 ${locationStatus === "pending" ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">
            {copy.nearMe[locationStatus]}
          </span>
        </button>

        {locationHint ? (
          <p className="col-span-2 min-w-0 text-sm text-ink-muted sm:col-span-1">
            {locationHint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
