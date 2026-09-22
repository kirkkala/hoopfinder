"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { AppHeader } from "@/components/brand/AppHeader";
import { AppFooter } from "@/components/brand/AppFooter";
import { LocateMeButton } from "@/components/LocateMeButton";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { Copy } from "@/lib/copy";
import type { FetchedAtBySource } from "@/lib/catalog";
import { homeCourtHref, type ExplorerCourt } from "@/lib/courts";
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
  const router = useRouter();
  const [courts, setCourts] = useState<ExplorerCourt[]>([]);
  const [draft, setDraft] = useState<Coordinates | null>(null);
  const [draftStep, setDraftStep] = useState<"confirm" | "form">("confirm");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [mapAlert, setMapAlert] = useState<AddCourtMapAlert | null>(null);
  const { origin, status: locationStatus, request } = useLocationStatus();
  const [locateSeq, setLocateSeq] = useState(0);
  const [infoOpen, setInfoOpen] = useState(true);

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
    setDraftStep("confirm");
    setName("");
    setAddress("");
    setEmail("");
    setError(null);
    setSending(false);
  }

  function backToConfirm() {
    setDraftStep("confirm");
    setError(null);
  }

  useEffect(() => {
    if (!draft && !mapAlert) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (mapAlert) {
        setMapAlert(null);
        return;
      }
      if (draft) {
        if (draftStep === "form") {
          backToConfirm();
          return;
        }
        clearDraft();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [draft, draftStep, mapAlert]);

  function placeDraft(coords: Coordinates) {
    setDraft(coords);
    setDraftStep("confirm");
    setMapAlert(null);
    setError(null);
  }

  function showAlert(kind: AddCourtMapAlert) {
    if (kind !== "zoom") {
      clearDraft();
    }
    setMapAlert(kind);
  }

  function requestLocation() {
    setLocateSeq((n) => n + 1);
    if (!origin || locationStatus !== "granted") request();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft || draftStep !== "form" || sending) return;
    setSending(true);
    setError(null);
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
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      router.push(homeCourtHref(payload.court, { thanks: true }));
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

      <div className="shrink-0 border-b border-white/10">
        <button
          type="button"
          onClick={() => setInfoOpen((open) => !open)}
          aria-expanded={infoOpen}
          className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left sm:px-4 lg:px-6"
        >
          <p className="font-display text-lg tracking-wide text-gold">
            {copy.addCourtInfoTitle}
          </p>
          <ChevronDown
            aria-hidden
            className={`size-5 shrink-0 text-ink-muted transition-transform ${
              infoOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {infoOpen ? (
          <div className="px-3 pb-3 sm:px-4 lg:px-6">
            <p className="text-sm text-ink/90">{copy.addCourtLead}</p>
            <p className="mt-1 text-sm text-ink-muted">{copy.addCourtHint}</p>
          </div>
        ) : null}
      </div>

      <section className="relative min-h-0 flex-1 bg-asphalt">
        <div className="absolute inset-0">
          <AddCourtMap
            courts={courts}
            origin={origin}
            locateSeq={locateSeq}
            draft={draft}
            confirm={
              draftStep === "confirm" ? (
                <ConfirmPlaceCard
                  onCancel={clearDraft}
                  onConfirm={() => setDraftStep("form")}
                />
              ) : null
            }
            onPlace={placeDraft}
            onAlert={showAlert}
            onCanPlaceChange={(next) => {
              if (next) {
                setMapAlert((current) => (current === "zoom" ? null : current));
              }
            }}
          />
        </div>

        <div className="pointer-events-none absolute top-3 left-3 z-10 drop-shadow-[0_8px_20px_rgb(0_0_0_/_0.35)]">
          <div className="pointer-events-auto">
            <LocateMeButton
              compact
              status={locationStatus}
              onClick={requestLocation}
            />
          </div>
        </div>

        {draft && draftStep === "form" ? (
          <AddMapPanel
            title={copy.addCourt}
            onClose={backToConfirm}
            footer={
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={clearDraft}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-white/10 hover:text-white"
                >
                  {copy.addCourtCancel}
                </button>
                <button
                  type="submit"
                  form="add-court-form"
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
            }
          >
            <form id="add-court-form" onSubmit={handleSubmit}>
              <p className="text-xs text-ink-muted">
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
            </form>
          </AddMapPanel>
        ) : mapAlert && alertCopy ? (
          <AddMapPanel
            title={alertCopy.title}
            onClose={() => setMapAlert(null)}
            muted={mapAlert === "zoom"}
            onMap
          >
            {alertCopy.body}
          </AddMapPanel>
        ) : null}
      </section>

      <AppFooter />
    </div>
  );
}

function ConfirmPlaceCard({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const copy = useCopy();
  return (
    <div
      className="flex items-center gap-1 p-1"
      role="dialog"
      aria-label={copy.addCourtConfirmHere}
    >
      <button
        type="button"
        onClick={onConfirm}
        className="rounded-full bg-gold px-3 py-1 text-sm font-bold text-asphalt hover:bg-white"
      >
        {copy.addCourtConfirmHere}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-full p-1 text-ink-muted hover:bg-white/10 hover:text-white"
        aria-label={copy.close}
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}

function AddMapPanel({
  title,
  onClose,
  muted = false,
  onMap = false,
  footer,
  children,
}: {
  title: string;
  onClose: () => void;
  muted?: boolean;
  onMap?: boolean;
  footer?: ReactNode;
  children?: ReactNode;
}) {
  const copy = useCopy();
  return (
    <div
      className={
        onMap
          ? "pointer-events-none absolute inset-x-0 top-14 z-20 flex justify-center px-3 sm:px-4"
          : "pointer-events-none fixed inset-x-0 top-[calc(var(--app-header-height,3.5rem)+3rem)] z-30 flex justify-center px-3 wide:absolute wide:top-14 wide:z-20 sm:px-4"
      }
    >
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="add-court-alert-title"
        className={`pointer-events-auto flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel/95 shadow-[0_12px_32px_rgb(0_0_0_/_0.45)] ${
          onMap
            ? "max-h-[min(70dvh,32rem)]"
            : "max-h-[calc(100dvh-var(--app-header-height,3.5rem)-4rem)] wide:max-h-[min(70dvh,32rem)]"
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-2 px-3 pt-3">
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
        <div className="min-h-0 overflow-y-auto overscroll-contain px-3 py-2">
          {typeof children === "string" ? (
            <p className={`text-sm ${muted ? "text-ink-muted" : "text-ink/90"}`}>
              {children}
            </p>
          ) : (
            children
          )}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-white/10 px-3 py-2.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function submitError(copy: Copy, error: string | undefined): string {
  if (error === "unavailable") return copy.addCourtUnavailable;
  if (error === "email") return copy.addCourtEmailError;
  if (error === "invalid") return copy.addCourtInvalid;
  return copy.addCourtError;
}
