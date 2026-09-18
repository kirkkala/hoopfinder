"use client";

import { MapPin } from "lucide-react";
import { useCopy } from "@/components/brand/LocaleProvider";
import { courtTitle, formatAddress, type CourtWithDistance } from "@/lib/courts";
import { CourtDistance } from "@/components/CourtDistance";

export function CourtHeading({
  court,
  pin = false,
  className,
}: {
  court: CourtWithDistance;
  pin?: boolean;
  className?: string;
}) {
  const copy = useCopy();
  return (
    <div
      className={["flex items-start justify-between gap-3", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="min-w-0">
        <p className="font-semibold leading-snug text-white">
          {pin ? (
            <MapPin
              className="mr-1.5 inline size-[1em] shrink-0 align-[-0.15em]"
              aria-hidden
            />
          ) : null}
          {courtTitle(court, copy)}
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          {formatAddress([
            court.address,
            court.neighborhood,
            court.city,
          ]) || copy.addressMissing}
        </p>
      </div>
      {court.distanceKm !== null ? (
        <CourtDistance km={court.distanceKm} />
      ) : null}
    </div>
  );
}
