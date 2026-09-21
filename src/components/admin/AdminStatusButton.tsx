"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, GlobeOff } from "lucide-react";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { SubmittedStatus } from "@/lib/submitted-courts";

export function AdminStatusButton({
  id,
  published,
  onStatusChange,
}: {
  id: string;
  published: boolean;
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

  return (
    <div>
      {published ? (
        <button
          type="button"
          disabled={saving}
          onClick={() => void setStatus("pending")}
          className="inline-flex items-center gap-1.5 rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-asphalt hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-70"
        >
          <GlobeOff className="size-4" aria-hidden />
          {saving ? copy.adminSaving : copy.adminUnpublish}
        </button>
      ) : (
        <button
          type="button"
          disabled={saving}
          onClick={() => void setStatus("published")}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/25 disabled:cursor-wait disabled:opacity-70"
        >
          <Globe className="size-4" aria-hidden />
          {saving ? copy.adminSaving : copy.adminPublish}
        </button>
      )}
      {error ? (
        <p className="mt-2 text-sm text-red-400">{copy.adminStatusError}</p>
      ) : null}
    </div>
  );
}
