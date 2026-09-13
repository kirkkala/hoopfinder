"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
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
import { useCopy } from "@/components/brand/LocaleProvider";
import {
  withDistance,
  type Court,
  type CourtWithDistance,
} from "@/lib/courts";
import { isInBounds, type Coordinates, type MapBounds } from "@/lib/geo";
import { mq, split, useMinWidth } from "@/lib/layout";

const CourtMap = dynamic(
  () => import("@/components/explorer/CourtMap").then((mod) => mod.CourtMap),
  { ssr: false },
);

const SELECTED_COURT_KEY = "hoopfinder-selected-court";
const EMPTY_COURTS: CourtWithDistance[] = [];

function isInCurrentView(
  court: CourtWithDistance,
  searching: boolean,
  placeBounds: MapBounds | null,
  mapBounds: MapBounds | null,
) {
  if (searching) return placeBounds !== null && isInBounds(court, placeBounds);
  return mapBounds === null || isInBounds(court, mapBounds);
}

function readSelectedCourt(): string | null {
  try {
    return localStorage.getItem(SELECTED_COURT_KEY);
  } catch {
    return null;
  }
}

function writeSelectedCourt(id: string) {
  try {
    localStorage.setItem(SELECTED_COURT_KEY, id);
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function clearSelectedCourt() {
  try {
    localStorage.removeItem(SELECTED_COURT_KEY);
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function subscribeSelectedCourt() {
  return () => {};
}

export function CourtExplorer({
  courts,
  fetchedAt,
  focusId,
}: {
  courts: Court[];
  fetchedAt: string | null;
  focusId: string | null;
}) {
  const copy = useCopy();
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [locateSeq, setLocateSeq] = useState(0);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [pickedId, setPickedId] = useState<string | null | undefined>(undefined);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [placeBounds, setPlaceBounds] = useState<MapBounds | null>(null);
  const showList = useMinWidth(mq.split);
  const savedId = useSyncExternalStore(
    subscribeSelectedCourt,
    readSelectedCourt,
    () => null,
  );
  const restoredId =
    savedId && courts.some((court) => court.id === savedId) ? savedId : null;
  const focusedId =
    focusId && courts.some((court) => court.id === focusId) ? focusId : null;
  const selectedId = pickedId === undefined ? (focusedId ?? restoredId) : pickedId;
  const keepCamera = pickedId === undefined && restoredId !== null && !focusedId;

  useEffect(() => {
    if (focusedId) writeSelectedCourt(focusedId);
  }, [focusedId]);

  const searching = query.trim().length >= 2;
  const visibleCourts = useMemo(
    () => withDistance(courts, origin),
    [courts, origin],
  );
  const courtsInView = useMemo(() => {
    if (!showList) return EMPTY_COURTS;
    return visibleCourts.filter((court) =>
      isInCurrentView(court, searching, placeBounds, mapBounds),
    );
  }, [mapBounds, placeBounds, searching, showList, visibleCourts]);
  const courtCount = useMemo(() => {
    if (showList) return courtsInView.length;
    let count = 0;
    for (const court of visibleCourts) {
      if (isInCurrentView(court, searching, placeBounds, mapBounds)) count += 1;
    }
    return count;
  }, [courtsInView, mapBounds, placeBounds, searching, showList, visibleCourts]);

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 2) {
      setPlaceBounds(null);
      return;
    }

    setPlaceBounds(null);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(`/api/places?q=${encodeURIComponent(needle)}`, {
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error("place lookup failed");
          return response.json() as Promise<MapBounds | null>;
        })
        .then((bounds) => {
          if (!controller.signal.aborted) setPlaceBounds(bounds);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          if (error instanceof DOMException && error.name === "AbortError") return;
          setPlaceBounds(null);
        });
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function selectCourt(id: string) {
    setPickedId(id);
    writeSelectedCourt(id);
  }

  function clearCourt() {
    setPickedId(null);
    clearSelectedCourt();
  }

  function requestLocation() {
    setQuery("");
    setPlaceBounds(null);
    clearCourt();

    if (origin && locationStatus === "granted") {
      setLocateSeq((n) => n + 1);
      return;
    }

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
        setLocateSeq((n) => n + 1);
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-asphalt">
      <AppHeader fetchedAt={fetchedAt} />

      <div className={`flex min-h-0 flex-1 flex-col ${split.row}`}>
        <aside className={`flex w-full shrink-0 flex-col border-b border-white/10 bg-panel ${split.aside}`}>
          <div className={`p-3 sm:p-4 ${split.paneBorder}`}>
            <SearchFilters
              query={query}
              onQueryChange={(value) => {
                setQuery(value);
                clearCourt();
              }}
              locationStatus={locationStatus}
              onUseLocation={requestLocation}
            />
            <p className="mt-3 flex items-center gap-2 font-display text-lg tracking-wide text-gold">
              <Icon iconNode={basketball} className="size-5 shrink-0" aria-hidden />
              {copy.courtCount(courtCount)}
            </p>
          </div>

          {showList ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-3">
              <CourtList
                courts={courtsInView}
                selectedId={selectedId}
                onSelect={selectCourt}
              />
            </div>
          ) : null}
        </aside>

        <section className="relative min-h-0 flex-1 bg-asphalt">
          <div className="absolute inset-0">
            <CourtMap
              courts={visibleCourts}
              selectedId={selectedId}
              origin={origin}
              locateSeq={locateSeq}
              focusBounds={placeBounds}
              keepCamera={keepCamera}
              onSelect={selectCourt}
              onClose={clearCourt}
              onBoundsChange={setMapBounds}
            />
          </div>
        </section>
      </div>

      <AppFooter />
    </div>
  );
}
