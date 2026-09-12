"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-display text-4xl tracking-wide text-white">Timeout</h1>
      <p className="text-sm text-ink-muted">
        The app missed this shot. Retry without leaving the page.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-full bg-hnmky-red px-4 py-2 text-sm font-bold text-white"
      >
        Try again
      </button>
    </main>
  );
}
