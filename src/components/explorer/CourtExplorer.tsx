"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { basketball } from "@lucide/lab";
import { Icon } from "lucide-react";
import { AppHeader } from "@/components/brand/AppHeader";
import { AppFooter } from "@/components/brand/AppFooter";
import { CourtList } from "@/components/explorer/CourtList";
import { SearchFilters } from "@/components/explorer/SearchFilters";
import { useCopy } from "@/components/brand/LocaleProvider";
import {
  courtParam,
  withDistance,
  type CourtWithDistance,
  type ExplorerCourt,
} from "@/lib/courts";
import { isInBounds, type MapBounds } from "@/lib/geo";
import { mq, split, useMinWidth } from "@/lib/layout";
import { useLocationStatus } from "@/lib/origin";
import type { PlaceMatch } from "@/lib/places";
import type { FetchedAtBySource } from "@/lib/catalog";
import { fetchMapCourts } from "@/lib/map-courts";

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

function syncCourtUrl(path: string | null) {
  const url = new URL(window.location.href);
  if (path) {
    url.searchParams.set("court", path);
  } else {
    url.searchParams.delete("court");
  }
  url.searchParams.delete("thanks");
  if (url.href !== window.location.href) window.history.replaceState(null, "", url);
}

export function CourtExplorer({
  courtCount: totalCourtCount,
  fetchedAtBySource,
  focusId,
  thanks: thanksFromUrl = false,
}: {
  courtCount: number;
  fetchedAtBySource: FetchedAtBySource;
  focusId: string | null;
  thanks?: boolean;
}) {
  const copy = useCopy();
  const [thanks, setThanks] = useState(thanksFromUrl);
  const [courts, setCourts] = useState<ExplorerCourt[]>([]);
  const [query, setQuery] = useState("");
  const { origin, status: locationStatus, request } = useLocationStatus();
  const [locateSeq, setLocateSeq] = useState(0);
  const skipInitialOrigin = useRef(true);
  const [pickedId, setPickedId] = useState<string | null | undefined>(undefined);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [place, setPlace] = useState<PlaceMatch | null>(null);
  const placeBounds = place?.bounds ?? null;
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
    const controller = new AbortController();
    void fetchMapCourts(controller.signal)
      .then((loaded) => {
        if (!controller.signal.aborted) setCourts(loaded);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCourts([]);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (focusedId) writeSelectedCourt(focusedId);
  }, [focusedId]);

  useEffect(() => {
    if (skipInitialOrigin.current) {
      skipInitialOrigin.current = false;
      return;
    }
    if (origin) setLocateSeq((n) => n + 1);
  }, [origin]);

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
      setPlace(null);
      return;
    }

    setPlace(null);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(`/api/places?q=${encodeURIComponent(needle)}`, {
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error("place lookup failed");
          return response.json() as Promise<PlaceMatch | null>;
        })
        .then((match) => {
          if (!controller.signal.aborted) setPlace(match);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          if (error instanceof DOMException && error.name === "AbortError") return;
          setPlace(null);
        });
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function selectCourt(id: string) {
    setPickedId(id);
    setThanks(false);
    writeSelectedCourt(id);
    const court = courts.find((item) => item.id === id);
    if (!court) {
      syncCourtUrl(null);
      return;
    }
    syncCourtUrl(courtParam(court));
  }

  function clearCourt() {
    setPickedId(null);
    setThanks(false);
    clearSelectedCourt();
    syncCourtUrl(null);
  }

  function requestLocation() {
    setQuery("");
    setPlace(null);
    clearCourt();

    if (origin && locationStatus === "granted") {
      setLocateSeq((n) => n + 1);
      return;
    }

    request();
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden overscroll-none bg-asphalt">
      <AppHeader
        home
        fetchedAtBySource={fetchedAtBySource}
        courtCount={totalCourtCount}
      />

      <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${split.row}`}>
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
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3">
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
              focusBounds={place?.camera ?? null}
              keepCamera={keepCamera}
              onSelect={selectCourt}
              onClose={clearCourt}
              onBoundsChange={setMapBounds}
              thanks={thanks}
            />
          </div>
        </section>
      </div>

      <AppFooter collapsible />
    </div>
  );
}
