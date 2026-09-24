"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { SubmittedStatus } from "@/lib/submitted-courts";

export function AdminStatusButton({
  id,
  published,
  compact = false,
  onStatusChange,
}: {
  id: string;
  published: boolean;
  compact?: boolean;
  onStatusChange?: (status: SubmittedStatus) => void;
}) {
  const copy = useCopy();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function setStatus(status: SubmittedStatus) {
    setSaving(true);
    setError(false);
    try {
      const response = await fetch(
        `/api/admin/courts/${encodeURIComponent(id)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      if (!response.ok) throw new Error("status update failed");
      onStatusChange?.(status);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  const label = saving
    ? copy.adminSaving
    : published
      ? copy.adminUnpublish
      : copy.adminPublish;

  return (
    <div className={compact ? "flex flex-col items-end" : undefined}>
      <button
        type="button"
        disabled={saving}
        aria-label={label}
        title={label}
        onClick={() => void setStatus(published ? "pending" : "published")}
        className={
          compact
            ? "inline-flex h-8 items-center rounded-full bg-white/15 px-2.5 text-xs font-bold text-white hover:bg-white/25 disabled:cursor-wait disabled:opacity-70"
            : published
              ? "rounded-full px-2 py-0.5 text-xs font-bold text-ink/70 hover:bg-white/10 hover:text-white disabled:cursor-wait disabled:opacity-70"
              : "rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-asphalt hover:bg-white disabled:cursor-wait disabled:opacity-70"
        }
      >
        {label}
      </button>
      {error ? (
        <p className={compact ? "mt-1 max-w-40 text-right text-xs text-red-400" : "mt-2 text-sm text-red-400"}>
          {copy.adminStatusError}
        </p>
      ) : null}
    </div>
  );
}
