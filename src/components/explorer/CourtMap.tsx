"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { LngLatBounds, setWorkerUrl, type GeoJSONSource } from "maplibre-gl";
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
import { courtName, type CourtWithDistance } from "@/lib/courts";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  formatDistance,
  type Coordinates,
  type MapBounds,
} from "@/lib/geo";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const MAP_VIEW_KEY = "hoopfinder-map-view";

function readSavedView(): { latitude: number; longitude: number; zoom: number } {
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
    // First visit, private mode, or a bad value — use the Helsinki default.
  }
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
  followUser,
  keepCamera,
  onSelect,
  onClose,
  onBoundsChange,
}: {
  courts: CourtWithDistance[];
  selectedId: string | null;
  origin: Coordinates | null;
  followUser: boolean;
  keepCamera: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
  onBoundsChange: (bounds: MapBounds) => void;
}) {
  const copy = useCopy();
  const mapRef = useRef<MapRef>(null);
  const [mapReady, setMapReady] = useState(false);
  const [initialView] = useState(readSavedView);
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
          name: courtName(court, copy),
        },
      })),
    }),
    [courts, copy],
  );

  useEffect(() => {
    if (!mapReady || selected) {
      return;
    }

    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (followUser && origin) {
      map.flyTo({
        center: [origin.lon, origin.lat],
        zoom: 11,
        duration: 700,
      });
      return;
    }

    if (!origin) {
      return;
    }

    if (courts.length === 0) {
      return;
    }

    if (courts.length === 1) {
      map.flyTo({
        center: [courts[0].lon, courts[0].lat],
        zoom: 14,
        duration: 700,
      });
      return;
    }

    const bounds = courts.reduce(
      (nextBounds, court) => nextBounds.extend([court.lon, court.lat]),
      new LngLatBounds(
        [courts[0].lon, courts[0].lat],
        [courts[0].lon, courts[0].lat],
      ),
    );
    map.fitBounds(bounds, { padding: 72, maxZoom: 13, duration: 700 });
  }, [courts, followUser, mapReady, origin, selected]);

  useEffect(() => {
    if (!selected || keepCamera) {
      return;
    }
    mapRef.current?.flyTo({
      center: [selected.lon, selected.lat],
      zoom: Math.max(mapRef.current.getZoom(), 14),
      duration: 700,
    });
  }, [keepCamera, selected]);

  function handleClick(event: MapLayerMouseEvent) {
    const feature = event.features?.[0];
    if (!feature || feature.geometry.type !== "Point") {
      return;
    }

    const coordinates = feature.geometry.coordinates as [number, number];

    if (feature.layer?.id === "clusters") {
      const map = mapRef.current;
      if (!map) {
        return;
      }
      const clusterId = Number(feature.properties?.cluster_id);
      const source = map.getSource("courts");
      if (Number.isFinite(clusterId) && source) {
        void (source as GeoJSONSource)
          .getClusterExpansionZoom(clusterId)
          .then((zoom) => {
            map.easeTo({ center: coordinates, zoom });
          })
          .catch(() => {
            map.easeTo({ center: coordinates, zoom: map.getZoom() + 2 });
          });
      }
      return;
    }

    const id = feature.properties?.id;
    if (id != null && String(id)) {
      onSelect(String(id));
    }
  }

  return (
    <Map
      ref={mapRef}
      mapStyle={MAP_STYLE}
      initialViewState={initialView}
      style={{ width: "100%", height: "100%" }}
      interactiveLayerIds={["clusters", "court-points"]}
      onLoad={(event) => {
        setMapReady(true);
        onBoundsChange(boundsFromMap(event.target));
      }}
      onMoveEnd={(event) => {
        const { latitude, longitude, zoom } = event.viewState;
        saveView(latitude, longitude, zoom);
        onBoundsChange(boundsFromMap(event.target));
      }}
      onClick={handleClick}
      attributionControl={{ compact: true }}
    >
      <NavigationControl position="top-right" />
      <Source
        id="courts"
        type="geojson"
        data={data}
        cluster
        clusterMaxZoom={14}
        clusterRadius={48}
      >
        <Layer
          id="clusters"
          type="circle"
          filter={["has", "point_count"]}
          paint={{
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#ffd482",
              10,
              "#ff4339",
              30,
              "#8299e0",
            ],
            "circle-radius": [
              "step",
              ["get", "point_count"],
              18,
              10,
              24,
              30,
              32,
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          }}
        />
        <Layer
          id="cluster-count"
          type="symbol"
          filter={["has", "point_count"]}
          layout={{
            "text-field": ["get", "point_count_abbreviated"],
            "text-size": 12,
            "text-font": ["Noto Sans Regular"],
          }}
          paint={{ "text-color": "#111111" }}
        />
        <Layer
          id="court-points"
          type="circle"
          filter={["!", ["has", "point_count"]]}
          paint={{
            "circle-color": "#ff4339",
            "circle-radius": 7,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          }}
        />
      </Source>

      {origin ? (
        <Marker latitude={origin.lat} longitude={origin.lon} anchor="center">
          <span className="block h-3.5 w-3.5 rounded-full bg-hnmky-blue ring-4 ring-hnmky-blue/40" />
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
          onClose={onClose}
        >
          <div className="relative min-w-48 p-3 pr-8">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-2 right-2 rounded-full p-1 text-ink-muted hover:bg-white/10 hover:text-white"
              aria-label={copy.close}
            >
              <X className="size-4" aria-hidden />
            </button>
            <p className="font-semibold text-white">{courtName(selected, copy)}</p>
            {selected.distanceKm !== null ? (
              <p className="mt-1 text-xs text-ink-muted">
                {copy.distanceAway(formatDistance(selected.distanceKm))}
              </p>
            ) : null}
            <Link
              href={`/courts/${selected.id}`}
              className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-gold hover:text-white"
            >
              {copy.letsGo}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </Popup>
      ) : null}
    </Map>
  );
}
