"use client";

import { basketball } from "@lucide/lab";
import { Camera, Icon, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { AdminStatusButton } from "@/components/admin/AdminStatusButton";
import { AppLink } from "@/components/brand/AppLink";
import { useCopy } from "@/components/brand/LocaleProvider";
import { editChangeLines } from "@/lib/court-edit-summary";
import type { AdminCourtWithPhotos } from "@/lib/court-photos";
import { courtHref, courtPathFromId, courtTitle } from "@/lib/courts";
import type { AdminSubmittedCourt } from "@/lib/submitted-courts";

const PAGE_TITLE = "font-display text-4xl tracking-wide text-white";

export function AdminPhotoList({ courts }: { courts: AdminCourtWithPhotos[] | null }) {
  const copy = useCopy();

  return (
    <>
      <h1 className={PAGE_TITLE}>{copy.adminPhotosTitle}</h1>
      {courts === null ? (
        <p className="mt-3 text-sm text-ink-muted">{copy.adminUnavailable}</p>
      ) : courts.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">{copy.adminPhotosEmpty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-white/10">
          {courts.map((court) => (
            <li key={court.id} className="flex items-center justify-between gap-3 py-2.5">
              {court.href ? (
                <AppLink href={court.href} className="font-semibold text-gold hover:text-white">
                  {courtTitle(court, copy)}
                </AppLink>
              ) : (
                <p className="font-semibold text-white">{courtTitle(court, copy)}</p>
              )}
              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm text-ink-muted">
                <Camera className="size-4" aria-hidden />
                <span className="sr-only">{copy.adminPhotoCount(court.photoCount)}</span>
                <span aria-hidden="true">{court.photoCount}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function AdminSubmittedCourts({ courts }: { courts: AdminSubmittedCourt[] | null }) {
  const copy = useCopy();
  if (courts === null) {
    return (
      <>
        <h1 className={PAGE_TITLE}>{copy.adminCourtsTitle}</h1>
        <p className="mt-6 text-sm text-ink-muted">{copy.adminUnavailable}</p>
      </>
    );
  }
  return <SubmittedList initialCourts={courts} />;
}

export function AdminEditsView({ courts }: { courts: AdminSubmittedCourt[] | null }) {
  const copy = useCopy();
  const router = useRouter();
  const [items, setItems] = useState(courts);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [removeFailed, setRemoveFailed] = useState(false);

  useEffect(() => {
    setItems(courts);
  }, [courts]);

  async function remove(id: string, name: string) {
    if (!window.confirm(copy.adminEditDeleteConfirm(name))) return;
    setRemoveFailed(false);
    const response = await fetch(`/api/admin/courts/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setRemoveFailed(true);
      return;
    }
    setItems((current) => current?.filter((court) => court.id !== id) ?? null);
    router.refresh();
  }

  const suggestions = items ? suggestionCourts(items) : null;
  const visible =
    suggestions === null
      ? null
      : filter === "all"
        ? suggestions
        : suggestions.filter((item) => item.status === filter);

  return (
    <>
      <h1 className={PAGE_TITLE}>{copy.adminEditSuggestions}</h1>
      {visible === null ? (
        <p className="mt-6 text-sm text-ink-muted">{copy.adminUnavailable}</p>
      ) : suggestions?.length === 0 ? (
        <p className="mt-6 text-sm text-ink-muted">{copy.adminEditsEmpty}</p>
      ) : (
        <>
          <StatusFilterToggle filter={filter} onChange={setFilter} />
          <p className="mt-3 font-display text-lg tracking-wide text-gold">
            {copy.adminEditCount(visible.length)}
          </p>
          {visible.length === 0 ? (
            <p className="mt-8 text-sm text-ink-muted">{copy.adminEditFilterEmpty}</p>
          ) : (
            <EditSuggestionList
              items={visible}
              onStatusChange={(id, status) =>
                setItems(
                  (current) =>
                    current?.map((item) => (item.id === id ? { ...item, status } : item)) ?? null,
                )
              }
              onRemove={remove}
            />
          )}
        </>
      )}
      {removeFailed ? (
        <p className="mt-3 text-sm text-red-400">{copy.adminEditDeleteError}</p>
      ) : null}
    </>
  );
}

function SubmittedList({ initialCourts }: { initialCourts: AdminSubmittedCourt[] }) {
  const copy = useCopy();
  const router = useRouter();
  const [courts, setCourts] = useState(initialCourts);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  useEffect(() => {
    setCourts(initialCourts);
  }, [initialCourts]);

  async function remove(id: string, name: string) {
    if (!window.confirm(copy.adminDeleteConfirm(name))) return;
    setSavingId(id);
    setErrorId(null);
    try {
      const response = await fetch(`/api/admin/courts/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("delete failed");
      setCourts((current) => current.filter((court) => court.id !== id));
      router.refresh();
    } catch {
      setErrorId(id);
    } finally {
      setSavingId(null);
    }
  }

  const submissions = courts.filter((court) => !court.editOf);

  if (submissions.length === 0) {
    return (
      <>
        <h1 className={PAGE_TITLE}>{copy.adminCourtsTitle}</h1>
        <div className="mt-10 flex flex-col items-center gap-2 px-6 py-12 text-center">
          <Icon iconNode={basketball} className="size-10 text-gold/70" aria-hidden />
          <p className="font-display text-2xl tracking-wide text-white">{copy.adminEmpty}</p>
        </div>
      </>
    );
  }

  const visible =
    filter === "all" ? submissions : submissions.filter((court) => court.status === filter);

  return (
    <>
      <h1 className={PAGE_TITLE}>{copy.adminCourtsTitle}</h1>
      <StatusFilterToggle filter={filter} onChange={setFilter} />
      <p className="mt-3 font-display text-lg tracking-wide text-gold">
        {copy.adminCourtCount(visible.length)}
      </p>
      {visible.length === 0 ? (
        <p className="mt-8 text-sm text-ink-muted">{copy.adminFilterEmpty}</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {visible.map((court) => {
            const saving = savingId === court.id;
            const published = court.status === "published";
            const confirmed = court.status === "pending";
            return (
              <li
                key={court.id}
                className={`rounded-2xl border p-4 text-sm ${
                  published
                    ? "border-emerald-400/40 bg-emerald-400/10"
                    : confirmed
                      ? "border-yellow-400/40 bg-yellow-400/10"
                      : "border-white/15 bg-white/5"
                }`}
              >
                <AdminCardToolbar status={court.status}>
                  <AdminStatusButton
                    id={court.id}
                    name={court.name}
                    published={published}
                    onStatusChange={(status) => {
                      setCourts((current) =>
                        current.map((item) => (item.id === court.id ? { ...item, status } : item)),
                      );
                    }}
                  />
                  <AdminDeleteButton
                    label={copy.adminDelete}
                    disabled={saving}
                    onClick={() => void remove(court.id, court.name)}
                  />
                </AdminCardToolbar>
                <AppLink
                  href={courtHref(court.court)}
                  className="mt-2 inline-flex items-center gap-1 font-semibold text-gold hover:text-white"
                >
                  {court.name}
                </AppLink>
                <p className="mt-1 text-ink-muted">{court.address}</p>
                <a href={`mailto:${court.email}`} className="mt-1 text-gold hover:text-white">
                  {court.email}
                </a>
                {court.greeting ? (
                  <p className="mt-2 whitespace-pre-wrap text-ink">
                    <span className="text-ink-muted">{copy.addCourtGreeting}: </span>
                    {court.greeting}
                  </p>
                ) : null}
                {errorId === court.id ? (
                  <p className="mt-3 text-sm text-red-400">{copy.adminDeleteError}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

type SuggestionLink = {
  id: string;
  href: string;
  name: string;
  email: string;
  status: AdminSubmittedCourt["status"];
  changes: AdminSubmittedCourt["changes"];
};

function suggestionCourts(courts: AdminSubmittedCourt[]): SuggestionLink[] {
  return courts.flatMap((court) => {
    if (!court.editOf) return [];
    const path = courtPathFromId(court.editOf);
    if (!path) return [];
    return [
      {
        id: court.id,
        href: `/courts/${path}`,
        name: court.name,
        email: court.email,
        status: court.status,
        changes: court.changes,
      },
    ];
  });
}

export function EditSuggestionList({
  items,
  onStatusChange,
  onRemove,
}: {
  items: SuggestionLink[];
  onStatusChange?: (id: string, status: AdminSubmittedCourt["status"]) => void;
  onRemove?: (id: string, name: string) => void;
}) {
  const copy = useCopy();
  return (
    <ul className="mt-5 space-y-3">
      {items.map((item) => {
        const published = item.status === "published";
        const confirmed = item.status === "pending";
        return (
          <li
            key={item.id}
            className={`rounded-2xl border p-4 text-sm ${
              published
                ? "border-emerald-400/40 bg-emerald-400/10"
                : confirmed
                  ? "border-yellow-400/40 bg-yellow-400/10"
                  : "border-white/15 bg-white/5"
            }`}
          >
            <AdminCardToolbar status={item.status}>
              {published ? null : (
                <AdminStatusButton
                  id={item.id}
                  name={item.name}
                  published={false}
                  notifies={false}
                  onStatusChange={(status) => onStatusChange?.(item.id, status)}
                />
              )}
              <AdminDeleteButton
                label={copy.adminEditDelete}
                onClick={() => onRemove?.(item.id, item.name)}
              />
            </AdminCardToolbar>
            <AppLink
              href={item.href}
              className="mt-2 block font-semibold text-gold hover:text-white"
            >
              {item.name}
            </AppLink>
            <dl className="mt-2 space-y-0.5">
              {editChangeLines(item.changes ?? {}, copy).map((line) => (
                <div key={line.key}>
                  <dt className="inline text-ink-muted">{line.label}: </dt>
                  <dd className="inline font-semibold text-white">{line.value}</dd>
                </div>
              ))}
            </dl>
            <a href={`mailto:${item.email}`} className="mt-1 block text-gold hover:text-white">
              {item.email}
            </a>
            {item.status === "unconfirmed" ? (
              <p className="mt-2 text-ink-muted">{copy.adminEditUnconfirmed}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

type StatusFilter = "all" | "unconfirmed" | "pending" | "published";

const STATUS_FILTERS: StatusFilter[] = ["all", "unconfirmed", "pending", "published"];

function StatusFilterToggle({
  filter,
  onChange,
}: {
  filter: StatusFilter;
  onChange: (filter: StatusFilter) => void;
}) {
  const copy = useCopy();
  return (
    <div
      className="mt-4 flex w-fit max-w-full flex-wrap rounded-full bg-white/10 p-0.5 text-xs font-bold"
      role="group"
      aria-label={copy.adminFilter}
    >
      {STATUS_FILTERS.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={filter === option}
          onClick={() => onChange(option)}
          className={`rounded-full px-3 py-1.5 ${
            filter === option ? "bg-gold text-asphalt" : "text-ink/70 hover:text-white"
          }`}
        >
          {option === "all"
            ? copy.adminFilterAll
            : option === "published"
              ? copy.adminStatusPublished
              : option === "unconfirmed"
                ? copy.adminFilterUnconfirmed
                : copy.adminFilterPending}
        </button>
      ))}
    </div>
  );
}

function AdminCardToolbar({
  status,
  children,
}: {
  status: "unconfirmed" | "pending" | "published";
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <StatusBadge status={status} />
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">{children}</div>
    </div>
  );
}

function AdminDeleteButton({
  label,
  disabled = false,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-ink/70 hover:bg-red-500/15 hover:text-red-300 disabled:cursor-wait disabled:opacity-70"
    >
      <Trash2 className="size-3.5" aria-hidden />
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: "unconfirmed" | "pending" | "published" }) {
  const copy = useCopy();
  const label =
    status === "published"
      ? copy.adminStatusPublished
      : status === "pending"
        ? copy.adminStatusConfirmed
        : copy.adminStatusUnconfirmed;
  const className =
    status === "published"
      ? "bg-emerald-500 text-white"
      : status === "pending"
        ? "bg-emerald-400/20 text-emerald-100"
        : "bg-white/15 text-white/80";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${className}`}>{label}</span>;
}
