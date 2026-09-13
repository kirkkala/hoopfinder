"use client";

import { useEffect, useRef, useState } from "react";
import { basketball } from "@lucide/lab";
import { ChevronDown, Icon, Eye, Locate, Map, Search, X } from "lucide-react";
import { LanguageToggle } from "@/components/brand/LanguageToggle";
import { useCopy } from "@/components/brand/LocaleProvider";
import { APP_NAME } from "@/lib/constants";

export function IntroDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const copy = useCopy();
  const ref = useRef<HTMLDialogElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.scrollTop = 0;
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) {
      setShowScrollHint(false);
      return;
    }

    function update() {
      const remaining =
        dialog.scrollHeight - dialog.scrollTop - dialog.clientHeight;
      setShowScrollHint(remaining > 24);
    }

    update();
    dialog.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(dialog);
    return () => {
      dialog.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="intro-title"
      className="intro-dialog m-0 max-h-dvh w-full max-w-none overflow-y-auto overscroll-contain bg-transparent p-4 text-ink open:grid open:h-dvh backdrop:bg-black/70"
    >
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-panel shadow-[0_24px_64px_rgb(0_0_0_/_0.55)] sm:max-w-lg">
        <div className="court-arc pointer-events-none absolute inset-0 rounded-3xl opacity-40" />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-full bg-panel/80 p-1.5 text-ink-muted hover:bg-white/10 hover:text-white"
          aria-label={copy.close}
        >
          <X className="size-4" aria-hidden />
        </button>
        <div className="relative px-6 pt-6 pb-5">
          <Icon
            iconNode={basketball}
            className="size-10 text-orange-500 drop-shadow-lg"
            aria-hidden
          />
          <div className="mt-3 flex items-center justify-between gap-3 pr-8">
            <p className="text-xs font-bold tracking-[0.16em] text-gold uppercase">
              {APP_NAME}
            </p>
            <LanguageToggle />
          </div>
          <h2
            id="intro-title"
            className="mt-1 font-display text-3xl tracking-wide text-white"
          >
            {copy.introTitle}
          </h2>
          <p className="mt-3 text-sm leading-6 text-cream/80">{copy.introLead}</p>
          <ul className="mt-5 space-y-3 text-sm text-cream/85">
            <IntroStep icon={Search}>{copy.introSearch}</IntroStep>
            <IntroStep icon={Locate}>{copy.introLocate}</IntroStep>
            <IntroStep icon={Map}>{copy.introMap}</IntroStep>
            <IntroStep icon={Eye}>{copy.introSeeCourt}</IntroStep>
          </ul>
          <h2 className="mt-6 font-display text-2xl tracking-wide text-white">
            {copy.introCreatedByTitle}
          </h2>
          <p className="mt-2 block text-sm text-cream/85">
            <a
              href="https://kirkkala.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gold"
            >
              Timo Kirkkala
            </a>{" "}
            {copy.introCreatedBy1}
          </p>
          <p className="mt-2 block text-sm text-cream/85">{copy.introCreatedBy2}</p>
          <a
            href="https://github.com/kirkkala/hoopfinder"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-sm text-cream/85 underline hover:text-gold"
          >
            {copy.introCreatedBySourceCode}
          </a>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-full bg-gold px-4 py-3 text-sm font-bold text-asphalt hover:bg-[#ffe0a3]"
          >
            {copy.introCta}
          </button>
        </div>
      </div>
      {showScrollHint ? (
        <p className="pointer-events-none fixed bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-panel/95 px-3 py-1.5 text-[11px] font-bold tracking-wide text-gold uppercase shadow-[0_8px_24px_rgb(0_0_0_/_0.45)]">
          <ChevronDown className="size-3.5" aria-hidden />
          {copy.scrollForMore}
        </p>
      ) : null}
    </dialog>
  );
}

function IntroStep({
  icon: StepIcon,
  children,
}: {
  icon: typeof Search;
  children: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-gold">
        <StepIcon className="size-3.5" aria-hidden />
      </span>
      {children}
    </li>
  );
}
