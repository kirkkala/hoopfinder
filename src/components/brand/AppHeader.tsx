"use client";

import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { basketball } from "@lucide/lab";
import { Icon } from "lucide-react";
import { IntroDialog } from "@/components/brand/IntroDialog";
import { LanguageToggle } from "@/components/brand/LanguageToggle";
import { BuyMeCoffeeButton } from "@/components/brand/BuyMeCoffeeButton";
import { SourceCredits } from "@/components/brand/AppFooter";
import { useCopy } from "@/components/brand/LocaleProvider";
import { AppWordmark } from "@/components/brand/AppWordmark";
import { APP_VERSION } from "@/lib/constants";
import type { FetchedAtBySource } from "@/lib/catalog";
import { mq, useMinWidth, wide } from "@/lib/layout";
import { COURT_SOURCES } from "@/lib/sources";
import { formatFetchedAt } from "@/lib/time";

const INTRO_KEY = "hoopfinder-intro-seen";

export function AppHeader({
  fetchedAtBySource,
  courtCount,
  home = false,
}: {
  fetchedAtBySource?: FetchedAtBySource;
  courtCount: number;
  home?: boolean;
}) {
  const copy = useCopy();
  const headerRef = useRef<HTMLElement>(null);
  const [introOpen, setIntroOpen] = useState(false);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const syncHeight = () => {
      document.documentElement.style.setProperty(
        "--app-header-height",
        `${header.getBoundingClientRect().height}px`,
      );
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

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

  const brandTitleClass =
    "block font-display text-xl leading-none tracking-wide whitespace-nowrap text-white sm:text-2xl";

  return (
    <header
      ref={headerRef}
      className={`z-20 shrink-0 border-b border-white/10 bg-asphalt ${
        home ? "relative" : "sticky top-0"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="court-arc absolute inset-0 opacity-40" />
      </div>
      <div className="relative flex items-center gap-3 px-3 py-2 sm:px-4 sm:py-3 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-2 rounded-sm outline-none sm:gap-3 focus-visible:ring-2 focus-visible:ring-gold/60"
            aria-label={copy.appName}
          >
            <Icon
              iconNode={basketball}
              className="size-8 shrink-0 origin-center text-orange-500 drop-shadow-lg transition-transform duration-300 ease-out sm:size-10 group-hover:rotate-[18deg] group-focus-visible:rotate-[18deg]"
              aria-hidden
            />
            <span className="min-w-0">
              {home ? (
                <h1 className={brandTitleClass}>
                  <AppWordmark region={copy.region} />
                </h1>
              ) : (
                <span className={brandTitleClass}>
                  <AppWordmark region={copy.region} />
                </span>
              )}
              <span className="mt-0.5 hidden text-sm text-ink/70 sm:block">
                {copy.tagline}
              </span>
            </span>
          </Link>
          <BetaBadge />
        </div>
        <nav className="flex shrink-0 items-center gap-1.5">
          <LanguageToggle />
          <div className={wide.flex}>
            <InfoMenuButton
              introOpen={introOpen}
              onOpenInfo={() => setIntroOpen(true)}
            />
          </div>
        </nav>
        <HeaderMenu
          fetchedAtBySource={fetchedAtBySource}
          introOpen={introOpen}
          onOpenInfo={() => setIntroOpen(true)}
        />
      </div>
      <IntroDialog
        open={introOpen}
        onClose={closeIntro}
        courtCount={courtCount}
      />
    </header>
  );
}

function SourceFetchedAt({
  fetchedAtBySource,
  className,
  timeClassName,
}: {
  fetchedAtBySource?: FetchedAtBySource;
  className?: string;
  timeClassName?: string;
}) {
  const copy = useCopy();
  const rows = COURT_SOURCES.flatMap((source) => {
    const iso = fetchedAtBySource?.[source.id];
    return iso ? [{ source, iso }] : [];
  });
  if (rows.length === 0) return null;

  return (
    <div className={className}>
      <p>{copy.dataFrom}</p>
      <p className="mt-0.5 text-xs">
        {rows.map(({ source, iso }, index) => (
          <Fragment key={source.id}>
            {index > 0 ? " , " : null}
              {source.shortLabel}
            {": "}
            <time dateTime={iso} className={timeClassName}>
              {formatFetchedAt(iso, true)}
            </time>
          </Fragment>
        ))}
      </p>
    </div>
  );
}

function HeaderMenu({
  fetchedAtBySource,
  introOpen,
  onOpenInfo,
}: {
  fetchedAtBySource?: FetchedAtBySource;
  introOpen: boolean;
  onOpenInfo: () => void;
}) {
  const copy = useCopy();
  const menuId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (introOpen) setOpen(false);
  }, [introOpen]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const items: {
    id: string;
    label: string;
    onSelect: () => void;
    hasPopup?: "dialog";
    expanded?: boolean;
  }[] = [
    {
      id: "info",
      label: copy.info,
      onSelect: () => {
        setOpen(false);
        onOpenInfo();
      },
      hasPopup: "dialog",
      expanded: introOpen,
    },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="true"
        aria-label={open ? copy.close : copy.menu}
        onClick={() => setOpen((value) => !value)}
        className={`relative z-30 grid size-10 shrink-0 place-items-center rounded-full outline-none transition-colors duration-200 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-gold/60 ${
          open ? "bg-white/10 text-gold" : "text-ink"
        }`}
      >
        <HamburgerIcon open={open} />
      </button>
      <div
        className={`fixed inset-x-0 bottom-0 z-20 overflow-hidden top-[calc(var(--app-header-height,3.5rem)-1px)] ${
          open ? "" : "pointer-events-none"
        }`}
      >
        <div
          aria-hidden
          className={`absolute inset-0 bg-black/55 transition-opacity duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <nav
          id={menuId}
          aria-label={copy.menu}
          aria-hidden={!open}
          inert={!open}
          className={`absolute inset-y-0 right-0 flex w-[min(19.5rem,88vw)] min-w-0 flex-col overflow-hidden border-l border-white/10 bg-panel shadow-[-18px_0_40px_rgb(0_0_0_/_0.45)] transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
            <div className="court-arc absolute inset-0" />
          </div>
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
            <div className="min-w-0 pr-[max(0px,env(safe-area-inset-right))]">
              <div className="px-4 pt-5 pb-4">
                <p className="text-sm font-bold text-white">{APP_VERSION}</p>
                <p className="mt-1 text-sm leading-5 text-ink-muted">
                  {copy.betaTooltip}
                </p>
              </div>
              <ul className="border-y border-white/10">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={item.onSelect}
                      aria-haspopup={item.hasPopup}
                      aria-expanded={item.expanded}
                      className="flex w-full items-center px-4 py-3.5 text-left text-base font-medium text-white outline-none hover:bg-white/5 focus-visible:bg-white/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/60"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="px-4">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 pt-4">
                  <BuyMeCoffeeButton />
                  <p className="text-sm text-ink/85">👈 {copy.introSupport}</p>
                </div>
                <SourceFetchedAt
                  fetchedAtBySource={fetchedAtBySource}
                  className="mt-5 border-t border-white/10 pt-4 text-sm leading-5 text-ink-muted"
                  timeClassName="text-ink/80"
                />
              </div>
            </div>
            <div className="mt-auto min-w-0 border-t border-white/10 bg-black/30 px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pr-[max(1rem,env(safe-area-inset-right))] text-sm leading-5 text-ink-muted">
              <div className="space-y-1.5">
                <SourceCredits />
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  const bar = {
    position: "absolute" as const,
    left: 0,
    height: 2,
    width: "100%",
    borderRadius: 999,
    background: "currentColor",
    transformOrigin: "center",
    transition:
      "transform 300ms cubic-bezier(.22, 1, .36, 1), opacity 200ms ease",
  };

  return (
    <span className="relative block h-3.5 w-5" aria-hidden>
      <span
        style={{
          ...bar,
          top: 0,
          transform: open
            ? "translateY(6px) rotate(45deg)"
            : "translateY(0) rotate(0deg)",
        }}
      />
      <span
        style={{
          ...bar,
          top: 6,
          opacity: open ? 0 : 1,
          transform: open ? "scaleX(0)" : "scaleX(1)",
        }}
      />
      <span
        style={{
          ...bar,
          top: 12,
          transform: open
            ? "translateY(-6px) rotate(-45deg)"
            : "translateY(0) rotate(0deg)",
        }}
      />
    </span>
  );
}

function InfoMenuButton({
  introOpen,
  onOpenInfo,
}: {
  introOpen: boolean;
  onOpenInfo: () => void;
}) {
  const copy = useCopy();

  return (
    <button
      type="button"
      onClick={onOpenInfo}
      aria-haspopup="dialog"
      aria-expanded={introOpen}
      className="rounded-sm px-2.5 py-1.5 text-sm font-medium text-ink/80 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60"
    >
      {copy.info}
    </button>
  );
}

function BetaBadge() {
  const copy = useCopy();
  const showTooltip = useMinWidth(mq.wide);
  const chip =
    "inline-flex rounded-full bg-gold/20 px-1.5 py-px font-sans text-[9px] font-bold uppercase tracking-[0.12em] text-gold sm:px-2 sm:py-0.5 sm:text-[11px] sm:tracking-[0.14em]";

  if (!showTooltip) {
    return <span className={chip}>Beta</span>;
  }

  return (
    <button
      type="button"
      className={`group relative ${chip} outline-none hover:bg-gold/30 focus-visible:ring-2 focus-visible:ring-gold/60`}
      aria-describedby="beta-tooltip"
    >
      Beta
      <span
        id="beta-tooltip"
        role="tooltip"
        className="pointer-events-none absolute top-[calc(100%+10px)] left-0 z-50 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-panel px-3 py-2.5 text-left text-xs font-normal normal-case leading-5 tracking-normal text-ink/90 opacity-0 shadow-[0_12px_32px_rgb(0_0_0_/_0.5)] transition-opacity duration-150 sm:left-1/2 sm:-translate-x-1/2 group-hover:opacity-100 group-focus:opacity-100"
      >
        <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border-t border-l border-white/10 bg-panel" />
        <span className="block font-bold text-white">{APP_VERSION}</span>
        <span className="mt-1 block">{copy.betaTooltip}</span>
      </span>
    </button>
  );
}
