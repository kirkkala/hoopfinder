"use client";

import { X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useCopy } from "@/components/brand/LocaleProvider";
import { ViewJump } from "@/components/brand/ViewJump";
import { COURT_INDEX_PATH, MAP_PATH } from "@/lib/constants";
import { hasVisited, markVisited } from "@/lib/visit";

/** Short intro for a first visit that lands on a court page instead of the homepage. */
export function FirstVisitNote() {
  const copy = useCopy();
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    if (hasVisited()) return;
    markVisited();
    setOpen(true);
  }, []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      aria-labelledby="first-visit-title"
      onCancel={(event) => {
        event.preventDefault();
        setOpen(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
      className="intro-dialog m-0 h-dvh max-h-dvh w-full max-w-none bg-transparent p-4 text-ink outline-none open:grid backdrop:bg-black/70"
    >
      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-panel p-5 shadow-[0_24px_64px_rgb(0_0_0_/_0.55)]">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 rounded-full p-1.5 text-ink-muted hover:bg-white/10 hover:text-white"
          aria-label={copy.close}
        >
          <X className="size-4" aria-hidden />
        </button>
        <h2 id="first-visit-title" className="pr-8 font-display text-2xl tracking-wide text-white">
          {copy.servicePitch}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <ViewJump href={MAP_PATH} direction="to-map">
            {copy.courtsOnMap}
          </ViewJump>
          <ViewJump href={COURT_INDEX_PATH} direction="to-list">
            {copy.courtsAsList}
          </ViewJump>
        </div>
      </div>
    </dialog>
  );
}
