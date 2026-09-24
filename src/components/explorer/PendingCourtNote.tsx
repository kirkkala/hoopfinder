"use client";

import { useCopy } from "@/components/brand/LocaleProvider";
import { formatFetchedAt } from "@/lib/time";

export function PendingCourtNote({
  createdAt,
  className,
}: {
  createdAt: string;
  className?: string;
}) {
  const copy = useCopy();
  return (
    <div className={className}>
      <p className="text-sm text-ink-muted">{copy.pendingComingSoon}</p>
      <p className="mt-0.5 text-xs text-ink-muted">
        {copy.adminSubmittedAt}{" "}
        <time dateTime={createdAt}>{formatFetchedAt(createdAt, true)}</time>
      </p>
    </div>
  );
}
