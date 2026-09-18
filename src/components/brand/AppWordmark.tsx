import { APP_NAME } from "@/lib/constants";

export function AppWordmark({
  region,
  className,
}: {
  region: string;
  className?: string;
}) {
  return (
    <span className={className}>
      {APP_NAME}{" "}
      <span className="text-[0.62em] opacity-60">{region}</span>
    </span>
  );
}
