"use client";

import { Map as MapIcon } from "lucide-react";
import { setWorkerUrl } from "maplibre-gl";
import Link from "next/link";
import MapView, { Marker } from "react-map-gl/maplibre";
import { AppLink } from "@/components/brand/AppLink";
import { useCopy } from "@/components/brand/LocaleProvider";
import { MAP_STYLE } from "@/lib/constants";
import { type Court, courtHref, courtPadLabel, homeCourtHref } from "@/lib/courts";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const DOT_CLASS = "flex size-8 items-center justify-center rounded-full";

export function CourtMiniMap({ court, spots }: { court: Court; spots?: Court[] }) {
  const copy = useCopy();
  const points = spots && spots.length > 1 ? spots : [court];
  const latitude = points.reduce((sum, spot) => sum + spot.lat, 0) / points.length;
  const longitude = points.reduce((sum, spot) => sum + spot.lon, 0) / points.length;
  const several = points.length > 1;

  return (
    <section className="px-3 py-4">
      <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-gold/80">
        <MapIcon className="size-4 shrink-0" aria-hidden />
        {several ? copy.courtsOnMap : copy.courtLocation}
      </h2>
      <div className="relative mt-2 h-80 overflow-hidden rounded-xl">
        <MapView
          mapStyle={MAP_STYLE}
          initialViewState={{
            latitude,
            longitude,
            zoom: several ? 16 : 14.5,
          }}
          style={{ width: "100%", height: "100%" }}
          attributionControl={{ compact: true }}
          interactive={false}
        >
          {points.map((spot) => {
            const here = spot.id === court.id;
            const label = courtPadLabel(spot, copy);
            const dot = (
              <span
                className={`block h-4 w-4 rounded-full ring-4 ${
                  here ? "bg-gold ring-red-500" : "bg-red-500 ring-gold/80"
                }`}
              />
            );
            return (
              <Marker
                key={spot.id}
                latitude={spot.lat}
                longitude={spot.lon}
                anchor="center"
                style={{ zIndex: here ? 1 : 2 }}
              >
                {here ? (
                  <span title={label} className={DOT_CLASS}>
                    {dot}
                  </span>
                ) : (
                  <Link
                    href={courtHref(spot)}
                    aria-label={label}
                    title={label}
                    className={`${DOT_CLASS} outline-offset-2 hover:outline-2 hover:outline-gold focus-visible:outline-2 focus-visible:outline-gold`}
                  >
                    {dot}
                  </Link>
                )}
              </Marker>
            );
          })}
        </MapView>
      </div>
      <AppLink
        href={homeCourtHref(court)}
        className="mt-2 inline-flex text-sm font-medium text-gold hover:text-white"
      >
        {copy.backToMap}
      </AppLink>
    </section>
  );
}
