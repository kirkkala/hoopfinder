"use client";

import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ImagePlus,
  LoaderCircle,
  Trash2,
} from "lucide-react";
import { useIsAdmin } from "@/components/admin/AdminProvider";
import { AddCourtFormPanel } from "@/components/add-court/AddCourtFormPanel";
import { FieldLabel } from "@/components/add-court/AddCourtFields";
import { useCopy } from "@/components/brand/LocaleProvider";
import { COURT_PHOTO_MAX_BYTES } from "@/lib/constants";
import type { CourtPhoto, CourtPhotoError } from "@/lib/court-photos";

const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-white/25 bg-asphalt px-3 text-base text-white outline-none placeholder:text-white/55 focus:border-gold/50 focus:ring-2 focus:ring-gold/60 sm:text-sm";

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
  const fileRef = React.useRef<HTMLInputElement>(null);
  const pendingIndex = React.useRef<number | null>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: photos.length > 1,
    watchDrag: photos.length > 1,
  });
  const [items, setItems] = React.useState(photos);
  const [adding, setAdding] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [index, setIndex] = React.useState(0);

  function closeDialog() {
    if (uploading) return;
    setError(null);
    setAdding(false);
  }

  React.useEffect(() => {
    if (!adding) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeDialog();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [adding, uploading]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (uploading) return;
    if (!file) {
      setError(copy.photoFileMissing);
      return;
    }
    if (file.size > COURT_PHOTO_MAX_BYTES) {
      setError(copy.photoTooLarge);
      return;
    }
    if (!emailLooksValid(email)) {
      setError(copy.photoEmailInvalid);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.set("courtId", courtId);
      body.set("email", email);
      body.set("description", description);
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
      pendingIndex.current = items.length;
      setItems((current) => [...current, photo]);
      setFile(null);
      setDescription("");
      setAdding(false);
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
      const removedIndex = items.findIndex((photo) => photo.id === id);
      const current = emblaApi?.selectedScrollSnap() ?? index;
      let next = current;
      if (removedIndex < current) next = current - 1;
      else if (removedIndex === current) next = Math.min(current, items.length - 2);
      pendingIndex.current = Math.max(0, next);
      setItems((currentItems) => currentItems.filter((photo) => photo.id !== id));
    } catch {
      setError(copy.photoChangeError);
    } finally {
      setBusy(false);
    }
  }

  const selectedIndex = items.length === 0 ? 0 : Math.min(index, items.length - 1);
  const selected = items[selectedIndex];
  const headingId = `court-photos-${courtId}`;

  React.useEffect(() => {
    if (!emblaApi || items.length === 0) return;
    const api = emblaApi;
    const startIndex =
      pendingIndex.current ?? Math.min(api.selectedScrollSnap(), items.length - 1);
    pendingIndex.current = null;
    api.reInit({
      loop: items.length > 1,
      watchDrag: items.length > 1,
      startIndex,
    });
    function onSelect() {
      setIndex(api.selectedScrollSnap());
    }
    api.on("select", onSelect);
    onSelect();
    return () => {
      api.off("select", onSelect);
    };
  }, [emblaApi, items]);

  function onGalleryKeyDown(event: React.KeyboardEvent) {
    if (adding || items.length < 2) return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      emblaApi?.scrollPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      emblaApi?.scrollNext();
    }
  }

  return (
    <section
      className="border-b border-white/10 px-3 py-4"
      aria-roledescription={copy.photoCarousel}
      aria-labelledby={headingId}
      onKeyDown={onGalleryKeyDown}
    >
      <h2
        id={headingId}
        className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-gold/80"
      >
        <ImageIcon className="size-4 shrink-0" aria-hidden />
        {copy.photogallery}
      </h2>
      {selected ? (
        <figure className="group relative mt-2">
          <div ref={emblaRef} className="overflow-hidden rounded-xl bg-asphalt">
            <div className="flex h-72">
              {items.map((photo, photoIndex) => (
                <div
                  key={photo.id}
                  className="min-w-0 flex-[0_0_100%]"
                  role="group"
                  aria-roledescription={copy.photoCarouselSlide}
                  aria-label={copy.photoSlide(photoIndex + 1, items.length, photo.description)}
                  aria-hidden={photoIndex !== selectedIndex}
                >
                  <img
                    src={photo.url}
                    alt=""
                    draggable={false}
                    className="h-full w-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
          {items.length > 1 ? (
            <>
              <StageArrow
                side="previous"
                label={copy.photoPrevious}
                onClick={() => emblaApi?.scrollPrev()}
              />
              <StageArrow
                side="next"
                label={copy.photoNext}
                onClick={() => emblaApi?.scrollNext()}
              />
            </>
          ) : null}
          {isAdmin && items.length === 1 ? (
            <PhotoDelete
              label={copy.photoDelete}
              disabled={busy}
              onClick={() => void remove(selected.id)}
            />
          ) : null}
          {selected.description ? (
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 line-clamp-2 rounded-b-xl bg-gradient-to-t from-black/80 to-transparent px-3 pt-6 pb-2 text-sm leading-snug text-white">
              {selected.description}
            </figcaption>
          ) : null}
          <p className="sr-only" aria-live="polite">
            {copy.photoSlide(selectedIndex + 1, items.length, selected.description)}
          </p>
        </figure>
      ) : null}
      {items.length > 1 ? (
        <ul className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
          {items.map((photo, photoIndex) => (
            <li key={photo.id} className="relative">
              <button
                type="button"
                aria-label={photo.description || copy.photoAlt(courtName)}
                aria-pressed={photoIndex === selectedIndex}
                onClick={() => emblaApi?.scrollTo(photoIndex)}
                className={`block w-full rounded-lg outline-none ring-2 transition duration-150 focus-visible:ring-gold ${
                  photoIndex === selectedIndex
                    ? "ring-gold"
                    : "ring-transparent hover:ring-gold/70"
                }`}
              >
                <img
                  src={photo.thumbUrl}
                  alt=""
                  className="aspect-square w-full rounded-lg object-cover"
                />
              </button>
              {isAdmin ? (
                <PhotoDelete
                  label={copy.photoDelete}
                  disabled={busy}
                  onClick={() => void remove(photo.id)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="text-ink-muted">{copy.noPhotos}</p>
      ) : null}
      <button
        type="button"
        onClick={() => {
          setError(null);
          setAdding(true);
        }}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-xs font-bold text-asphalt hover:bg-white"
      >
        <ImagePlus className="size-4" aria-hidden />
        {copy.addPhoto}
      </button>
      {error && !adding ? (
        <p role="status" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {adding ? (
        <div
          className="fixed inset-0 z-50 bg-black/60"
          onClick={closeDialog}
        >
          <AddCourtFormPanel
            title={copy.addPhoto}
            collapsed={false}
            header={
              <button
                type="button"
                onClick={closeDialog}
                disabled={uploading}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-white/10 hover:text-white disabled:opacity-70"
              >
                {copy.addCourtCancel}
              </button>
            }
            footer={
              <div className="flex flex-col items-end gap-2">
                {error ? (
                  <p role="alert" className="w-full text-sm text-red-400">
                    {error}
                  </p>
                ) : null}
                <button
                  type="submit"
                  form="add-court-photo"
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-sm font-bold text-asphalt hover:bg-white disabled:cursor-default disabled:opacity-60"
                >
                  {uploading ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
                  {copy.addCourtSubmit}
                </button>
              </div>
            }
          >
            <form id="add-court-photo" onSubmit={(event) => void submit(event)}>
              <p className="text-sm leading-snug text-ink/80">{copy.photoGuide}</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white hover:bg-white hover:text-asphalt disabled:opacity-70"
                >
                  <ImagePlus className="size-4" aria-hidden />
                  {copy.photoChoose}
                </button>
                {file ? (
                  <span className="min-w-0 truncate text-sm text-white/70">{file.name}</span>
                ) : null}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null);
                    setError(null);
                  }}
                />
              </div>
              <label className="mt-6 block">
                <FieldLabel>{copy.photoDescription}</FieldLabel>
                <textarea
                  maxLength={200}
                  rows={2}
                  value={description}
                  placeholder={copy.photoDescriptionPlaceholder}
                  disabled={uploading}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    setError(null);
                  }}
                  className={`${INPUT_CLASS} h-auto py-2`}
                />
              </label>
              <label className="mt-2.5 block">
                <FieldLabel required>{copy.addCourtEmail}</FieldLabel>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={254}
                  value={email}
                  disabled={uploading}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                  }}
                  className={INPUT_CLASS}
                />
                <span className="mt-1 block text-sm text-ink-muted">{copy.photoEmailHidden}</span>
              </label>
            </form>
          </AddCourtFormPanel>
        </div>
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
  if (error === "rate-limited") return copy.photoRateLimit;
  if (error === "email") return copy.photoEmailInvalid;
  return copy.photoError;
}

function emailLooksValid(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function StageArrow({
  side,
  label,
  onClick,
}: {
  side: "previous" | "next";
  label: string;
  onClick: () => void;
}) {
  const Icon = side === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`absolute top-1/2 z-10 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-asphalt/80 text-white opacity-0 ring-1 ring-white/25 transition duration-150 pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 hover:bg-white hover:text-asphalt focus-visible:opacity-100 ${
        side === "previous" ? "left-2" : "right-2"
      }`}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

function PhotoDelete({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="absolute -top-1.5 -right-1.5 inline-flex size-5 items-center justify-center rounded-full bg-asphalt text-white ring-1 ring-white/20 hover:bg-white hover:text-asphalt disabled:opacity-50"
    >
      <Trash2 className="size-3" aria-hidden />
    </button>
  );
}
