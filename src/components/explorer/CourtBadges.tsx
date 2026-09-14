"use client";

import { Lightbulb, Unlock } from "lucide-react";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { Copy } from "@/lib/copy";
import { formatStatus, type Court } from "@/lib/courts";

export function CourtBadges({ court }: { court: Court }) {
  const copy = useCopy();
  return (
    <>
      <StatusBadge status={court.status} copy={copy} />
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

function StatusBadge({ status, copy }: { status: string; copy: Copy }) {
  const closed = status !== "active";
  return (
    <span
      className={`rounded-full px-2 py-1 font-bold ${
        closed ? "bg-gold/20 text-gold" : "bg-emerald-400/15 text-emerald-300"
      }`}
    >
      {formatStatus(status, copy)}
    </span>
  );
}
