"use client";

import { useLayoutEffect, useState } from "react";
import { ChevronDown, ChevronUp, Heart } from "lucide-react";
import { BuyMeCoffeeButton } from "@/components/brand/BuyMeCoffeeButton";
import { useCopy } from "@/components/brand/LocaleProvider";
import { DATA_CREDITS } from "@/lib/sources";

const FOOTER_COLLAPSED_KEY = "hoopfinder-footer-collapsed";

export function AppFooter({ collapsible = false }: { collapsible?: boolean }) {
  const copy = useCopy();
  const [collapsed, setCollapsed] = useState(collapsible);
  const showCollapsed = collapsible && collapsed;

  useLayoutEffect(() => {
    if (!collapsible) return;
    try {
      setCollapsed(sessionStorage.getItem(FOOTER_COLLAPSED_KEY) !== "0");
    } catch {
      // Private browsing can block storage. The footer stays collapsed.
    }
  }, [collapsible]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        sessionStorage.setItem(FOOTER_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // The choice still applies until the next page load.
      }
      return next;
    });
  }

  return (
    <footer
      className={`relative shrink-0 border-t border-white/10 bg-asphalt px-3 text-xs leading-5 text-ink-muted sm:px-4 sm:text-sm sm:leading-6 ${
        showCollapsed ? "py-1.5 wide:py-2" : "py-2.5 sm:py-3 wide:py-2"
      }`}
    >
      {collapsible ? (
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? copy.footerShow : copy.footerHide}
          className={`absolute right-2 inline-flex size-8 items-center justify-center rounded-full bg-gold text-asphalt outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-gold/60 wide:hidden ${
            collapsed ? "top-1/2 -translate-y-1/2" : "top-2"
          }`}
        >
          {collapsed ? (
            <ChevronUp className="size-5" aria-hidden />
          ) : (
            <ChevronDown className="size-5" aria-hidden />
          )}
        </button>
      ) : null}
      <div className={`wide:hidden ${collapsible ? "pr-10" : ""}`}>
        {showCollapsed ? (
          <MadeWith />
        ) : (
          <>
            <MadeWith />
            <SourceCredits />
          </>
        )}
      </div>
      <div className="hidden wide:grid wide:grid-cols-[1fr_auto_1fr] wide:items-center wide:gap-4">
        <div />
        <div className="text-center">
          <MadeWith />
          <div className="flex flex-wrap items-center justify-center gap-x-2.5">
            <SourceCredits row />
          </div>
        </div>
        <div className="justify-self-end">
          <BuyMeCoffeeButton size="md" className="shrink-0" />
        </div>
      </div>
    </footer>
  );
}

function MadeWith() {
  const copy = useCopy();

  return (
    <p className="whitespace-nowrap">
      {copy.madeWith}{" "}
      <Heart
        className="inline size-4 fill-red-500 text-red-500 align-text-bottom"
        aria-hidden
      />
      <span className="sr-only"> {copy.love}</span> by{" "}
      <a
        href="https://kirkkala.com"
        className="text-gold hover:text-white"
        target="_blank"
        rel="noreferrer"
      >
        Kirkkala
      </a>
    </p>
  );
}

export function SourceCredits({ row = false }: { row?: boolean }) {
  const copy = useCopy();
  const Item = row ? "span" : "p";

  return (
    <>
      <Item>
        {copy.courtDataFrom} <CreditLinks />
      </Item>
      {row ? <CreditDivider /> : null}
      <Item>
        <a
          href="https://github.com/kirkkala/hoopfinder"
          className="text-gold hover:text-white"
          target="_blank"
          rel="noreferrer"
        >
          GitHub.com/kirkkala/hoopfinder
        </a>
      </Item>
      {row ? <CreditDivider /> : null}
      <Item>
        {copy.feedback}:{" "}
        <a
          href={`mailto:timo.kirkkala@gmail.com?subject=${copy.feedbackSubject}&body=${copy.feedbackBody}`}
          className="text-gold hover:text-white"
          target="_blank"
          rel="noreferrer"
        >
          timo.kirkkala@gmail.com
        </a>
      </Item>
    </>
  );
}

function CreditDivider() {
  return (
    <span aria-hidden>|</span>
  );
}

function CreditLinks() {
  const copy = useCopy();

  return DATA_CREDITS.map((source, index) => (
    <span key={source.id}>
      {sourceSeparator(index, DATA_CREDITS.length, copy.sourceListAnd)}
      <a
        href={source.href}
        className="text-gold hover:text-white"
        target="_blank"
        rel="noreferrer"
      >
        {source.label}
      </a>
    </span>
  ));
}

function sourceSeparator(index: number, total: number, andWord: string): string {
  if (index === 0) return "";
  if (index === total - 1) return andWord;
  return ", ";
}
