"use client";

import { useEffect } from "react";
import { AppLink } from "@/components/brand/AppLink";
import { basketball } from "@lucide/lab";
import { ArrowRight, Icon } from "lucide-react";
import { useIsAdmin } from "@/components/admin/AdminProvider";
import { useCopy } from "@/components/brand/LocaleProvider";
import { CourtBadges } from "@/components/explorer/CourtBadges";
import { CourtHeading } from "@/components/explorer/CourtHeading";
import { PendingCourtNote } from "@/components/explorer/PendingCourtNote";
import { courtHref, isAwaitingEmail, isPendingCourt, type CourtWithDistance } from "@/lib/courts";

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
  const isAdmin = useIsAdmin();
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
                className="w-full text-left"
              >
                <CourtHeading court={court} />
              </button>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <CourtBadges court={court} />
                {isPendingCourt(court) ? (
                  <PendingCourtNote
                    createdAt={court.createdAt}
                    className="w-full"
                  />
                ) : null}
                {isAwaitingEmail(court) && !isAdmin ? null : (
                  <AppLink
                    href={courtHref(court)}
                    className="ml-auto inline-flex items-center gap-1 font-bold text-gold hover:text-white"
                  >
                    {copy.letsGo}
                    <ArrowRight className="size-3.5" aria-hidden />
                  </AppLink>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
