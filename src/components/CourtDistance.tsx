import { formatDistanceParts } from "@/lib/geo";

export function CourtDistance({
  km,
  className,
}: {
  km: number;
  className?: string;
}) {
  const { value, unit } = formatDistanceParts(km);
  return (
    <span
      className={[
        "inline-flex shrink-0 items-baseline gap-1 text-gold",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="font-display text-lg leading-none">{value}</span>
      <span className="font-sans font-semibold tracking-wide">{unit}</span>
    </span>
  );
}
