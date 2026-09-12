import Link from "next/link";
import { basketball } from "@lucide/lab";
import { ArrowLeft, Icon } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function AppHeader({
  backHref,
  fetchedAt,
}: {
  backHref?: string;
  fetchedAt?: string | null;
}) {
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
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-gold hover:text-white"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Hoops
            </Link>
          ) : (
            <Icon
              iconNode={basketball}
              className="size-10 shrink-0 text-orange-500 drop-shadow-lg"
              aria-hidden
            />
          )}
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 font-display text-2xl leading-none tracking-wide text-white">
              {APP_NAME}
              <BetaBadge />
            </div>
            <p className="mt-0.5 truncate text-sm text-cream/70">{APP_TAGLINE}</p>
          </div>
        </div>
        {fetchedAt ? (
          <p className="ml-auto shrink-0 text-right text-xs text-ink-muted">
            Data from
            <time dateTime={fetchedAt} className="mt-0.5 block text-cream/70">
              {formatFetchedAt(fetchedAt)}
            </time>
          </p>
        ) : null}
      </div>
    </header>
  );
}

function formatFetchedAt(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Helsinki",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function BetaBadge() {
  return (
    <button
      type="button"
      className="group relative inline-flex rounded-full bg-gold/20 px-2 py-0.5 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-gold outline-none hover:bg-gold/30 focus-visible:ring-2 focus-visible:ring-gold/60"
      aria-describedby="beta-tooltip"
    >
      Beta
      <span
        id="beta-tooltip"
        role="tooltip"
        className="pointer-events-none absolute top-[calc(100%+10px)] left-1/2 z-50 w-56 -translate-x-1/2 rounded-xl border border-white/10 bg-panel px-3 py-2.5 text-left text-xs font-normal normal-case leading-5 tracking-normal text-cream/90 opacity-0 shadow-[0_12px_32px_rgb(0_0_0_/_0.5)] transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100"
      >
        <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 border-t border-l border-white/10 bg-panel" />
        Early preview, not the final Hoop Finder. Courts, features, and data can still change.
      </span>
    </button>
  );
}
