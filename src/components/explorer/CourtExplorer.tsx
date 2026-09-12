"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { basketball } from "@lucide/lab";
import { Icon } from "lucide-react";
import { AppHeader } from "@/components/brand/AppHeader";
import { AppFooter } from "@/components/brand/AppFooter";
import { CourtList } from "@/components/explorer/CourtList";
import {
  SearchFilters,
  type LocationStatus,
} from "@/components/explorer/SearchFilters";
import {
  filterCourts,
  type Court,
  type DistanceFilter,
} from "@/lib/courts";
import type { Coordinates } from "@/lib/geo";

const CourtMap = dynamic(
  () => import("@/components/explorer/CourtMap").then((mod) => mod.CourtMap),
  { ssr: false },
);

export function CourtExplorer({ courts }: { courts: Court[] }) {
  const [query, setQuery] = useState("");
  const [distanceKm, setDistanceKm] = useState<DistanceFilter>("any");
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const nearMe = locationStatus === "granted";
  const visibleCourts = useMemo(
    () => filterCourts(courts, query, distanceKm, origin),
    [courts, query, distanceKm, origin],
  );

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }

    setLocationStatus("pending");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-asphalt">
      <AppHeader />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="flex max-h-[48vh] min-h-0 w-full flex-col border-b border-white/10 bg-panel lg:max-h-none lg:w-[26rem] lg:border-r lg:border-b-0">
          <div className="border-b border-white/10 p-4">
            <SearchFilters
              query={query}
              onQueryChange={setQuery}
              distanceKm={distanceKm}
              onDistanceChange={setDistanceKm}
              locationStatus={locationStatus}
              onUseLocation={requestLocation}
            />
            <p className="mt-3 flex items-center gap-2 font-display text-lg tracking-wide text-gold">
              <Icon iconNode={basketball} className="size-5 shrink-0" aria-hidden />
              {`${visibleCourts.length} hoop${visibleCourts.length === 1 ? "" : "s"}${nearMe && distanceKm !== "any" ? " nearby" : " in Finland"}`}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3">
            <CourtList
              courts={visibleCourts}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        </aside>

        <section className="relative min-h-[52vh] flex-1 bg-asphalt">
          <div className="absolute inset-0">
            <CourtMap
              courts={visibleCourts}
              selectedId={selectedId}
              origin={origin}
              followUser={nearMe && distanceKm === "any"}
              onSelect={setSelectedId}
            />
          </div>
        </section>
      </div>

      <AppFooter />
    </div>
  );
}
