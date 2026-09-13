"use client";

import { useEffect, useRef } from "react";
import { basketball } from "@lucide/lab";
import { Icon, Locate, Map, Search, X } from "lucide-react";
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

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
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
      className="m-auto w-[min(26rem,calc(100%-2rem))] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl border border-white/10 bg-panel p-0 text-ink shadow-[0_24px_64px_rgb(0_0_0_/_0.55)] backdrop:bg-black/70"
    >
      <div className="relative overflow-hidden px-6 pt-6 pb-5">
        <div className="court-arc pointer-events-none absolute inset-0 opacity-40" />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-full p-1.5 text-ink-muted hover:bg-white/10 hover:text-white"
          aria-label={copy.close}
        >
          <X className="size-4" aria-hidden />
        </button>
        <div className="relative">
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
          </ul>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-full bg-gold px-4 py-3 text-sm font-bold text-asphalt hover:bg-[#ffe0a3]"
          >
            {copy.introCta}
          </button>
        </div>
      </div>
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
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-gold">
        <StepIcon className="size-3.5" aria-hidden />
      </span>
      {children}
    </li>
  );
}
