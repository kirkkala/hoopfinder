import Link from "next/link";
import { BallIcon } from "@/components/brand/BallIcon";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function AppHeader({ backHref }: { backHref?: string }) {
  return (
    <header className="relative overflow-hidden border-b border-white/10 bg-asphalt">
      <div className="court-arc pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative flex items-center gap-3 px-4 py-3 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="shrink-0 text-sm font-medium text-gold hover:text-white"
            >
              ← Hoops
            </Link>
          ) : (
            <BallIcon className="h-10 w-10 shrink-0 drop-shadow-lg" />
          )}
          <div className="min-w-0">
            <p className="font-display text-2xl leading-none tracking-wide text-white">
              {APP_NAME}
            </p>
            <p className="mt-0.5 truncate text-sm text-cream/70">{APP_TAGLINE}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
