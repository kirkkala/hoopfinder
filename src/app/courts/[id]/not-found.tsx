import Link from "next/link";
import { basketball } from "@lucide/lab";
import { ArrowLeft, Icon } from "lucide-react";
import { AppFooter } from "@/components/brand/AppFooter";

export default function CourtNotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-asphalt">
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <Icon iconNode={basketball} className="size-10 text-gold" aria-hidden />
      <h1 className="font-display text-4xl tracking-wide text-white">Airball</h1>
      <p className="text-sm text-ink-muted">
        This hoop is missing, is not a basketball court, or the id is invalid.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-hnmky-red px-4 py-2 text-sm font-bold text-white"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to hoops
      </Link>
      </main>
      <AppFooter />
    </div>
  );
}
