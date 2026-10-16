"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect } from "react";
import { AppFooter } from "@/components/brand/AppFooter";
import { AppHeader } from "@/components/brand/AppHeader";
import { useFeedback } from "@/components/brand/FeedbackDialog";
import { useCopy } from "@/components/brand/LocaleProvider";
import { useDatabaseUnavailable } from "@/components/brand/SiteBanner";
import { ViewJump } from "@/components/brand/ViewJump";
import { LocateMeButton } from "@/components/LocateMeButton";
import type { FetchedAtBySource } from "@/lib/catalog";
import { COURT_INDEX_PATH, GITHUB_URL, INFO_PARAM, MAP_PATH } from "@/lib/constants";
import { useLocationStatus } from "@/lib/origin";
import { markVisited } from "@/lib/visit";

export function HomeView({ fetchedAtBySource }: { fetchedAtBySource: FetchedAtBySource }) {
  const copy = useCopy();
  const router = useRouter();

  useLayoutEffect(() => {
    markVisited();
    // A refresh of this visit stays here. The next request to `/` opens the map.
    const url = new URL(window.location.href);
    if (url.searchParams.has(INFO_PARAM)) return;
    router.replace(`${url.pathname}?${INFO_PARAM}${url.hash}`);
  }, [router]);

  return (
    <div className="flex min-h-dvh flex-col bg-asphalt">
      <AppHeader fetchedAtBySource={fetchedAtBySource} />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="font-display text-4xl tracking-wide text-white">{copy.introTitle}</h1>
        <p className="mt-3 text-base leading-6 text-ink/85">{copy.servicePitch}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <ViewJump href={MAP_PATH} direction="to-map">
            {copy.courtsOnMap}
          </ViewJump>
          <ViewJump href={COURT_INDEX_PATH} direction="to-list">
            {copy.courtsAsList}
          </ViewJump>
        </div>
        <LocationPrompt />
        <h2 className="mt-8 font-display text-2xl tracking-wide text-white">
          {copy.introCreatedByTitle}
        </h2>
        <p className="mt-2 text-base leading-6 text-ink/85">
          <a
            href="https://kirkkala.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gold"
          >
            Timo Kirkkala
          </a>{" "}
          {copy.introCreatedBy1}
        </p>
        <p className="mt-2 text-base leading-6 text-ink/85">{copy.introMotivation}</p>
        <p className="mt-2 text-base leading-6 text-ink/85">{copy.introFutureOfTheApp}</p>
        <HomeFeedback />
        <p className="mt-6 text-base leading-6 text-ink/85">
          {copy.introOpenSource}{" "}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-gold"
          >
            {copy.introOpenSourceLink}
          </a>
          .
        </p>
      </main>
      <AppFooter />
    </div>
  );
}

function LocationPrompt() {
  const copy = useCopy();
  const { status, request } = useLocationStatus();
  const granted = status === "granted";

  return (
    <div
      className={`mt-6 rounded-2xl border px-4 py-3 ${
        granted ? "border-emerald-400/25 bg-emerald-400/10" : "border-gold/20 bg-gold/5"
      }`}
    >
      {granted ? (
        <p className="text-base leading-6 text-ink/85">{copy.introLocationGranted}</p>
      ) : (
        <>
          <p className="text-base leading-6 text-ink/85">{copy.introLocationBenefit}</p>
          <p className="mt-1 text-sm text-ink-muted">{copy.introLocationOptional}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <LocateMeButton status={status} onClick={request} />
            {status === "denied" ? (
              <p className="text-sm text-ink-muted">{copy.locationBlockedHelp}</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function HomeFeedback() {
  const copy = useCopy();
  const databaseUnavailable = useDatabaseUnavailable();
  const feedback = useFeedback();
  if (databaseUnavailable || !feedback) return null;

  return (
    <p className="mt-6">
      <button
        type="button"
        onClick={feedback.openFeedback}
        aria-haspopup="dialog"
        className="inline-flex w-fit items-center rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm font-bold text-gold outline-none hover:border-gold/50 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60"
      >
        {copy.giveFeedback}
      </button>
    </p>
  );
}
