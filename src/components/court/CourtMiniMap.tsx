"use client";

import { type ExpressionSpecification, setWorkerUrl } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import MapView, {
  Layer,
  type MapLayerMouseEvent,
  type MapRef,
  NavigationControl,
  Popup,
  Source,
} from "react-map-gl/maplibre";
import { useCopy } from "@/components/brand/LocaleProvider";
import { CourtMiniPopup } from "@/components/court/CourtMiniPopup";
import { MAP_STYLE } from "@/lib/constants";
import { type Court, courtMapLabel, type ExplorerCourt, isPendingCourt } from "@/lib/courts";
import { fetchMapCourts } from "@/lib/map-courts";
import { currentPinId, pinsForMiniMap } from "@/lib/mini-map";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const CLICKABLE_LAYERS = ["court-points", "court-labels"];
const HERE: ExpressionSpecification = ["==", ["to-number", ["get", "current"]], 1];
const PENDING: ExpressionSpecification = ["==", ["to-number", ["get", "pending"]], 1];

export function CourtMiniMap({ court }: { court: Court }) {
  const copy = useCopy();
  const mapRef = useRef<MapRef>(null);
  const [catalog, setCatalog] = useState<ExplorerCourt[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pins = useMemo(() => pinsForMiniMap(court, catalog), [court, catalog]);
  const currentId = currentPinId(court, pins);
  const selected = pins.find((pin) => pin.id === selectedId) ?? null;

  const data = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: pins.map((pin) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [pin.lon, pin.lat] as [number, number],
        },
        properties: {
          id: pin.id,
          name: courtMapLabel(pin, copy),
          pending: isPendingCourt(pin) ? 1 : 0,
          current: pin.id === currentId ? 1 : 0,
        },
      })),
    }),
    [pins, copy, currentId],
  );

  useEffect(() => {
    // After the map is on screen. The court page itself only ships this one court.
    const controller = new AbortController();
    void fetchMapCourts(controller.signal)
      .then((courts) => {
        if (!controller.signal.aborted) setCatalog(courts);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (selectedId && !pins.some((pin) => pin.id === selectedId)) setSelectedId(null);
  }, [pins, selectedId]);

  useEffect(() => {
    if (!selectedId) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setSelectedId(null);
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".maplibregl-popup")) return;
      if (target.closest(".maplibregl-canvas-container")) return;
      if (target.closest(".maplibregl-ctrl")) return;
      setSelectedId(null);
    }

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [selectedId]);

  function handleMouseMove(event: MapLayerMouseEvent) {
    const canvas = mapRef.current?.getCanvas();
    if (canvas) canvas.style.cursor = event.features?.[0] ? "pointer" : "";
  }

  function handleClick(event: MapLayerMouseEvent) {
    const feature = event.features?.[0];
    // This check narrows feature to a point. Optional chaining would leave it nullable below.
    // biome-ignore lint/complexity/useOptionalChain: keep the point geometry narrowed
    if (!feature || feature.geometry.type !== "Point") {
      setSelectedId(null);
      return;
    }

    const id = String(feature.properties?.id ?? "");
    const pin = id === currentId ? undefined : pins.find((item) => item.id === id);
    if (!pin) {
      setSelectedId(null);
      return;
    }
    setSelectedId(id);
    mapRef.current?.easeTo({ center: [pin.lon, pin.lat], duration: 400 });
  }

  return (
    <div className="relative mt-2 h-80 overflow-hidden rounded-xl">
      <MapView
        ref={mapRef}
        mapStyle={MAP_STYLE}
        initialViewState={{
          latitude: court.lat,
          longitude: court.lon,
          zoom: 14.5,
        }}
        style={{ width: "100%", height: "100%" }}
        interactiveLayerIds={CLICKABLE_LAYERS}
        scrollZoom={false}
        dragRotate={false}
        touchPitch={false}
        locale={{
          "NavigationControl.ZoomIn": copy.mapZoomIn,
          "NavigationControl.ZoomOut": copy.mapZoomOut,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          const canvas = mapRef.current?.getCanvas();
          if (canvas) canvas.style.cursor = "";
        }}
        onClick={handleClick}
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <Source id="courts" type="geojson" data={data}>
          <Layer
            id="court-points"
            type="circle"
            paint={{
              "circle-color": ["case", PENDING, "#ffd482", "#ff4339"],
              "circle-radius": ["case", HERE, 9, 8],
              "circle-stroke-width": ["case", HERE, 2.5, 2],
              "circle-stroke-color": ["case", HERE, "#ffd482", PENDING, "#111111", "#ffffff"],
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
              "symbol-sort-key": ["case", HERE, 0, 1],
            }}
            paint={{
              "text-color": "#1a1a1a",
              "text-halo-color": "#ffffff",
              "text-halo-width": 1.25,
            }}
          />
        </Source>
        {selected ? (
          <Popup
            latitude={selected.lat}
            longitude={selected.lon}
            anchor="bottom"
            offset={14}
            closeButton={false}
            closeOnClick={false}
            maxWidth="16rem"
            onClose={() => setSelectedId(null)}
          >
            <CourtMiniPopup court={selected} onClose={() => setSelectedId(null)} />
          </Popup>
        ) : null}
      </MapView>
    </div>
  );
}
