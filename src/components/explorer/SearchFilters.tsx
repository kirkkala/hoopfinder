"use client";

import { DISTANCE_OPTIONS, type DistanceFilter } from "@/lib/courts";

export type LocationStatus =
  | "idle"
  | "pending"
  | "granted"
  | "denied"
  | "unavailable";

export function SearchFilters({
  query,
  onQueryChange,
  distanceKm,
  onDistanceChange,
  locationStatus,
  onUseLocation,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  distanceKm: DistanceFilter;
  onDistanceChange: (value: DistanceFilter) => void;
  locationStatus: LocationStatus;
  onUseLocation: () => void;
}) {
  const nearMe = locationStatus === "granted";
  const locationLabel = {
    idle: "Near me",
    pending: "Locating…",
    granted: "Using you",
    denied: "Location blocked",
    unavailable: "No GPS",
  }[locationStatus];

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="sr-only">Search hoops</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search a court, city, or street"
          className="w-full rounded-2xl border border-white/10 bg-asphalt px-4 py-3 text-sm text-white outline-none ring-hnmky-red/40 placeholder:text-white/35 focus:ring-4"
        />
      </label>

      <div className="flex flex-wrap gap-1.5">
        {DISTANCE_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onDistanceChange(option)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              distanceKm === option
                ? "bg-hnmky-red text-white"
                : "bg-white/10 text-cream/80 hover:bg-white/15"
            } ${nearMe ? "" : "opacity-40"}`}
            disabled={!nearMe}
          >
            {option} km
          </button>
        ))}
        <button
          type="button"
          onClick={() => onDistanceChange("any")}
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            distanceKm === "any"
              ? "bg-gold text-asphalt"
              : "bg-white/10 text-cream/80 hover:bg-white/15"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={onUseLocation}
          disabled={locationStatus === "pending" || locationStatus === "granted"}
          className="rounded-full bg-hnmky-blue px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1d3480] disabled:cursor-default disabled:opacity-70"
        >
          {locationLabel}
        </button>
      </div>

      <p className="text-xs text-ink-muted">
        {nearMe
          ? "Distances are from where you are now."
          : "Showing outdoor courts across Finland. Tap Near me to sort and filter by distance."}
      </p>
    </div>
  );
}
