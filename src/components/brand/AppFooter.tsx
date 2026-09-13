"use client";

import { Heart } from "lucide-react";
import { useCopy } from "@/components/brand/LocaleProvider";
import { COURT_SOURCES } from "@/lib/sources";

export function AppFooter() {
  const copy = useCopy();

  return (
    <footer className="border-t border-white/10 bg-asphalt px-4 py-3 text-center text-xs text-ink-muted">
      <p>
        {copy.madeWith}{" "}
        <Heart
          className="inline size-3.5 fill-hnmky-red text-hnmky-red align-text-bottom"
          aria-hidden
        />
        <span className="sr-only"> {copy.love}</span>{" "}
        <a
          href="https://kirkkala.com"
          className="text-gold hover:text-white"
          target="_blank"
          rel="noreferrer"
        >
          Timo Kirkkala
        </a>
      </p>
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
    </footer>
  );
}

function sourceSeparator(index: number, total: number, andWord: string): string {
  if (index === 0) return "";
  if (index === total - 1) return andWord;
  return ", ";
}
