"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { AdminFeedback } from "@/lib/feedback";
import { formatFetchedAt } from "@/lib/time";

export function AdminFeedbackList({ items }: { items: AdminFeedback[] | null }) {
  const copy = useCopy();

  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl tracking-wide text-white">{copy.adminFeedbackTitle}</h2>
      {items === null ? (
        <p className="mt-3 text-sm text-ink-muted">{copy.adminUnavailable}</p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">{copy.adminFeedbackEmpty}</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink-muted">{copy.adminFeedbackCount(items.length)}</p>
          <ul className="mt-3 space-y-3">
            {items.map((item) => (
              <FeedbackItem key={item.id} item={item} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function FeedbackItem({ item }: { item: AdminFeedback }) {
  const copy = useCopy();
  const [open, setOpen] = useState(false);
  const sender = item.email ?? copy.adminFeedbackNoEmail;

  return (
    <li className="rounded-2xl border border-white/15 bg-white/5 text-sm">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/60"
        >
          <ChevronDown
            aria-hidden
            className={`size-4 shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
          />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold break-words text-white">{item.title}</span>
            <span className="mt-0.5 block truncate text-ink-muted">
              {copy.sentBy}: {sender}
            </span>
          </span>
          <time dateTime={item.createdAt} className="shrink-0 text-xs text-ink-muted">
            {formatFetchedAt(item.createdAt)}
          </time>
        </button>
      </h3>
      {open ? (
        <div className="border-t border-white/10 px-4 py-3">
          <p className="break-words whitespace-pre-wrap text-ink">{item.body}</p>
          <Notes item={item} />
        </div>
      ) : null}
    </li>
  );
}

function Notes({ item }: { item: AdminFeedback }) {
  const copy = useCopy();
  const router = useRouter();
  const [notes, setNotes] = useState(item.notes);
  const [saved, setSaved] = useState(item.notes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setNotes(item.notes);
    setSaved(item.notes);
  }, [item.notes]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving || notes === saved) return;
    setSaving(true);
    setError(false);
    try {
      const response = await fetch(`/api/admin/feedback/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) throw new Error("save failed");
      setSaved(notes);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void save(event)} className="mt-4">
      <label className="block">
        <span className="mb-1 block text-sm font-bold text-ink/85">
          {copy.adminFeedbackNotes}
          {saved.trim() ? (
            <span className="ml-2 font-medium text-gold">{copy.adminFeedbackNotesSaved}</span>
          ) : null}
        </span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={4000}
          rows={4}
          placeholder={copy.adminFeedbackNotesHint}
          disabled={saving}
          className="w-full rounded-xl border border-white/25 bg-asphalt px-3 py-2.5 text-base text-white outline-none placeholder:text-white/55 focus:border-gold/50 focus:ring-2 focus:ring-gold/60 sm:text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={saving || notes === saved}
        className="mt-2 rounded-full bg-gold px-3 py-1.5 text-xs font-bold text-asphalt hover:bg-[#ffe0a3] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? copy.adminSaving : copy.adminFeedbackSaveNotes}
      </button>
      {error ? <p className="mt-2 text-sm text-red-400">{copy.adminEditError}</p> : null}
    </form>
  );
}
