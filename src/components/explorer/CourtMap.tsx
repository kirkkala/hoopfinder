"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppLink } from "@/components/brand/AppLink";
import { ArrowRight, X } from "lucide-react";
import {
  LngLatBounds,
  setWorkerUrl,
  type ExpressionSpecification,
} from "maplibre-gl";
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import { useIsAdmin } from "@/components/admin/AdminProvider";
import { MAP_STYLE } from "@/lib/constants";
import { useCopy } from "@/components/brand/LocaleProvider";
import { CourtBadges } from "@/components/explorer/CourtBadges";
import { CourtHeading } from "@/components/explorer/CourtHeading";
import { PendingCourtNote } from "@/components/explorer/PendingCourtNote";
import {
  courtHref,
  courtTitle,
  isAwaitingEmail,
  isPendingCourt,
  type CourtWithDistance,
} from "@/lib/courts";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  NEAR_ME_ZOOM,
  boundsFromCoordinates,
  type Coordinates,
  type MapBounds,
} from "@/lib/geo";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const MAP_VIEW_KEY = "hoopfinder-map-view";
const CLICKABLE_LAYERS = ["court-points", "court-labels"];
const HOVER: ExpressionSpecification = [
  "boolean",
  ["feature-state", "hover"],
  false,
];

function readSavedView(): { latitude: number; longitude: number; zoom: number } | null {
  try {
    const saved = JSON.parse(localStorage.getItem(MAP_VIEW_KEY) ?? "");
    if (
      Number.isFinite(saved.lat) &&
      Number.isFinite(saved.lon) &&
      Number.isFinite(saved.zoom)
    ) {
      return { latitude: saved.lat, longitude: saved.lon, zoom: saved.zoom };
    }
  } catch {
    // First visit, private mode, or a bad value — fit all courts.
  }
  return null;
}

function defaultView() {
  return {
    latitude: DEFAULT_MAP_CENTER.lat,
    longitude: DEFAULT_MAP_CENTER.lon,
    zoom: DEFAULT_MAP_ZOOM,
  };
}

function boundsFromMap(map: { getBounds: () => LngLatBounds }): MapBounds {
  const bounds = map.getBounds();
  const southWest = bounds.getSouthWest();
  const northEast = bounds.getNorthEast();
  return {
    west: southWest.lng,
    south: southWest.lat,
    east: northEast.lng,
    north: northEast.lat,
  };
}

function saveView(latitude: number, longitude: number, zoom: number) {
  try {
    localStorage.setItem(
      MAP_VIEW_KEY,
      JSON.stringify({ lat: latitude, lon: longitude, zoom }),
    );
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function CourtMap({
  courts,
  selectedId,
  origin,
  locateSeq,
  focusBounds,
  keepCamera,
  onSelect,
  onClose,
  onBoundsChange,
  thanks = false,
}: {
  courts: CourtWithDistance[];
  selectedId: string | null;
  origin: Coordinates | null;
  locateSeq: number;
  focusBounds: MapBounds | null;
  keepCamera: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
  onBoundsChange: (bounds: MapBounds) => void;
  thanks?: boolean;
}) {
  const copy = useCopy();
  const isAdmin = useIsAdmin();
  const mapRef = useRef<MapRef>(null);
  const [mapReady, setMapReady] = useState(false);
  const restoredView = useRef(false);
  const [initialView] = useState(() => {
    const saved = readSavedView();
    restoredView.current = saved !== null;
    return saved ?? defaultView();
  });
  const pointerId = useRef<string | null>(null);
  const paintedIds = useRef(new Set<string>());
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const selected = courts.find((court) => court.id === selectedId) ?? null;

  const data = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: courts.map((court) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [court.lon, court.lat] as [number, number],
        },
        properties: {
          id: court.id,
          name: courtTitle(court, copy),
          pending: isPendingCourt(court) ? 1 : 0,
        },
      })),
    }),
    [courts, copy],
  );

  useEffect(() => {
    if (!mapReady || locateSeq === 0 || !origin) {
      return;
    }

    mapRef.current?.flyTo({
      center: [origin.lon, origin.lat],
      zoom: NEAR_ME_ZOOM,
      duration: 700,
    });
  }, [locateSeq, mapReady, origin]);

  useEffect(() => {
    if (!mapReady || restoredView.current || selectedRef.current) return;
    const bounds = boundsFromCoordinates(courts);
    if (!bounds) return;
    mapRef.current?.fitBounds(
      [
        [bounds.west, bounds.south],
        [bounds.east, bounds.north],
      ],
      { padding: 48, duration: 0 },
    );
  }, [courts.length, mapReady]);

  useEffect(() => {
    if (!mapReady || selected || !focusBounds) {
      return;
    }

    mapRef.current?.fitBounds(
      [
        [focusBounds.west, focusBounds.south],
        [focusBounds.east, focusBounds.north],
      ],
      { padding: 48, maxZoom: 15, duration: 700 },
    );
  }, [focusBounds, mapReady, selected]);

  useEffect(() => {
    if (!mapReady || !selected || keepCamera) {
      return;
    }
    mapRef.current?.flyTo({
      center: [selected.lon, selected.lat],
      zoom: Math.max(mapRef.current.getZoom(), 15),
      duration: 700,
    });
  }, [keepCamera, mapReady, selected]);

  function paintHover() {
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !map.getSource("courts")) return;
    const next = new Set<string>();
    if (pointerId.current) next.add(pointerId.current);
    if (selectedRef.current) next.add(selectedRef.current);
    for (const id of paintedIds.current) {
      if (!next.has(id)) {
        map.setFeatureState({ source: "courts", id }, { hover: false });
      }
    }
    for (const id of next) {
      if (!paintedIds.current.has(id)) {
        map.setFeatureState({ source: "courts", id }, { hover: true });
      }
    }
    paintedIds.current = next;
  }

  useEffect(() => {
    if (mapReady) paintHover();
  }, [mapReady, selectedId]);

  useEffect(() => {
    if (!selectedId) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onCloseRef.current();
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".maplibregl-popup")) return;
      if (target.closest(".maplibregl-canvas-container")) return;
      if (target.closest(".maplibregl-ctrl")) return;
      onCloseRef.current();
    }

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [selectedId]);

  function setCursor(cursor: string) {
    const canvas = mapRef.current?.getCanvas();
    if (canvas) canvas.style.cursor = cursor;
  }

  function handleMouseMove(event: MapLayerMouseEvent) {
    const feature = event.features?.[0];
    setCursor(feature ? "pointer" : "");
    const id = feature ? String(feature.properties?.id ?? "") : "";
    pointerId.current = id || null;
    paintHover();
  }

  function handleClick(event: MapLayerMouseEvent) {
    const feature = event.features?.[0];
    if (!feature || feature.geometry.type !== "Point") {
      if (selectedRef.current) onClose();
      return;
    }

    const id = feature.properties?.id;
    if (id != null && String(id)) {
      selectedRef.current = String(id);
      pointerId.current = String(id);
      paintHover();
      onSelect(String(id));
    }
  }

  return (
    <Map
      ref={mapRef}
      mapStyle={MAP_STYLE}
      initialViewState={initialView}
      style={{ width: "100%", height: "100%" }}
      interactiveLayerIds={CLICKABLE_LAYERS}
      onLoad={(event) => {
        setMapReady(true);
        onBoundsChange(boundsFromMap(event.target));
      }}
      onMoveEnd={(event) => {
        const { latitude, longitude, zoom } = event.viewState;
        saveView(latitude, longitude, zoom);
        onBoundsChange(boundsFromMap(event.target));
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setCursor("");
        pointerId.current = null;
        paintHover();
      }}
      onClick={handleClick}
      attributionControl={{ compact: true }}
    >
      <NavigationControl position="top-right" />
      <Source id="courts" type="geojson" data={data} promoteId="id">
        <Layer
          id="court-points"
          type="circle"
          paint={{
            "circle-color": [
              "case",
              ["==", ["to-number", ["get", "pending"]], 1],
              "#ffd482",
              "#ff4339",
            ],
            "circle-radius": ["case", HOVER, 9, 8],
            "circle-stroke-width": ["case", HOVER, 2.5, 2],
            "circle-stroke-color": [
              "case",
              ["==", ["to-number", ["get", "pending"]], 1],
              "#111111",
              "#ffffff",
            ],
          }}
        />
        <Layer
          id="court-labels"
          type="symbol"
          minzoom={12}
          layout={{
            "text-field": ["get", "name"],
            "text-font": ["Noto Sans Regular"],
            "text-size": 12,
            "text-variable-anchor": ["left", "right", "top", "bottom"],
            "text-radial-offset": 1,
            "text-max-width": 8,
            "text-optional": true,
            "text-padding": 4,
          }}
          paint={{
            "text-color": ["case", HOVER, "#111111", "#1a1a1a"],
            "text-halo-color": "#ffffff",
            "text-halo-width": ["case", HOVER, 2.5, 1.25],
            "text-halo-blur": ["case", HOVER, 0.8, 0],
          }}
        />
      </Source>

      {origin ? (
        <Marker latitude={origin.lat} longitude={origin.lon} anchor="center">
          <span className="block h-3.5 w-3.5 rounded-full bg-blue-800 ring-4 ring-blue-800/40" />
        </Marker>
      ) : null}

      {selected ? (
        <Popup
          latitude={selected.lat}
          longitude={selected.lon}
          anchor="bottom"
          offset={16}
          closeButton={false}
          closeOnClick={false}
          maxWidth="18rem"
          onClose={onClose}
        >
          <div className="relative flex min-w-64 flex-col gap-2 p-3">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-2 right-2 rounded-full p-1 text-ink-muted hover:bg-white/10 hover:text-white"
              aria-label={copy.close}
            >
              <X className="size-4" aria-hidden />
            </button>
            <CourtHeading court={selected} pin className="pr-6" />
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <CourtBadges court={selected} />
            </div>
            {thanks && isPendingCourt(selected) ? (
              <div className="pt-1">
                <p className="text-sm font-bold leading-5 text-ink/90">
                  {copy.addCourtSuccessLead}
                </p>
                <p className="mt-1 text-sm leading-5 text-ink-muted">
                  {copy.addCourtSuccess}
                </p>
              </div>
            ) : isPendingCourt(selected) ? (
              <PendingCourtNote createdAt={selected.createdAt} className="pt-1" />
            ) : null}
            {!thanks && (!isAwaitingEmail(selected) || isAdmin) ? (
              <AppLink
                href={courtHref(selected)}
                className="inline-flex items-center gap-1 self-end pt-2 pb-1 text-sm font-bold text-gold hover:text-white"
              >
                {copy.letsGo}
                <ArrowRight className="size-3.5" aria-hidden />
              </AppLink>
            ) : null}
          </div>
        </Popup>
      ) : null}
    </Map>
  );
}
