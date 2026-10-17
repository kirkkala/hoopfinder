"use client";

import { ArrowRight, X } from "lucide-react";
import { useIsAdmin } from "@/components/admin/AdminProvider";
import { AppLink } from "@/components/brand/AppLink";
import { useCopy } from "@/components/brand/LocaleProvider";
import {
  courtHref,
  courtTitle,
  type ExplorerCourt,
  formatAddress,
  isAwaitingEmail,
  isPendingCourt,
  pinCourtCount,
} from "@/lib/courts";

/** Small card for another court on the minimap. */
export function CourtMiniPopup({ court, onClose }: { court: ExplorerCourt; onClose: () => void }) {
  const copy = useCopy();
  const isAdmin = useIsAdmin();
  const place = formatAddress([court.address, court.neighborhood, court.city]);
  const pads = pinCourtCount(court);
  const awaitingEmail = isAwaitingEmail(court);
  const canOpen = !awaitingEmail || isAdmin;

  return (
    <div className="relative flex min-w-52 flex-col gap-1.5 p-3">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-0.5 right-0.5 z-10 flex size-11 items-center justify-center rounded-full text-ink-muted hover:bg-white/10 hover:text-white"
        aria-label={copy.close}
      >
        <X className="size-5" aria-hidden />
      </button>
      <p className="pr-10 text-sm font-semibold leading-snug text-white">
        {courtTitle(court, copy)}
      </p>
      <p className="text-xs text-ink-muted">{place || copy.addressMissing}</p>
      {pads > 1 ? <p className="text-xs text-gold">{copy.padCount(pads)}</p> : null}
      {awaitingEmail ? (
        <p className="text-xs text-gold">{copy.statusAwaitingEmail}</p>
      ) : isPendingCourt(court) ? (
        <p className="text-xs text-ink-muted">{copy.pendingComingSoon}</p>
      ) : null}
      {canOpen ? (
        <AppLink
          href={courtHref(court)}
          className="inline-flex items-center gap-1 self-end pt-1 text-sm font-bold text-gold hover:text-white"
        >
          {copy.letsGo}
          <ArrowRight className="size-3.5" aria-hidden />
        </AppLink>
      ) : null}
    </div>
  );
}
