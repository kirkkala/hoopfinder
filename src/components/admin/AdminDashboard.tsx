"use client";

import { AppLink } from "@/components/brand/AppLink";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { AdminOverview } from "@/lib/admin-overview";

const TITLE = "font-display text-2xl tracking-wide text-white";

export function AdminDashboard({ overview }: { overview: AdminOverview }) {
  const copy = useCopy();
  const edits = overview.edits;

  return (
    <>
      <h1 className="font-display text-4xl tracking-wide text-white">{copy.adminTitle}</h1>
      <ul className="mt-8 divide-y divide-white/10">
        <Item
          href="/admin/feedback"
          title={copy.adminFeedbackTitle}
          detail={
            overview.feedback === null
              ? copy.adminUnavailable
              : copy.adminFeedbackCount(overview.feedback)
          }
        />
        <Item
          href="/admin/photos"
          title={copy.adminPhotosTitle}
          detail={
            overview.photos === null || overview.photoCourts === null
              ? copy.adminUnavailable
              : `${copy.adminPhotoCount(overview.photos)}, ${copy.adminCourtCount(overview.photoCourts)}`
          }
        />
        <Item
          href="/admin/courts"
          title={copy.adminCourtsTitle}
          detail={
            overview.courts === null ? copy.adminUnavailable : copy.adminCourtCount(overview.courts)
          }
        />
        <Item
          href="/admin/edits"
          title={copy.adminEditSuggestions}
          detail={
            edits === null
              ? copy.adminUnavailable
              : `${copy.adminStatusUnconfirmed} ${edits.unconfirmed}, ${copy.adminStatusConfirmed} ${edits.pending}, ${copy.adminStatusPublished} ${edits.published}`
          }
        />
      </ul>
    </>
  );
}

function Item({ href, title, detail }: { href: string; title: string; detail: string }) {
  return (
    <li>
      <AppLink
        href={href}
        className="block rounded-2xl px-1 py-4 outline-none hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        <span className={TITLE}>{title}</span>
        <span className="mt-1 block text-sm text-ink-muted">{detail}</span>
      </AppLink>
    </li>
  );
}
