"use client";

import { AppLink } from "@/components/brand/AppLink";
import { signIn, signOut } from "next-auth/react";
import { basketball } from "@lucide/lab";
import { Icon } from "lucide-react";
import { AppFooter } from "@/components/brand/AppFooter";
import { AppHeader } from "@/components/brand/AppHeader";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { FetchedAtBySource } from "@/lib/catalog";

export function LoginView({
  configured,
  callbackUrl,
  signedInEmail,
  error,
  courtCount,
  fetchedAtBySource,
}: {
  configured: boolean;
  callbackUrl: string;
  signedInEmail: string | null;
  error: boolean;
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
        <Icon
          iconNode={basketball}
          className="size-10 text-gold"
          aria-hidden
        />
        <h1 className="font-display text-4xl tracking-wide text-white">
          {copy.signInTitle}
        </h1>
        <p className="text-sm text-ink-muted">
          {signedInEmail
            ? copy.signInNotAdmin(signedInEmail)
            : copy.signInNotRequired}
        </p>
        {error ? (
          <p className="text-sm text-red-400">{copy.signInError}</p>
        ) : null}
        {signedInEmail ? (
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/login" })}
            className="mt-2 inline-flex items-center rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/25"
          >
            {copy.signOut}
          </button>
        ) : configured ? (
          <button
            type="button"
            onClick={() => void signIn("google", { callbackUrl })}
            className="mt-2 inline-flex items-center rounded-full bg-gold px-4 py-2 text-sm font-bold text-asphalt hover:bg-white"
          >
            {copy.signInGoogle}
          </button>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">{copy.signInUnavailable}</p>
        )}
        <AppLink
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-ink/80 underline-offset-2 hover:text-white hover:underline"
        >
          {copy.backToMap}
        </AppLink>
      </main>
      <AppFooter />
    </div>
  );
}
