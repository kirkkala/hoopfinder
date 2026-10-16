import { List, Map as MapIcon } from "lucide-react";
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
  const Icon = direction === "to-map" ? MapIcon : List;
  return (
    <a
      href={href}
      className={[
        "inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm font-bold text-gold outline-none hover:border-gold/50 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {children}
    </a>
  );
}
