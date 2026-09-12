import Link from "next/link";

export default function CourtNotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-display text-4xl tracking-wide text-white">Airball</h1>
      <p className="text-sm text-ink-muted">
        This hoop is missing, is not a basketball court, or the id is invalid.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-hnmky-red px-4 py-2 text-sm font-bold text-white"
      >
        Back to hoops
      </Link>
    </main>
  );
}
