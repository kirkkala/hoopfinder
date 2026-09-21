import { APP_NAME } from "@/lib/constants";

export function AppWordmark({
  region,
  className,
}: {
  region: string;
  className?: string;
}) {
  return (
    <span className={className ? `inline-block ${className}` : "inline-block"}>
      {APP_NAME}{" "}
      <span className="block text-right text-[0.62em] leading-none opacity-60 sm:inline">
        {region}
      </span>
    </span>
  );
}
