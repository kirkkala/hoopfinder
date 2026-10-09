"use client";

import { Map as MapIcon } from "lucide-react";
import { setWorkerUrl } from "maplibre-gl";
import MapView, { Marker } from "react-map-gl/maplibre";
import { AppLink } from "@/components/brand/AppLink";
import { useCopy } from "@/components/brand/LocaleProvider";
import { MAP_STYLE } from "@/lib/constants";
import { type Court, homeCourtHref } from "@/lib/courts";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export function CourtMiniMap({ court }: { court: Court }) {
  const copy = useCopy();

  return (
    <section className="px-3 py-4">
      <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-gold/80">
        <MapIcon className="size-4 shrink-0" aria-hidden />
        {copy.courtLocation}
      </h2>
      <div className="relative mt-2 h-80 rounded-xl outline-offset-2 hover:outline-2 hover:outline-gold/70 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold">
        <AppLink
          href={homeCourtHref(court)}
          aria-label={copy.backToMap}
          title={copy.backToMap}
          className="absolute inset-0 z-0 cursor-pointer rounded-xl"
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl [&_.maplibregl-control-container]:pointer-events-auto">
          <MapView
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
          </MapView>
        </div>
      </div>
    </section>
  );
}
