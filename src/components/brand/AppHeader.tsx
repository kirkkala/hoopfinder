import Link from "next/link";
import { basketball } from "@lucide/lab";
import { ArrowLeft, Icon } from "lucide-react";
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
