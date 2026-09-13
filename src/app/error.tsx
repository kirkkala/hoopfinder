"use client";

import { useEffect } from "react";
import { CircleAlert, RotateCcw } from "lucide-react";
import { AppFooter } from "@/components/brand/AppFooter";
import { useCopy } from "@/components/brand/LocaleProvider";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const copy = useCopy();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col bg-asphalt">
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <CircleAlert className="size-10 text-gold" aria-hidden />
      <h1 className="font-display text-4xl tracking-wide text-white">{copy.errorTitle}</h1>
      <p className="text-sm text-ink-muted">
        {copy.errorHint}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white"
      >
        <RotateCcw className="size-4" aria-hidden />
        {copy.tryAgain}
      </button>
      </main>
      <AppFooter />
    </div>
  );
}
