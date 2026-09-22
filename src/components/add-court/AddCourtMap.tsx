"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MapPin } from "lucide-react";
import { setWorkerUrl, type Offset } from "maplibre-gl";
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import { MAP_STYLE } from "@/lib/constants";
import { useCopy } from "@/components/brand/LocaleProvider";
import { courtTitle, isPendingCourt, isTooCloseToCourt, type ExplorerCourt } from "@/lib/courts";
import { isInFinland } from "@/lib/sources/finland";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  boundsFromCoordinates,
  type Coordinates,
} from "@/lib/geo";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const MAP_VIEW_KEY = "hoopfinder-map-view";

/** Neighborhood zoom so a pin can land on a park, not a city. */
const ADD_COURT_MIN_ZOOM = 15;

/** OpenFreeMap Liberty fill for seas, lakes, and wide rivers. */
const WATER_LAYER = "water";

/** Pin is 36px tall; extra bottom offset keeps the chip off the marker. */
const CONFIRM_OFFSET: Offset = {
  center: [0, 0],
  top: [0, 0],
  "top-left": [0, 0],
  "top-right": [0, 0],
  bottom: [0, -28],
  "bottom-left": [0, -28],
  "bottom-right": [0, -28],
  left: [8, -18],
  right: [-8, -18],
};

export type AddCourtMapAlert = "zoom" | "too-close" | "outside-finland" | "on-water";

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
    // First visit — fit all courts.
  }
  return null;
}

export function AddCourtMap({
  courts,
  origin,
  locateSeq,
  draft,
  confirm,
  onPlace,
  onAlert,
  onCanPlaceChange,
}: {
  courts: ExplorerCourt[];
  origin: Coordinates | null;
  locateSeq: number;
  draft: Coordinates | null;
  confirm?: ReactNode;
  onPlace: (coords: Coordinates) => void;
  onAlert: (kind: AddCourtMapAlert) => void;
  onCanPlaceChange: (canPlace: boolean) => void;
}) {
  const copy = useCopy();
  const mapRef = useRef<MapRef>(null);
  const canPlaceRef = useRef<boolean | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [{ view: initialView, restored }] = useState(() => {
    const saved = readSavedView();
    return {
      view:
        saved ?? {
          latitude: DEFAULT_MAP_CENTER.lat,
          longitude: DEFAULT_MAP_CENTER.lon,
          zoom: DEFAULT_MAP_ZOOM,
        },
      restored: saved !== null,
    };
  });

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
    if (!mapReady || locateSeq === 0 || !origin) return;
    mapRef.current?.flyTo({
      center: [origin.lon, origin.lat],
      zoom: ADD_COURT_MIN_ZOOM,
      duration: 700,
    });
  }, [locateSeq, mapReady, origin]);

  useEffect(() => {
    if (!mapReady || restored) return;
    const bounds = boundsFromCoordinates(courts);
    if (!bounds) return;
    mapRef.current?.fitBounds(
      [
        [bounds.west, bounds.south],
        [bounds.east, bounds.north],
      ],
      { padding: 48, duration: 0 },
    );
  }, [courts.length, mapReady, restored]);

  function syncPlaceMode(zoom: number) {
    const canPlace = zoom >= ADD_COURT_MIN_ZOOM;
    const canvas = mapRef.current?.getCanvas();
    if (canvas) canvas.style.cursor = canPlace ? "crosshair" : "";
    if (canPlaceRef.current === canPlace) return;
    canPlaceRef.current = canPlace;
    onCanPlaceChange(canPlace);
  }

  function handleClick(event: MapLayerMouseEvent) {
    const zoom = event.target.getZoom();
    if (zoom < ADD_COURT_MIN_ZOOM) {
      onAlert("zoom");
      return;
    }
    const point = { lat: event.lngLat.lat, lon: event.lngLat.lng };
    if (!isInFinland(point.lat, point.lon)) {
      onAlert("outside-finland");
      return;
    }
    if (clickIsOnWater(event)) {
      onAlert("on-water");
      return;
    }
    if (isTooCloseToCourt(point, courts)) {
      onAlert("too-close");
      return;
    }
    onPlace(point);
  }

  return (
    <Map
      ref={mapRef}
      mapStyle={MAP_STYLE}
      initialViewState={initialView}
      style={{ width: "100%", height: "100%" }}
      onLoad={(event) => {
        setMapReady(true);
        syncPlaceMode(event.target.getZoom());
      }}
      onMove={(event) => {
        syncPlaceMode(event.viewState.zoom);
      }}
      onClick={handleClick}
      attributionControl={{ compact: true }}
    >
      <NavigationControl position="top-right" />
      <Source id="add-courts" type="geojson" data={data}>
        <Layer
          id="add-court-points"
          type="circle"
          paint={{
            "circle-color": [
              "case",
              ["==", ["to-number", ["get", "pending"]], 1],
              "#ffd482",
              "#ff4339",
            ],
            "circle-radius": 7,
            "circle-stroke-width": 2,
            "circle-stroke-color": [
              "case",
              ["==", ["to-number", ["get", "pending"]], 1],
              "#111111",
              "#ffffff",
            ],
          }}
        />
        <Layer
          id="add-court-labels"
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
            "text-color": "#1a1a1a",
            "text-halo-color": "#ffffff",
            "text-halo-width": 1.25,
          }}
        />
      </Source>

      {origin ? (
        <Marker latitude={origin.lat} longitude={origin.lon} anchor="center">
          <span className="block h-3.5 w-3.5 rounded-full bg-blue-800 ring-4 ring-blue-800/40" />
        </Marker>
      ) : null}

      {draft ? (
        <Marker latitude={draft.lat} longitude={draft.lon} anchor="bottom">
          <MapPin className="size-9 fill-gold text-asphalt drop-shadow-lg" aria-hidden />
        </Marker>
      ) : null}

      {draft && confirm ? (
        <Popup
          latitude={draft.lat}
          longitude={draft.lon}
          closeButton={false}
          closeOnClick={false}
          focusAfterOpen={false}
          offset={CONFIRM_OFFSET}
          maxWidth="none"
          padding={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {confirm}
        </Popup>
      ) : null}
    </Map>
  );
}

function clickIsOnWater(event: MapLayerMouseEvent): boolean {
  const map = event.target;
  if (!map.getLayer(WATER_LAYER)) return false;
  return map.queryRenderedFeatures(event.point, { layers: [WATER_LAYER] }).length > 0;
}
