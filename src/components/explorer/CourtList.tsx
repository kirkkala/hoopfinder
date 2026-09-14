"use client";

import { useEffect } from "react";
import Link from "next/link";
import { basketball } from "@lucide/lab";
import { ArrowRight, Icon } from "lucide-react";
import { useCopy } from "@/components/brand/LocaleProvider";
import { CourtBadges } from "@/components/explorer/CourtBadges";
import { formatAddress, type CourtWithDistance, courtName } from "@/lib/courts";
import { formatDistance } from "@/lib/geo";

export function CourtList({
  courts,
  selectedId,
  onSelect,
}: {
  courts: CourtWithDistance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const copy = useCopy();
  useEffect(() => {
    if (selectedId === null) {
      return;
    }
    document.getElementById(`court-${selectedId}`)?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedId]);

  if (courts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <Icon iconNode={basketball} className="size-10 text-gold/70" aria-hidden />
        <p className="font-display text-2xl tracking-wide text-white">{copy.emptyTitle}</p>
        <p className="max-w-sm text-sm text-ink-muted">
          {copy.emptyHint}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2 py-3">
      {courts.map((court) => {
        const selected = court.id === selectedId;
        return (
          <li key={court.id} id={`court-${court.id}`}>
            <div
              className={`flex flex-col gap-2 rounded-2xl px-3 py-3 ${
                selected
                  ? "bg-emerald-400/15 ring-1 ring-emerald-400"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(court.id)}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <span>
                  <span className="block font-semibold text-white">
                    {courtName(court, copy)}
                  </span>
                  <span className="mt-1 block text-sm text-ink-muted">
                    {formatAddress([
                      court.address,
                      court.neighborhood,
                      court.city,
                    ]) || copy.addressMissing}
                  </span>
                </span>
                {court.distanceKm !== null ? (
                  <span className="shrink-0 font-display text-lg leading-none text-gold">
                    {formatDistance(court.distanceKm)}
                  </span>
                ) : null}
              </button>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <CourtBadges court={court} />
                <Link
                  href={`/courts/${court.id}`}
                  className="ml-auto inline-flex items-center gap-1 font-bold text-gold hover:text-white"
                >
                  {copy.letsGo}
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
