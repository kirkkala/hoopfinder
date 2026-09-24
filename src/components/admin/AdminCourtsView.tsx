"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { basketball } from "@lucide/lab";
import { Icon, Map, MapPin, Trash2 } from "lucide-react";
import { AdminStatusButton } from "@/components/admin/AdminStatusButton";
import { AppFooter } from "@/components/brand/AppFooter";
import { AppHeader } from "@/components/brand/AppHeader";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { FetchedAtBySource } from "@/lib/catalog";
import { homeCourtHref } from "@/lib/courts";
import type { AdminSubmittedCourt } from "@/lib/submitted-courts";
import { formatFetchedAt } from "@/lib/time";

export function AdminCourtsView({
  courtCount,
  fetchedAtBySource,
  courts,
}: {
  courtCount: number;
  fetchedAtBySource: FetchedAtBySource;
  courts: AdminSubmittedCourt[] | null;
}) {
  const copy = useCopy();

  return (
    <div className="flex min-h-dvh flex-col bg-asphalt">
      <AppHeader
        fetchedAtBySource={fetchedAtBySource}
        courtCount={courtCount}
      />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="font-display text-4xl tracking-wide text-white">
          {copy.adminTitle}
        </h1>
        {courts === null ? (
          <p className="mt-6 text-sm text-ink-muted">{copy.adminUnavailable}</p>
        ) : (
          <SubmittedList initialCourts={courts} />
        )}
      </main>
      <AppFooter />
    </div>
  );
}

function SubmittedList({
  initialCourts,
}: {
  initialCourts: AdminSubmittedCourt[];
}) {
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
      const response = await fetch(
        `/api/admin/courts/${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("delete failed");
      setCourts((current) => current.filter((court) => court.id !== id));
      router.refresh();
    } catch {
      setErrorId(id);
    } finally {
      setSavingId(null);
    }
  }

  if (courts.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center gap-2 px-6 py-12 text-center">
        <Icon iconNode={basketball} className="size-10 text-gold/70" aria-hidden />
        <p className="font-display text-2xl tracking-wide text-white">
          {copy.adminEmpty}
        </p>
      </div>
    );
  }

  const visible =
    filter === "all"
      ? courts
      : courts.filter((court) => court.status === filter);

  return (
    <>
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
              className={`relative rounded-2xl border p-4 pr-24 ${
                published
                  ? "border-emerald-400/40 bg-emerald-400/10"
                  : confirmed
                    ? "border-yellow-400/40 bg-yellow-400/10"
                    : "border-white/15 bg-white/5"
              }`}
            >
              <button
                type="button"
                disabled={saving}
                onClick={() => void remove(court.id, court.name)}
                className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-ink/70 hover:bg-red-500/15 hover:text-red-300 disabled:cursor-wait disabled:opacity-70"
              >
                <Trash2 className="size-3.5" aria-hidden />
                {copy.adminDelete}
              </button>
              <div className="flex flex-col gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="max-w-full font-semibold text-white">
                      {court.name}
                    </h2>
                    <StatusBadge status={court.status} />
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{court.address}</p>
                  <p className="mt-1 text-sm text-ink-muted">
                    <a
                      href={`mailto:${court.email}`}
                      className="text-gold hover:text-white"
                    >
                      {court.email}
                    </a>
                  </p>
                  <p className="mt-2 text-xs text-ink-muted">
                    {copy.adminSubmittedAt}{" "}
                    <time dateTime={court.createdAt}>
                      {formatFetchedAt(court.createdAt)}
                    </time>
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Link
                    href={homeCourtHref({
                      id: court.id,
                      source: published ? "submitted" : "pending",
                    })}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-ink/80 hover:bg-white/10 hover:text-white"
                  >
                    <Map className="size-3.5" aria-hidden />
                    {copy.adminShowOnMap}
                  </Link>
                  <a
                    href={`https://www.google.com/maps?q=${court.lat},${court.lon}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-ink/80 hover:bg-white/10 hover:text-white"
                  >
                    <MapPin className="size-3.5" aria-hidden />
                    {copy.adminShowOnGoogleMaps}
                  </a>
                  {confirmed || published ? (
                    <AdminStatusButton
                      id={court.id}
                      published={published}
                      onStatusChange={(status) => {
                        setCourts((current) =>
                          current.map((item) =>
                            item.id === court.id ? { ...item, status } : item,
                          ),
                        );
                      }}
                    />
                  ) : null}
                </div>
              </div>
              {errorId === court.id ? (
                <p className="mt-3 text-sm text-red-400">
                  {copy.adminDeleteError}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      )}
    </>
  );
}

type StatusFilter = "all" | "unconfirmed" | "pending" | "published";

const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "unconfirmed",
  "pending",
  "published",
];

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
            filter === option
              ? "bg-gold text-asphalt"
              : "text-ink/70 hover:text-white"
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

function StatusBadge({
  status,
}: {
  status: "unconfirmed" | "pending" | "published";
}) {
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
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}
