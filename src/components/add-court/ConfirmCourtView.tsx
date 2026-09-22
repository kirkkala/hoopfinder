"use client";

import Link from "next/link";
import { basketball } from "@lucide/lab";
import { Icon } from "lucide-react";
import { AppFooter } from "@/components/brand/AppFooter";
import { AppHeader } from "@/components/brand/AppHeader";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { FetchedAtBySource } from "@/lib/catalog";

export function ConfirmCourtView({
  courtCount,
  fetchedAtBySource,
}: {
  courtCount: number;
  fetchedAtBySource: FetchedAtBySource;
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
          {copy.confirmCourtInvalidTitle}
        </h1>
        <p className="text-sm text-ink-muted">
          {copy.confirmCourtInvalid}
        </p>
        <Link
          href="/"
          className="mt-2 text-sm font-medium text-ink/80 underline-offset-2 hover:text-white hover:underline"
        >
          {copy.backToMap}
        </Link>
      </main>
      <AppFooter />
    </div>
  );
}
