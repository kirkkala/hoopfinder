"use client";

import { useEffect, useRef, useState } from "react";
import { basketball } from "@lucide/lab";
import { ChevronDown, Icon, X } from "lucide-react";
import { LanguageToggle } from "@/components/brand/LanguageToggle";
import { BuyMeCoffeeButton } from "@/components/brand/BuyMeCoffeeButton";
import { useCopy } from "@/components/brand/LocaleProvider";
import { LocateMeButton } from "@/components/LocateMeButton";
import { APP_NAME } from "@/lib/constants";
import { useLocationStatus } from "@/lib/origin";

export function IntroDialog({
  open,
  onClose,
  courtCount,
}: {
  open: boolean;
  onClose: () => void;
  courtCount: number;
}) {
  const copy = useCopy();
  const ref = useRef<HTMLDialogElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [leadBefore, leadAfter] = copy.introLead.split("{count}");

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

    const node = dialog;
    function update() {
      const remaining =
        node.scrollHeight - node.scrollTop - node.clientHeight;
      setShowScrollHint(remaining > 24);
    }

    update();
    node.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => {
      node.removeEventListener("scroll", update);
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
          <p className="mt-3 text-base leading-6 text-ink/80">
            {leadBefore}
            <strong className="text-md font-bold tracking-wide text-gold">
              {courtCount}
            </strong>
            {leadAfter}
          </p>
          <IntroLocationPrompt />
          <h2 className="mt-6 font-display text-2xl tracking-wide text-white">
            {copy.introCreatedByTitle}
          </h2>
          <p className="mt-2 block text-base text-ink/85">
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
          <p className="mt-2 block text-base text-ink/85">{copy.introCreatedBy2}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-1.5">
            <BuyMeCoffeeButton size="md" />
            <p className="text-base text-ink/85">👈 {copy.introSupport}</p>
          </div>
          <a
            href="https://github.com/kirkkala/hoopfinder"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-base text-ink/85 underline hover:text-gold"
          >
            {copy.introCreatedBySourceCode}
          </a>
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-full bg-gold px-4 py-3 text-base font-bold text-asphalt hover:bg-[#ffe0a3]"
          >
            {copy.introCta}
          </button>
        </div>
      </div>
      {showScrollHint ? (
        <p className="pointer-events-none fixed bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-panel/95 px-3 py-1.5 text-xs font-bold tracking-wide text-gold uppercase shadow-[0_8px_24px_rgb(0_0_0_/_0.45)]">
          <ChevronDown className="size-3.5" aria-hidden />
          {copy.scrollForMore}
        </p>
      ) : null}
    </dialog>
  );
}

function IntroLocationPrompt() {
  const copy = useCopy();
  const { status, request } = useLocationStatus();
  const granted = status === "granted";

  return (
    <div
      className={`mt-5 rounded-2xl border px-4 py-3 ${
        granted
          ? "border-emerald-400/25 bg-emerald-400/10"
          : "border-gold/20 bg-gold/5"
      }`}
    >
      {granted ? (
        <p className="text-base leading-6 text-ink/85">
          {copy.introLocationGranted}
        </p>
      ) : (
        <>
          <p className="text-base leading-6 text-ink/85">
            {copy.introLocationBenefit}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {copy.introLocationOptional}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <LocateMeButton status={status} onClick={request} />
            {status === "denied" ? (
              <p className="text-sm text-ink-muted">{copy.locationBlockedHelp}</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
