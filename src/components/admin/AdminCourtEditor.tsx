"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useCopy } from "@/components/brand/LocaleProvider";
import { AddCourtFormPanel } from "@/components/add-court/AddCourtFormPanel";
import {
  AddCourtFields,
  FieldLabel,
  addCourtDetailsFromCourt,
  addCourtFormPayload,
  requiredFieldIssues,
  type AddCourtDetails,
} from "@/components/add-court/AddCourtFields";
import type { Court } from "@/lib/courts";

const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-white/25 bg-asphalt px-3 text-base text-white outline-none placeholder:text-white/55 focus:border-gold/50 focus:ring-2 focus:ring-gold/60 sm:text-sm";

export function AdminCourtEditor({
  court,
  email,
  onClose,
}: {
  court: Court;
  email: string;
  onClose: () => void;
}) {
  const copy = useCopy();
  const router = useRouter();
  const [name, setName] = useState(court.name);
  const [address, setAddress] = useState(court.address ?? "");
  const [visitorEmail, setVisitorEmail] = useState(email);
  const [details, setDetails] = useState<AddCourtDetails>(() =>
    addCourtDetailsFromCourt(court),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIssues, setShowIssues] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const extra = addCourtFormPayload(copy, {
      name,
      address,
      email: visitorEmail,
      details,
    });
    if (typeof extra === "string") {
      setShowIssues(true);
      setError(extra);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/courts/${encodeURIComponent(court.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, address, email: visitorEmail, ...extra }),
        },
      );
      if (!response.ok) throw new Error("save failed");
      onClose();
      router.refresh();
    } catch {
      setError(copy.adminEditError);
    } finally {
      setSaving(false);
    }
  }

  const issues = showIssues
    ? requiredFieldIssues({ name, address, email: visitorEmail })
    : { name: false, address: false, email: false };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60"
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <AddCourtFormPanel
        title={copy.adminEdit}
        collapsed={false}
        header={
          <div className="flex items-center">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-white/10 hover:text-white disabled:opacity-70"
            >
              {copy.adminEditCancel}
            </button>
          </div>
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
              form="admin-court-edit"
              disabled={saving}
              className="rounded-full bg-gold px-3 py-1.5 text-sm font-bold text-asphalt hover:bg-white disabled:cursor-default disabled:opacity-60"
            >
              {saving ? copy.adminSaving : copy.addCourtSubmit}
            </button>
          </div>
        }
      >
        <form id="admin-court-edit" onSubmit={save}>
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
              className={INPUT_CLASS}
              autoComplete="off"
            />
          </label>
          <label className="mt-2.5 block">
            <FieldLabel required invalid={issues.address}>{copy.addCourtAddress}</FieldLabel>
            <input
              aria-required="true"
              aria-invalid={issues.address}
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
          <label className="mt-2.5 block">
            <FieldLabel required invalid={issues.email}>{copy.addCourtEmail}</FieldLabel>
            <input
              aria-required="true"
              aria-invalid={issues.email}
              type="email"
              inputMode="email"
              maxLength={254}
              value={visitorEmail}
              onChange={(event) => {
                setVisitorEmail(event.target.value);
                setError(null);
              }}
              className={INPUT_CLASS}
              autoComplete="off"
            />
          </label>
          <AddCourtFields details={details} onChange={setDetails} />
        </form>
      </AddCourtFormPanel>
    </div>
  );
}
