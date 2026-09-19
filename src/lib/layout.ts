"use client";

import { useSyncExternalStore } from "react";

/**
 * Chrome layout breakpoints. Pixel values must match `--breakpoint-wide` and
 * `--breakpoint-split` in `src/app/globals.css` (640px = 40rem, 1024px = 64rem).
 *
 * compact (< wide): language + hamburger in the header, short footer, data-updated in the menu
 * wide: inline lang/info, hamburger, data-updated in the menu, full footer
 * split: court list beside the map
 *
 * Visual spacing (`sm:px-4`, `sm:text-2xl`, …) uses default Tailwind scales and
 * is independent of these chrome tokens.
 */
export const BREAKPOINTS = {
  wide: 640,
  split: 1024,
} as const;

export const mq = {
  wide: `(min-width: ${BREAKPOINTS.wide}px)`,
  split: `(min-width: ${BREAKPOINTS.split}px)`,
} as const;

/** Classes paired with `BREAKPOINTS.wide` (Tailwind `wide:`). */
export const wide = {
  hidden: "wide:hidden",
  flex: "hidden wide:flex",
  block: "hidden wide:block",
} as const;

/** Classes paired with `BREAKPOINTS.split` (Tailwind `split:`). */
export const split = {
  hidden: "split:hidden",
  row: "split:flex-row",
  aside: "split:min-h-0 split:w-[26rem] split:border-r split:border-b-0",
  paneBorder: "split:border-b split:border-white/10",
} as const;

export function useMinWidth(query: string, ssr = false) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => ssr,
  );
}
