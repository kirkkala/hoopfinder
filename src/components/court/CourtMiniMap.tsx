"use client";

import Map, { Marker } from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import type { Court } from "@/lib/courts";
import { MAP_STYLE } from "@/lib/constants";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export function CourtMiniMap({ court }: { court: Court }) {
  return (
    <Map
      mapStyle={MAP_STYLE}
      initialViewState={{
        latitude: court.lat,
        longitude: court.lon,
        zoom: 14.5,
      }}
      style={{ width: "100%", height: "100%" }}
      attributionControl={{ compact: true }}
      interactive={false}
    >
      <Marker latitude={court.lat} longitude={court.lon} anchor="center">
        <span className="block h-4 w-4 rounded-full bg-red-500 ring-4 ring-gold/80" />
      </Marker>
    </Map>
  );
}
