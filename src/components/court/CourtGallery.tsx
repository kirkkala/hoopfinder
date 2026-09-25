"use client";

import { useState } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { CourtPhoto, CourtPhotoError } from "@/lib/court-photos";

export function CourtGallery({
  courtId,
  courtName,
  photos,
}: {
  courtId: string;
  courtName: string;
  photos: CourtPhoto[];
}) {
  const copy = useCopy();
  const [items, setItems] = useState(photos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | null) {
    if (!file || uploading) return;
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.set("courtId", courtId);
      body.set("file", file);
      const response = await fetch("/api/court-photos", { method: "POST", body });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: CourtPhotoError;
        } | null;
        setError(messageFor(copy, payload?.error));
        return;
      }
      const photo = (await response.json()) as CourtPhoto;
      setItems((current) => [...current, photo]);
    } catch {
      setError(copy.photoError);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="border-b border-white/10 px-3 pb-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-gold/80">{copy.photos}</h2>
      {items.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {items.map((photo) => (
            <li key={photo.id}>
              <img
                src={photo.url}
                alt={copy.photoAlt(courtName)}
                className="size-16 rounded-lg object-cover"
              />
            </li>
          ))}
        </ul>
      ) : null}
      <label
        className={`mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-xs font-bold text-asphalt hover:bg-white ${
          uploading ? "pointer-events-none opacity-70" : ""
        }`}
      >
        {uploading ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : (
          <ImagePlus className="size-4" aria-hidden />
        )}
        {copy.addPhoto}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            event.target.value = "";
            void onFile(file);
          }}
        />
      </label>
      {error ? (
        <p role="status" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function messageFor(
  copy: ReturnType<typeof useCopy>,
  error: CourtPhotoError | undefined,
): string {
  if (error === "too-large") return copy.photoTooLarge;
  if (error === "type") return copy.photoType;
  if (error === "full") return copy.photosFull;
  return copy.photoError;
}
