"use client";

import { Heart } from "lucide-react";
import { useCopy } from "@/components/brand/LocaleProvider";
import { COURT_SOURCES } from "@/lib/sources";
import { wide } from "@/lib/layout";

export function AppFooter() {
  const copy = useCopy();

  return (
    <footer className="border-t border-white/10 bg-asphalt px-3 py-2.5 text-center text-xs leading-5 text-ink-muted sm:px-4 sm:py-3 sm:text-sm sm:leading-6">
      <p>
        {copy.madeWith}{" "}
        <Heart
          className="inline size-4 fill-red-500 text-red-500 align-text-bottom"
          aria-hidden
        />
        <span className="sr-only"> {copy.love}</span>{" "}by{" "}
        <a
          href="https://kirkkala.com"
          className="text-gold hover:text-white"
          target="_blank"
          rel="noreferrer"
        >
          Timo Kirkkala
        </a>
      </p>
      <div className={wide.block}>
        <SourceCredits />
      </div>
    </footer>
  );
}

export function SourceCredits() {
  const copy = useCopy();

  return (
    <>
      <p>
        {copy.courtDataFrom}{" "}
        {COURT_SOURCES.map((source, index) => (
          <span key={source.id}>
            {sourceSeparator(index, COURT_SOURCES.length, copy.sourceListAnd)}
            <a
              href={source.href}
              className="text-gold hover:text-white"
              target="_blank"
              rel="noreferrer"
            >
              {source.label}
            </a>
          </span>
        ))}
      </p>
      <p>
        {copy.sourceCodeOn}{" "}
        <a
          href="https://github.com/kirkkala/hoopfinder"
          className="text-gold hover:text-white"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </p>
    </>
  );
}

function sourceSeparator(index: number, total: number, andWord: string): string {
  if (index === 0) return "";
  if (index === total - 1) return andWord;
  return ", ";
}
