import { Heart } from "lucide-react";
import { COURT_SOURCES } from "@/lib/sources";

export function AppFooter() {
  return (
    <footer className="border-t border-white/10 bg-asphalt px-4 py-3 text-center text-xs text-ink-muted">
      <p>
        Made with{" "}
        <Heart
          className="inline size-3.5 fill-hnmky-red text-hnmky-red align-text-bottom"
          aria-hidden
        />
        <span className="sr-only">love</span> by{" "}
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
        Court data from{" "}
        {COURT_SOURCES.map((source, index) => (
          <span key={source.id}>
            {sourceSeparator(index, COURT_SOURCES.length)}
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
        Source code published on{" "}
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

function sourceSeparator(index: number, total: number): string {
  if (index === 0) return "";
  if (index === total - 1) return " and ";
  return ", ";
}
