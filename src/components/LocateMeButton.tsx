"use client";

import {
  LoaderCircle,
  Locate,
  LocateFixed,
  LocateOff,
} from "lucide-react";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { Copy } from "@/lib/copy";
import type { LocationStatus } from "@/lib/origin";

const LOCATION_ICON = {
  idle: Locate,
  pending: LoaderCircle,
  granted: LocateFixed,
  denied: LocateOff,
  unavailable: LocateOff,
} as const;

const BUTTON_CLASS =
  "inline-flex shrink-0 items-center justify-center rounded-full bg-blue-800 font-bold text-white hover:bg-blue-900 disabled:cursor-default disabled:opacity-70";

export function LocateMeButton({
  status,
  onClick,
  compact = false,
  iconOnly = false,
}: {
  status: LocationStatus;
  onClick: () => void;
  compact?: boolean;
  iconOnly?: boolean;
}) {
  const copy = useCopy();
  const LocationIcon = LOCATION_ICON[status];
  const pending = status === "pending";
  const label = copy.nearMe[status];
  const iconClass = iconOnly
    ? "size-5"
    : compact
      ? "size-5 sm:size-3.5"
      : "size-3.5";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={label}
      className={
        iconOnly
          ? `${BUTTON_CLASS} size-12 outline-none focus-visible:ring-2 focus-visible:ring-gold/60`
          : compact
            ? `${BUTTON_CLASS} size-12 sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-sm`
            : `${BUTTON_CLASS} gap-1.5 px-3 py-1.5 text-sm`
      }
    >
      <LocationIcon
        aria-hidden
        className={`${iconClass} ${pending ? "animate-spin" : ""}`}
      />
      {iconOnly ? null : compact ? (
        <span className="hidden sm:inline">{label}</span>
      ) : (
        label
      )}
    </button>
  );
}

export function locationHint(
  copy: Copy,
  status: LocationStatus,
): string | null {
  if (status === "denied") return copy.locationBlockedHelp;
  if (status === "idle" || status === "unavailable") {
    return copy.locateToSeeDistance;
  }
  return null;
}
