"use client";

import { AppLink } from "@/components/brand/AppLink";
import { basketball } from "@lucide/lab";
import { Icon } from "lucide-react";
import { AppFooter } from "@/components/brand/AppFooter";
import { AppHeader } from "@/components/brand/AppHeader";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { FetchedAtBySource } from "@/lib/catalog";

export function ConfirmCourtView({
  courtCount,
  fetchedAtBySource,
  notifyFailed = false,
}: {
  courtCount: number;
  fetchedAtBySource: FetchedAtBySource;
  notifyFailed?: boolean;
}) {
  const copy = useCopy();

  return (
    <div className="flex min-h-dvh flex-col bg-asphalt">
      <AppHeader
        fetchedAtBySource={fetchedAtBySource}
        courtCount={courtCount}
      />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <Icon iconNode={basketball} className="size-10 text-gold" aria-hidden />
        <h1 className="font-display text-4xl tracking-wide text-white">
          {notifyFailed ? copy.confirmNotifyFailedTitle : copy.confirmCourtInvalidTitle}
        </h1>
        <p className="text-sm text-ink-muted">
          {notifyFailed ? copy.confirmNotifyFailed : copy.confirmCourtInvalid}
        </p>
        <AppLink
          href="/"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-ink/80 underline-offset-2 hover:text-white hover:underline"
        >
          {copy.backToMap}
        </AppLink>
      </main>
      <AppFooter />
    </div>
  );
}
