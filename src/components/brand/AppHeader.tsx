"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { basketball } from "@lucide/lab";
import { ArrowLeft, Icon } from "lucide-react";
import { IntroDialog } from "@/components/brand/IntroDialog";
import { LanguageToggle } from "@/components/brand/LanguageToggle";
import { useCopy } from "@/components/brand/LocaleProvider";
import { APP_NAME } from "@/lib/constants";
import type { Locale } from "@/lib/copy";

const INTRO_KEY = "hoopfinder-intro";

export function AppHeader({
  backHref,
  fetchedAt,
}: {
  backHref?: string;
  fetchedAt?: string | null;
}) {
  const copy = useCopy();
  const [introOpen, setIntroOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(INTRO_KEY)) setIntroOpen(true);
    } catch {
      // Private mode — skip the first-visit prompt.
    }
  }, []);

  function closeIntro() {
    try {
      localStorage.setItem(INTRO_KEY, "1");
    } catch {
      // Ignore quota / private-mode failures.
    }
    setIntroOpen(false);
  }

  return (
    <header className="relative z-20 border-b border-white/10 bg-asphalt">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="court-arc absolute inset-0 opacity-40" />
      </div>
      <div className="relative flex items-center gap-3 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex w-20 shrink-0 items-center gap-1 text-sm font-medium text-gold hover:text-white"
            >
              <ArrowLeft className="size-6" aria-hidden />
              {copy.backToMap}
            </Link>
          ) : (
            <Icon
              iconNode={basketball}
              className="size-10 w-22 shrink-0 text-orange-500 drop-shadow-lg"
              aria-hidden
            />
          )}
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 font-display text-2xl leading-none tracking-wide text-white">
              {APP_NAME}
              <BetaBadge />
            </div>
            <p className="mt-0.5 truncate text-sm text-cream/70">{copy.tagline}</p>
          </div>
          <nav className="flex shrink-0 items-center gap-1.5" aria-label={copy.info}>
            <LanguageToggle />
            <button
              type="button"
              onClick={() => setIntroOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={introOpen}
              className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-cream/80 uppercase hover:bg-white/15 hover:text-white"
            >
              {copy.info}
            </button>
          </nav>
        </div>
        {fetchedAt ? (
          <p className="ml-auto shrink-0 text-right text-xs text-ink-muted">
            {copy.dataFrom}
            <time dateTime={fetchedAt} className="mt-0.5 block text-cream/70">
              {formatFetchedAt(fetchedAt, copy.locale)}
            </time>
          </p>
        ) : null}
      </div>
      <IntroDialog open={introOpen} onClose={closeIntro} />
    </header>
  );
}

function formatFetchedAt(iso: string, locale: Locale): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Helsinki",
      day: "numeric",
      month: locale === "en" ? "short" : "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(new Date(iso))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  if (locale === "en") {
    return `${Number(parts.day)} ${parts.month} ${parts.year}, ${parts.hour}:${parts.minute}`;
  }
  return `${Number(parts.day)}.${Number(parts.month)}.${parts.year} klo ${parts.hour}.${parts.minute}`;
}

function BetaBadge() {
  const copy = useCopy();

  return (
    <button
      type="button"
      className="group relative inline-flex rounded-full bg-gold/20 px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-gold outline-none hover:bg-gold/30 focus-visible:ring-2 focus-visible:ring-gold/60"
      aria-describedby="beta-tooltip"
    >
      {copy.beta}
      <span
        id="beta-tooltip"
        role="tooltip"
        className="pointer-events-none absolute top-[calc(100%+10px)] left-1/2 z-50 w-56 -translate-x-1/2 rounded-xl border border-white/10 bg-panel px-3 py-2.5 text-left text-xs font-normal normal-case leading-5 tracking-normal text-cream/90 opacity-0 shadow-[0_12px_32px_rgb(0_0_0_/_0.5)] transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100"
      >
        <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border-t border-l border-white/10 bg-panel" />
        {copy.betaTooltip}
      </span>
    </button>
  );
}
