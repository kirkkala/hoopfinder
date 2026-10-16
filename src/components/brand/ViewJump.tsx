import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

/** Plain link between the map and the court list. Not a Next link, so the map does not prefetch the list. */
export function ViewJump({
  href,
  direction,
  children,
  className,
}: {
  href: string;
  direction: "to-list" | "to-map";
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={[
        "inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm font-bold text-gold outline-none hover:border-gold/50 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {direction === "to-map" ? <ArrowLeft className="size-4 shrink-0" aria-hidden /> : null}
      {children}
      {direction === "to-list" ? <ArrowRight className="size-4 shrink-0" aria-hidden /> : null}
    </a>
  );
}
