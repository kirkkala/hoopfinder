"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CircleHelp, LoaderCircle, X } from "lucide-react";
import { LocateMeButton } from "@/components/LocateMeButton";
import { AppHeader } from "@/components/brand/AppHeader";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { FetchedAtBySource } from "@/lib/catalog";
import type { Copy } from "@/lib/copy";
import { homeCourtHref, type ExplorerCourt } from "@/lib/courts";
import { AddCourtFormPanel } from "@/components/add-court/AddCourtFormPanel";
import {
  AddCourtFields,
  FieldLabel,
  addCourtDetailsDirty,
  addCourtFormPayload,
  requiredFieldIssues,
  EMPTY_ADD_COURT_DETAILS,
  type AddCourtDetails,
} from "@/components/add-court/AddCourtFields";
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

const TEXT_BUTTON_CLASS =
  "rounded-full px-3 py-1.5 text-sm font-medium text-ink/80 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60";

const GOLD_BUTTON_CLASS =
  "rounded-full bg-gold px-3 py-1.5 text-sm font-bold text-asphalt outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-gold/60";

const MAP_CHROME_OFFSET =
  "calc(max(0.75rem, env(safe-area-inset-top)) + 4.25rem)";

export function AddCourtView({
  courtCount,
  fetchedAtBySource,
}: {
  courtCount: number;
  fetchedAtBySource: FetchedAtBySource;
}) {
  const copy = useCopy();
  const router = useRouter();
  const infoCtaRef = useRef<HTMLButtonElement>(null);
  const [courts, setCourts] = useState<ExplorerCourt[]>([]);
  const [draft, setDraft] = useState<Coordinates | null>(null);
  const [draftStep, setDraftStep] = useState<"confirm" | "form">("confirm");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [addressLoading, setAddressLoading] = useState(false);
  const addressEdited = useRef(false);
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState<AddCourtDetails>(EMPTY_ADD_COURT_DETAILS);
  const [error, setError] = useState<string | null>(null);
  const [showIssues, setShowIssues] = useState(false);
  const [sending, setSending] = useState(false);
  const [mapAlert, setMapAlert] = useState<AddCourtMapAlert | null>(null);
  const { origin, status: locationStatus, request } = useLocationStatus();
  const [locateSeq, setLocateSeq] = useState(0);
  const [infoOpen, setInfoOpen] = useState(true);
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const showFormRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!infoOpen) return;
    infoCtaRef.current?.focus();
  }, [infoOpen]);

  useEffect(() => {
    if (draftStep !== "form" || !formCollapsed || discardConfirm) return;
    showFormRef.current?.focus();
  }, [discardConfirm, draftStep, formCollapsed]);

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
    addressEdited.current = false;
    setDraft(null);
    setDraftStep("confirm");
    setName("");
    setAddress("");
    setAddressLoading(false);
    setEmail("");
    setDetails(EMPTY_ADD_COURT_DETAILS);
    setError(null);
    setShowIssues(false);
    setSending(false);
    setFormCollapsed(false);
    setDiscardConfirm(false);
  }

  function formIsDirty() {
    return Boolean(
      name.trim() || addressEdited.current || email.trim() || addCourtDetailsDirty(details),
    );
  }

  function requestCancel() {
    if (formIsDirty()) {
      setDiscardConfirm(true);
      return;
    }
    clearDraft();
  }

  function keepForm() {
    setDiscardConfirm(false);
    setFormCollapsed(false);
  }

  useEffect(() => {
    if (!infoOpen && !draft && !mapAlert) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (infoOpen) {
        setInfoOpen(false);
        return;
      }
      if (mapAlert) {
        setMapAlert(null);
        return;
      }
      if (draft) {
        if (draftStep === "form") {
          if (discardConfirm) {
            setDiscardConfirm(false);
            setFormCollapsed(false);
            return;
          }
          setFormCollapsed((collapsed) => !collapsed);
          return;
        }
        clearDraft();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [discardConfirm, draft, draftStep, infoOpen, mapAlert]);

  function placeDraft(coords: Coordinates) {
    addressEdited.current = false;
    setAddress("");
    setDraft(coords);
    setDraftStep("confirm");
    setMapAlert(null);
    setError(null);
  }

  useEffect(() => {
    if (!draft) return;
    const controller = new AbortController();
    setAddressLoading(true);
    void fetch(`/api/places/reverse?lat=${draft.lat}&lon=${draft.lon}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { address?: string | null } | null) => {
        const suggestion = payload?.address?.trim();
        if (!controller.signal.aborted && !addressEdited.current && suggestion) {
          setAddress(suggestion);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setAddressLoading(false);
      });
    return () => controller.abort();
  }, [draft]);

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
    const extra = addCourtFormPayload(copy, { name, address, email, details });
    if (typeof extra === "string") {
      setShowIssues(true);
      setError(extra);
      return;
    }
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
          ...extra,
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

  const issues = showIssues
    ? requiredFieldIssues({ name, address, email })
    : { name: false, address: false, email: false };

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
        title={copy.addCourt}
        courtCount={courtCount}
        fetchedAtBySource={fetchedAtBySource}
      />
      <section className="relative min-h-0 flex-1 bg-asphalt">
        <div className="add-court-map absolute inset-0" inert={infoOpen}>
          <AddCourtMap
            courts={courts}
            origin={origin}
            locateSeq={locateSeq}
            draft={draft}
            confirm={
              draftStep === "confirm" ? (
                <ConfirmPlaceCard
                  onCancel={clearDraft}
                  onConfirm={() => {
                    setDraftStep("form");
                    setFormCollapsed(false);
                    setDiscardConfirm(false);
                  }}
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

        <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-start p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pl-[max(0.75rem,env(safe-area-inset-left))]">
          <div className="pointer-events-auto flex max-w-full flex-wrap items-center gap-2 drop-shadow-[0_8px_20px_rgb(0_0_0_/_0.35)]">
            <LocateMeButton
              iconOnly
              status={locationStatus}
              onClick={requestLocation}
            />
            {infoOpen ? null : (
              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                aria-label={copy.addCourtInfoOpen}
                className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-asphalt/95 px-3 text-white ring-1 ring-white/15 outline-none hover:bg-gold hover:text-asphalt focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                <CircleHelp aria-hidden className="size-5" />
                <span className="text-sm font-bold">{copy.addCourtInfoOpen}</span>
              </button>
            )}
          </div>
        </div>

        {infoOpen ? (
          <div
            className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/60 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:items-center"
            style={{ paddingTop: MAP_CHROME_OFFSET }}
            onClick={() => setInfoOpen(false)}
          >
            <AddCourtInfoDialog
              ctaRef={infoCtaRef}
              onClose={() => setInfoOpen(false)}
            />
          </div>
        ) : null}

        {draft && draftStep === "form" ? (
          <AddCourtFormPanel
            inert={infoOpen}
            collapsed={formCollapsed || discardConfirm}
            title={copy.addCourt}
            header={
              discardConfirm ? (
                <div className="basis-full">
                  <p role="status" className="text-sm text-ink/90">
                    {copy.addCourtDiscardAsk}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={keepForm}
                      className={GOLD_BUTTON_CLASS}
                    >
                      {copy.addCourtDiscardKeep}
                    </button>
                    <button
                      type="button"
                      onClick={clearDraft}
                      className={TEXT_BUTTON_CLASS}
                    >
                      {copy.addCourtDiscardConfirm}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    ref={showFormRef}
                    type="button"
                    aria-expanded={!formCollapsed}
                    aria-controls={formCollapsed ? undefined : "add-court-form"}
                    onClick={() => setFormCollapsed((collapsed) => !collapsed)}
                    className={formCollapsed ? GOLD_BUTTON_CLASS : TEXT_BUTTON_CLASS}
                  >
                    {formCollapsed ? copy.addCourtShowForm : copy.addCourtShowMap}
                  </button>
                  <button
                    type="button"
                    onClick={requestCancel}
                    className={TEXT_BUTTON_CLASS}
                  >
                    {copy.addCourtCancel}
                  </button>
                </div>
              )
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
                  form="add-court-form"
                  disabled={sending}
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
                <FieldLabel required invalid={issues.name}>{copy.addCourtName}</FieldLabel>
                <input
                  aria-required="true"
                  aria-invalid={issues.name}
                  maxLength={120}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError(null);
                  }}
                  placeholder={copy.addCourtNamePlaceholder}
                  className={INPUT_CLASS}
                  autoComplete="off"
                />
              </label>
              <label className="mt-2.5 block">
                <FieldLabel required invalid={issues.address}>{copy.addCourtAddress}</FieldLabel>
                <span className="relative block">
                  <input
                    aria-required="true"
                    aria-invalid={issues.address}
                    maxLength={200}
                    value={address}
                    onChange={(event) => {
                      addressEdited.current = true;
                      setAddress(event.target.value);
                      setError(null);
                    }}
                    placeholder={
                      addressLoading
                        ? copy.addCourtAddressLoading
                        : copy.addCourtAddressPlaceholder
                    }
                    className={`${INPUT_CLASS} ${addressLoading ? "pr-10" : ""}`}
                    autoComplete="street-address"
                  />
                  {addressLoading ? (
                    <LoaderCircle
                      className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-gold"
                      aria-label={copy.addCourtAddressLoading}
                    />
                  ) : null}
                </span>
              </label>
              <label className="mt-2.5 block">
                <FieldLabel required invalid={issues.email}>{copy.addCourtEmail}</FieldLabel>
                <input
                  aria-required="true"
                  aria-invalid={issues.email}
                  type="email"
                  inputMode="email"
                  maxLength={254}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                  }}
                  className={INPUT_CLASS}
                  autoComplete="email"
                />
                <span className="mt-1 block text-xs text-ink-muted">
                  {copy.addCourtEmailHelp}
                </span>
                <span className="mt-1 block text-xs text-ink-muted">
                  {copy.addCourtEmailUpdates}
                </span>
                <span className="mt-1 block text-xs text-ink-muted">
                  {copy.addCourtEmailPrivacy}
                </span>
              </label>
              <AddCourtFields details={details} onChange={setDetails} />
            </form>
          </AddCourtFormPanel>
        ) : mapAlert && alertCopy ? (
          <AddMapPanel
            inert={infoOpen}
            title={alertCopy.title}
            onClose={() => setMapAlert(null)}
            muted={mapAlert === "zoom"}
          >
            {alertCopy.body}
          </AddMapPanel>
        ) : null}
      </section>
    </div>
  );
}

function AddCourtInfoDialog({
  ctaRef,
  onClose,
}: {
  ctaRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const copy = useCopy();
  return (
    <div
      id="add-court-info"
      role="dialog"
      aria-modal="false"
      aria-labelledby="add-court-info-title"
      onClick={(event) => event.stopPropagation()}
      className="relative mt-3 h-fit w-full max-w-md rounded-3xl border border-white/10 bg-panel shadow-[0_24px_64px_rgb(0_0_0_/_0.55)] sm:mt-0 sm:max-w-lg"
    >
      <div className="court-arc pointer-events-none absolute inset-0 rounded-3xl opacity-40" />
      <div className="relative px-6 pt-1 pb-5">
        <p className="mt-4 text-base leading-6 text-ink/90">{copy.addCourtLead}</p>
        <p className="mt-2 text-base leading-6 text-ink-muted">{copy.addCourtHint}</p>
        <button
          ref={ctaRef}
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-gold px-4 py-3 text-base font-bold text-asphalt hover:bg-[#ffe0a3]"
        >
          {copy.okBroCta}
        </button>
      </div>
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
  inert = false,
  footer,
  children,
}: {
  title: string;
  onClose: () => void;
  muted?: boolean;
  inert?: boolean;
  footer?: ReactNode;
  children?: ReactNode;
}) {
  const copy = useCopy();
  return (
    <div
      inert={inert}
      className="pointer-events-none absolute inset-x-0 z-20 flex justify-center px-3 sm:px-4"
      style={{ top: MAP_CHROME_OFFSET }}
    >
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="add-court-alert-title"
        className="pointer-events-auto flex max-h-[min(70dvh,32rem)] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel/95 shadow-[0_12px_32px_rgb(0_0_0_/_0.45)]"
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
  if (error === "rate-limited") return copy.addCourtRateLimit;
  return copy.addCourtError;
}
