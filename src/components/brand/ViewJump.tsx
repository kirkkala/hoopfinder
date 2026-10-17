"use client";

import { Home, List, Map as MapIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AppLink } from "@/components/brand/AppLink";
import { useCopy } from "@/components/brand/LocaleProvider";
import { COURT_INDEX_PATH, INFO_HREF, MAP_PATH } from "@/lib/constants";

const ICONS = {
  "to-home": Home,
  "to-list": List,
  "to-map": MapIcon,
} as const;

const SIZE = {
  md: {
    link: "w-fit gap-1.5 px-3 py-1.5 text-sm",
    icon: "size-4 shrink-0",
  },
  /** Homepage pair: taller targets. Phones share one row; wider screens size to the label. */
  lg: {
    link: "h-full min-w-0 w-full justify-center gap-1.5 px-2 py-2.5 text-center text-sm leading-tight min-[26rem]:text-base sm:w-auto sm:gap-2 sm:px-4 sm:py-3",
    icon: "size-4 shrink-0 sm:size-5",
  },
} as const;

/** Link between the info page, the map, and the court list. Prefetch stays off so the map does not load the list early. */
export function ViewJump({
  href,
  direction,
  children,
  className,
  size = "md",
}: {
  href: string;
  direction: keyof typeof ICONS;
  children: ReactNode;
  className?: string;
  size?: keyof typeof SIZE;
}) {
  const Icon = ICONS[direction];
  const sized = SIZE[size];
  return (
    <AppLink
      href={href}
      prefetch={false}
      className={[
        "inline-flex items-center rounded-full border border-white/20 bg-white/5 font-bold text-gold outline-none hover:border-gold/50 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60",
        sized.link,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon className={sized.icon} aria-hidden />
      {size === "lg" ? <span className="min-w-0 text-balance">{children}</span> : children}
    </AppLink>
  );
}

/** Info page first, then the other view. The map and the court list use this to get back. */
export function ViewJumps({ also, className }: { also: "to-list" | "to-map"; className?: string }) {
  const copy = useCopy();
  const peer =
    also === "to-map"
      ? { href: MAP_PATH, label: copy.courtsOnMap }
      : { href: COURT_INDEX_PATH, label: copy.courtsAsList };

  return (
    <div className={["flex flex-wrap gap-2", className].filter(Boolean).join(" ")}>
      <ViewJump href={INFO_HREF} direction="to-home">
        {copy.homepage}
      </ViewJump>
      <ViewJump href={peer.href} direction={also}>
        {peer.label}
      </ViewJump>
    </div>
  );
}
