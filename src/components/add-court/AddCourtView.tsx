"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { AppHeader } from "@/components/brand/AppHeader";
import { AppFooter } from "@/components/brand/AppFooter";
import { LocateMeButton } from "@/components/LocateMeButton";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { Copy } from "@/lib/copy";
import type { FetchedAtBySource } from "@/lib/catalog";
import type { ExplorerCourt } from "@/lib/courts";
import type { AddCourtMapAlert } from "@/components/add-court/AddCourtMap";
import type { Coordinates } from "@/lib/geo";
import { fetchMapCourts } from "@/lib/map-courts";
import { useLocationStatus } from "@/lib/origin";

const AddCourtMap = dynamic(
  () => import("@/components/add-court/AddCourtMap").then((mod) => mod.AddCourtMap),
  { ssr: false },
);

const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-white/25 bg-asphalt px-3 text-base text-white outline-none placeholder:text-white/55 focus:border-gold/50 focus:ring-2 focus:ring-gold/60 sm:text-sm";

export function AddCourtView({
  courtCount,
  fetchedAtBySource,
}: {
  courtCount: number;
  fetchedAtBySource: FetchedAtBySource;
}) {
  const copy = useCopy();
  const [courts, setCourts] = useState<ExplorerCourt[]>([]);
  const [draft, setDraft] = useState<Coordinates | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const [mapAlert, setMapAlert] = useState<AddCourtMapAlert | null>(null);
  const { origin, status: locationStatus, request } = useLocationStatus();
  const [locateSeq, setLocateSeq] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetchMapCourts(controller.signal)
      .then((loaded) => {
        if (!controller.signal.aborted) setCourts(loaded);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCourts([]);
      });
    return () => controller.abort();
  }, []);

  function clearDraft() {
    setDraft(null);
    setName("");
    setAddress("");
    setEmail("");
    setError(null);
    setSending(false);
  }

  useEffect(() => {
    if (!draft && !mapAlert && !success) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (mapAlert) {
        setMapAlert(null);
        return;
      }
      if (draft) {
        clearDraft();
        return;
      }
      setSuccess(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [draft, mapAlert, success]);

  function placeDraft(coords: Coordinates) {
    setDraft(coords);
    setMapAlert(null);
    setError(null);
    setSuccess(false);
  }

  function showAlert(kind: AddCourtMapAlert) {
    if (kind !== "zoom") {
      clearDraft();
      setSuccess(false);
    }
    setMapAlert(kind);
  }

  function requestLocation() {
    setLocateSeq((n) => n + 1);
    if (!origin || locationStatus !== "granted") request();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft || sending) return;
    setSending(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch("/api/submitted-courts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          email,
          lat: draft.lat,
          lon: draft.lon,
        }),
      });
      const payload = (await response.json()) as
        | { court: ExplorerCourt }
        | { error?: string };
      if (!response.ok || !("court" in payload)) {
        const code = "error" in payload ? payload.error : undefined;
        if (code === "too-close" || code === "outside-finland") {
          showAlert(code);
          return;
        }
        setError(submitError(copy, code));
        return;
      }
      setCourts((current) => [
        payload.court,
        ...current.filter((item) => item.id !== payload.court.id),
      ]);
      clearDraft();
      setSuccess(true);
    } catch {
      setError(copy.addCourtError);
    } finally {
      setSending(false);
    }
  }

  const alertCopy = mapAlert
    ? {
        zoom: {
          title: copy.addCourtZoomTitle,
          body: copy.addCourtHintZoom,
        },
        "too-close": {
          title: copy.addCourtTooClose,
          body: copy.addCourtTooCloseBody,
        },
        "outside-finland": {
          title: copy.addCourtOutsideFinland,
          body: null,
        },
        "on-water": {
          title: copy.addCourtOnWater,
          body: copy.addCourtOnWaterBody,
        },
      }[mapAlert]
    : null;

  return (
    <div className="flex h-dvh flex-col overflow-hidden overscroll-none bg-asphalt">
      <AppHeader
        fetchedAtBySource={fetchedAtBySource}
        courtCount={courtCount}
      />

      <div className="shrink-0 border-b border-white/10 px-3 py-3 sm:px-4 lg:px-6">
        <p className="font-display text-lg tracking-wide text-gold">
          {copy.addCourtInfoTitle}
        </p>
        <p className="mt-1 text-sm text-ink/90">{copy.addCourtLead}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2.5">
          <p className="text-sm text-ink-muted">{copy.addCourtHint}</p>
          <LocateMeButton status={locationStatus} onClick={requestLocation} />
        </div>
      </div>

      <section className="relative min-h-0 flex-1 bg-asphalt">
        <div className="absolute inset-0">
          <AddCourtMap
            courts={courts}
            origin={origin}
            locateSeq={locateSeq}
            draft={draft}
            onPlace={placeDraft}
            onAlert={showAlert}
            onCanPlaceChange={(next) => {
              if (next) {
                setMapAlert((current) => (current === "zoom" ? null : current));
              }
            }}
          />
        </div>

        {draft ? (
          <AddMapPanel title={copy.addCourt} onClose={clearDraft}>
            <form onSubmit={handleSubmit}>
              <p className="mt-1 text-xs text-ink-muted">
                {draft.lat.toFixed(5)}, {draft.lon.toFixed(5)}
              </p>
              <label className="mt-3 block">
                <span className="mb-1 block text-sm text-ink/85">
                  {copy.addCourtName}
                </span>
                <input
                  required
                  maxLength={120}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={copy.addCourtNamePlaceholder}
                  className={INPUT_CLASS}
                  autoComplete="off"
                />
              </label>
              <label className="mt-2.5 block">
                <span className="mb-1 block text-sm text-ink/85">
                  {copy.addCourtAddress}
                </span>
                <input
                  required
                  maxLength={200}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder={copy.addCourtAddressPlaceholder}
                  className={INPUT_CLASS}
                  autoComplete="street-address"
                />
              </label>
              <label className="mt-2.5 block">
                <span className="mb-1 block text-sm text-ink/85">
                  {copy.addCourtEmail}
                </span>
                <input
                  required
                  type="email"
                  inputMode="email"
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={copy.addCourtEmailPlaceholder}
                  className={INPUT_CLASS}
                  autoComplete="email"
                />
                <span className="mt-1 block text-xs text-ink-muted">
                  {copy.addCourtEmailHelp}
                </span>
              </label>
              {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={clearDraft}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-white/10 hover:text-white"
                >
                  {copy.addCourtCancel}
                </button>
                <button
                  type="submit"
                  disabled={
                    sending ||
                    !name.trim() ||
                    !address.trim() ||
                    !email.trim()
                  }
                  className="rounded-full bg-gold px-3 py-1.5 text-sm font-bold text-asphalt hover:bg-white disabled:cursor-default disabled:opacity-60"
                >
                  {sending ? copy.addCourtSending : copy.addCourtSubmit}
                </button>
              </div>
            </form>
          </AddMapPanel>
        ) : mapAlert && alertCopy ? (
          <AddMapPanel
            title={alertCopy.title}
            onClose={() => setMapAlert(null)}
            muted={mapAlert === "zoom"}
          >
            {alertCopy.body}
          </AddMapPanel>
        ) : success ? (
          <AddMapPanel
            title={copy.addCourtInfoTitle}
            onClose={() => setSuccess(false)}
          >
            <p className="text-emerald-300">{copy.addCourtSuccess}</p>
          </AddMapPanel>
        ) : null}
      </section>

      <AppFooter />
    </div>
  );
}

function AddMapPanel({
  title,
  onClose,
  muted = false,
  children,
}: {
  title: string;
  onClose: () => void;
  muted?: boolean;
  children?: ReactNode;
}) {
  const copy = useCopy();
  return (
    <div className="pointer-events-none absolute inset-x-0 top-14 z-20 flex justify-center px-3 sm:top-16 sm:px-4">
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="add-court-alert-title"
        className="pointer-events-auto max-h-[min(70dvh,32rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-white/10 bg-panel/95 p-3 shadow-[0_12px_32px_rgb(0_0_0_/_0.45)]"
      >
        <div className="flex items-start justify-between gap-2">
          <p
            id="add-court-alert-title"
            className="font-display text-lg tracking-wide text-gold"
          >
            {title}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-ink-muted hover:bg-white/10 hover:text-white"
            aria-label={copy.close}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        {typeof children === "string" ? (
          <p className={`mt-1 text-sm ${muted ? "text-ink-muted" : "text-ink/90"}`}>
            {children}
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function submitError(copy: Copy, error: string | undefined): string {
  if (error === "unavailable") return copy.addCourtUnavailable;
  if (error === "invalid") return copy.addCourtInvalid;
  return copy.addCourtError;
}
