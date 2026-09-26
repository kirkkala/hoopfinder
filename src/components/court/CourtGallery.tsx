"use client";

import * as React from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useIsAdmin } from "@/components/admin/AdminProvider";
import { useCopy } from "@/components/brand/LocaleProvider";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
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
  const isAdmin = useIsAdmin();
  const [items, setItems] = React.useState(photos);
  const [uploading, setUploading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

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

  async function remove(id: string) {
    if (busy || !window.confirm(copy.photoDeleteConfirm)) return;
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`/api/court-photos/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setError(copy.photoChangeError);
        return;
      }
      setItems((current) => current.filter((photo) => photo.id !== id));
    } catch {
      setError(copy.photoChangeError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border-b border-white/10 px-3 pb-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-gold/80">{copy.photos}</h2>
      {items.length > 0 ? (
        <>
          <ul className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2">
            {items.map((photo, photoIndex) => (
              <li key={photo.id} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIndex(photoIndex);
                    setOpen(true);
                  }}
                  className="group block w-full rounded-lg outline-none ring-2 ring-transparent transition duration-150 hover:ring-gold focus-visible:ring-gold"
                >
                  <img
                    src={photo.url}
                    alt={copy.photoAlt(courtName)}
                    className="aspect-square w-full rounded-lg object-cover transition duration-150 group-hover:brightness-110 group-focus-visible:brightness-110"
                  />
                </button>
                {isAdmin ? (
                  <button
                    type="button"
                    aria-label={copy.photoDelete}
                    title={copy.photoDelete}
                    disabled={busy}
                    onClick={() => void remove(photo.id)}
                    className="absolute -top-1.5 -right-1.5 inline-flex size-5 items-center justify-center rounded-full bg-asphalt text-white ring-1 ring-white/20 hover:bg-white hover:text-asphalt disabled:opacity-50"
                  >
                    <Trash2 className="size-3" aria-hidden />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          <Lightbox
            open={open}
            index={index}
            close={() => setOpen(false)}
            slides={items.map((photo) => ({
              src: photo.url,
              alt: copy.photoAlt(courtName),
            }))}
          />
        </>
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
