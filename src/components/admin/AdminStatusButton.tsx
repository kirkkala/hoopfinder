"use client";

import { EyeOff, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { SubmittedStatus } from "@/lib/submitted-courts";

export function AdminStatusButton({
  id,
  name,
  published,
  compact = false,
  notifies = true,
  onStatusChange,
}: {
  id: string;
  name: string;
  published: boolean;
  compact?: boolean;
  /** A new court tells the visitor by email. A correction does not. */
  notifies?: boolean;
  onStatusChange?: (status: SubmittedStatus) => void;
}) {
  const copy = useCopy();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function setStatus(status: SubmittedStatus) {
    const message =
      status === "published"
        ? notifies
          ? copy.adminPublishConfirm(name)
          : copy.adminPublishEditConfirm(name)
        : copy.adminUnpublishConfirm(name);
    if (!window.confirm(message)) return;
    setSaving(true);
    setError(false);
    try {
      const response = await fetch(`/api/admin/courts/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("status update failed");
      onStatusChange?.(status);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  const label = saving ? copy.adminSaving : published ? copy.adminUnpublish : copy.adminPublish;
  const StatusIcon = published ? EyeOff : Globe;

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
            ? "inline-flex h-8 items-center gap-1 rounded-full bg-white/15 px-2.5 text-xs font-bold text-white hover:bg-white/25 disabled:cursor-wait disabled:opacity-70"
            : published
              ? "inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/25 disabled:cursor-wait disabled:opacity-70"
              : "inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-bold text-asphalt hover:bg-white disabled:cursor-wait disabled:opacity-70"
        }
      >
        <StatusIcon className="size-3.5" aria-hidden />
        {label}
      </button>
      {error ? (
        <p
          className={
            compact ? "mt-1 max-w-40 text-right text-xs text-red-400" : "mt-2 text-sm text-red-400"
          }
        >
          {copy.adminStatusError}
        </p>
      ) : null}
    </div>
  );
}
