"use client";

import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import {
  type AddCourtDetails,
  AddCourtFields,
  addCourtDetailsFromCourt,
  addCourtDetailsPayload,
  addCourtFormPayload,
  FieldLabel,
  isEmailAddress,
} from "@/components/add-court/AddCourtFields";
import { AddCourtFormPanel } from "@/components/add-court/AddCourtFormPanel";
import { useIsAdmin } from "@/components/admin/AdminProvider";
import { useCopy } from "@/components/brand/LocaleProvider";
import { readPhotoEmail, rememberPhotoEmail } from "@/lib/court-photo-email";
import type { Court } from "@/lib/courts";
import { courtSource, sourceListingUrl } from "@/lib/sources";

const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-white/25 bg-asphalt px-3 text-base text-white outline-none placeholder:text-white/55 focus:border-gold/50 focus:ring-2 focus:ring-gold/60 sm:text-sm";

export function CourtEditForm({ court, onClose }: { court: Court; onClose: () => void }) {
  const copy = useCopy();
  const router = useRouter();
  const admin = useIsAdmin();
  const catalog = court.source !== "submitted";
  const source = courtSource(court.source);
  const listingUrl = sourceListingUrl(court.source, court.id);
  const [email, setEmail] = useState("");
  const [name, setName] = useState(court.name);
  const [address, setAddress] = useState(court.address ?? "");
  const [details, setDetails] = useState<AddCourtDetails>(() => addCourtDetailsFromCourt(court));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIssues, setShowIssues] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const saved = readPhotoEmail();
    if (saved) setEmail(saved);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !sending) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, sending]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending || sent) return;
    if (!admin && catalog && !isEmailAddress(email)) {
      setShowIssues(true);
      setError(copy.addCourtInvalid);
      return;
    }
    const body = catalog
      ? {
          courtId: court.id,
          ...(admin ? {} : { email }),
          details: { hoopHeight: details.hoopHeight },
        }
      : submittedBody();
    if (!body) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/court-edits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        published?: boolean;
      } | null;
      if (!response.ok) {
        setError(messageFor(copy, payload?.error));
        return;
      }
      if (email) rememberPhotoEmail(email);
      if (payload?.published) router.refresh();
      setSent(true);
    } catch {
      setError(copy.addCourtError);
    } finally {
      setSending(false);
    }
  }

  function submittedBody(): {
    courtId: string;
    email?: string;
    name: string;
    address: string;
    details: Record<string, unknown>;
  } | null {
    if (admin) {
      const missing = [
        name.trim() ? null : copy.addCourtName,
        address.trim() ? null : copy.addCourtAddress,
      ].filter((field) => field !== null);
      if (missing.length > 0) {
        setShowIssues(true);
        setError(copy.addCourtMissing(missing.join(", ")));
        return null;
      }
      const extra = addCourtDetailsPayload(details);
      if (extra === "invalid") {
        setShowIssues(true);
        setError(copy.addCourtMeasure);
        return null;
      }
      return { courtId: court.id, name: name.trim(), address: address.trim(), details: extra };
    }
    const extra = addCourtFormPayload(copy, { name, address, email, details });
    if (typeof extra === "string") {
      setShowIssues(true);
      setError(extra);
      return null;
    }
    return {
      courtId: court.id,
      email: email.trim(),
      name: name.trim(),
      address: address.trim(),
      details: extra,
    };
  }

  const emailInvalid = showIssues && !isEmailAddress(email);
  const title = sent
    ? admin
      ? copy.suggestEditSavedTitle
      : copy.suggestEditSuccessTitle
    : copy.suggestContribute;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60"
      onClick={() => {
        if (!sending) onClose();
      }}
    >
      <AddCourtFormPanel
        title={title}
        collapsed={false}
        header={
          <div className="flex items-center">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-white/10 hover:text-white disabled:opacity-70"
            >
              {sent ? copy.addCourtCancel : copy.adminEditCancel}
            </button>
          </div>
        }
        footer={
          sent ? null : (
            <div className="flex flex-col items-end gap-2">
              {error ? (
                <p role="alert" className="w-full text-sm text-red-400">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                form="court-edit"
                disabled={sending}
                className="rounded-full bg-gold px-3 py-1.5 text-sm font-bold text-asphalt hover:bg-white disabled:cursor-default disabled:opacity-60"
              >
                {sending ? copy.addCourtSending : copy.suggestEditSubmit}
              </button>
            </div>
          )
        }
      >
        {sent ? (
          <p className="py-2 text-sm text-ink-muted">
            {admin ? copy.suggestEditSaved : copy.suggestEditSuccess}
          </p>
        ) : (
          <form id="court-edit" onSubmit={(event) => void submit(event)}>
            {catalog && source ? (
              <p className="text-sm text-ink-muted">
                {copy.catalogEditBefore}{" "}
                {source.id === "lipas" ? copy.lipasEditSource : source.label}{" "}
                {copy.catalogEditAfter}
                {listingUrl ? (
                  <>
                    {" "}
                    <a
                      href={listingUrl}
                      className="inline-flex items-center gap-1 break-all text-gold hover:text-white"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {listingUrl.replace(/^https?:\/\//i, "").replace(/^www\./i, "")}
                      <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                    </a>
                  </>
                ) : null}
              </p>
            ) : (
              <p className="text-sm text-ink-muted">{copy.suggestEditSubmitted}</p>
            )}
            {catalog ? (
              <p className="mt-2 text-sm text-ink-muted">{copy.suggestHoopHeightLead}</p>
            ) : null}
            {admin ? null : (
              <label className="mt-3 block">
                <FieldLabel required invalid={emailInvalid}>
                  {copy.addCourtEmail}
                </FieldLabel>
                <input
                  aria-required="true"
                  aria-invalid={emailInvalid}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  maxLength={254}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                  }}
                  className={INPUT_CLASS}
                />
                <span className="mt-1 mb-12 block text-xs text-ink-muted">
                  {copy.addCourtEmailHelp}
                </span>
              </label>
            )}
            {catalog ? null : (
              <>
                <label className="mt-2.5 block">
                  <FieldLabel required invalid={showIssues && !name.trim()}>
                    {copy.addCourtName}
                  </FieldLabel>
                  <input
                    aria-required="true"
                    maxLength={120}
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setError(null);
                    }}
                    className={INPUT_CLASS}
                    autoComplete="off"
                  />
                </label>
                <label className="mt-2.5 block">
                  <FieldLabel required invalid={showIssues && !address.trim()}>
                    {copy.addCourtAddress}
                  </FieldLabel>
                  <input
                    aria-required="true"
                    maxLength={200}
                    value={address}
                    onChange={(event) => {
                      setAddress(event.target.value);
                      setError(null);
                    }}
                    className={INPUT_CLASS}
                    autoComplete="street-address"
                  />
                </label>
              </>
            )}
            <AddCourtFields
              variant={catalog ? "hoop" : "full"}
              flush={catalog}
              details={details}
              onChange={setDetails}
            />
          </form>
        )}
      </AddCourtFormPanel>
    </div>
  );
}

function messageFor(copy: ReturnType<typeof useCopy>, error: string | undefined): string {
  if (error === "unchanged") return copy.suggestEditUnchanged;
  if (error === "rate-limited") return copy.addCourtRateLimit;
  if (error === "email") return copy.addCourtEmailError;
  if (error === "unavailable") return copy.addCourtUnavailable;
  if (error === "invalid") return copy.addCourtInvalid;
  return copy.addCourtError;
}
