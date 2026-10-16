"use client";

import { Lightbulb, Unlock } from "lucide-react";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { Copy } from "@/lib/copy";
import { type ExplorerCourt, formatStatus } from "@/lib/courts";

type CourtBadgeCourt = {
  status: string;
  source?: string;
  emailConfirmed?: boolean;
  amenities: Pick<ExplorerCourt["amenities"], "lighting" | "freeUse">;
};

export function CourtBadges({ court }: { court: CourtBadgeCourt }) {
  const copy = useCopy();
  return (
    <>
      <StatusBadge label={statusLabel(court, copy)} closed={court.status !== "active"} />
      {court.amenities.lighting === true ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-ink/80">
          <Lightbulb className="size-3" aria-hidden />
          {copy.lights}
        </span>
      ) : null}
      {court.amenities.freeUse === true ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-ink/80">
          <Unlock className="size-3" aria-hidden />
          {copy.freeUse}
        </span>
      ) : null}
    </>
  );
}

function statusLabel(court: CourtBadgeCourt, copy: Copy): string {
  if (court.emailConfirmed === false) return copy.statusAwaitingEmail;
  if (court.source === "pending" || court.status === "pending") return copy.statusUnderReview;
  return formatStatus(court.status, copy);
}

function StatusBadge({ label, closed }: { label: string; closed: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-1 font-bold ${
        closed ? "bg-gold/20 text-gold" : "bg-emerald-400/15 text-emerald-300"
      }`}
    >
      {label}
    </span>
  );
}
