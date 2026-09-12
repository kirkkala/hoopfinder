import { Heart } from "lucide-react";

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
