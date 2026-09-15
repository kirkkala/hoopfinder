"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bath,
  Building2,
  Calendar,
  CircleCheck,
  CirclePause,
  ClipboardList,
  Database,
  Droplets,
  ExternalLink,
  Globe,
  Layers,
  LayoutGrid,
  Lightbulb,
  LoaderCircle,
  Locate,
  LocateOff,
  Map,
  MapPin,
  MapPinned,
  MoveVertical,
  Ruler,
  School,
  Square,
  StickyNote,
  Timer,
  Unlock,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { AppHeader } from "@/components/brand/AppHeader";
import { AppFooter } from "@/components/brand/AppFooter";
import { CourtDistance } from "@/components/CourtDistance";
import { useCopy } from "@/components/brand/LocaleProvider";
import { CourtMiniMap } from "@/components/court/CourtMiniMap";
import {
  courtName,
  formatAddress,
  formatAdmin,
  formatOwner,
  formatReportedBoolean,
  formatStatus,
  formatSurface,
  type Court,
} from "@/lib/courts";
import { haversineKm } from "@/lib/geo";
import {
  requestOrigin,
  useOrigin,
  type LocationStatus,
} from "@/lib/origin";
import { courtSource, sourceListingUrl } from "@/lib/sources";
import { formatFetchedAt } from "@/lib/time";
import { split } from "@/lib/layout";
import type { FetchedAtBySource } from "@/lib/catalog";

export function CourtDetails({
  court,
  fetchedAtBySource,
  sourceFetchedAt,
  courtCount,
}: {
  court: Court;
  fetchedAtBySource: FetchedAtBySource;
  sourceFetchedAt: string | null;
  courtCount: number;
}) {
  const copy = useCopy();
  const address = formatAddress([
    court.address,
    court.neighborhood,
    [court.postalCode, court.city].filter(Boolean).join(" ") || null,
  ]);
  const mapsUrl = `https://www.google.com/maps?q=${court.lat},${court.lon}`;
  const source = courtSource(court.source);
  const listingUrl = sourceListingUrl(court.source, court.id);
  const { amenities } = court;
  const dimensions =
    amenities.lengthM && amenities.widthM
      ? `${amenities.lengthM} × ${amenities.widthM} m`
      : null;

  return (
    <div className="flex min-h-dvh flex-col bg-asphalt">
      <AppHeader fetchedAtBySource={fetchedAtBySource} courtCount={courtCount} />

      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-6 px-4 py-8 split:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <BackToMap courtId={court.id} className={split.hidden} />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
              {copy.courtKind}
            </p>
            <h1 className="mt-1 font-display text-4xl tracking-wide text-white md:text-5xl">
              {courtName(court, copy)}
            </h1>
            <CourtDistanceBlock court={court} />
          </div>

          <dl className="grid gap-3 rounded-3xl border border-white/10 bg-panel p-5">
            <Fact
              icon={court.status === "active" ? CircleCheck : CirclePause}
              label={copy.status}
              value={formatStatus(court.status, copy)}
            />
            <Fact
              icon={MapPin}
              label={copy.address}
              value={address || copy.notReported}
            />
          </dl>

          <section className="rounded-3xl border border-white/10 bg-panel p-5">
            <h2 className="font-display text-2xl tracking-wide text-white">
              {copy.courtFacts}
            </h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Fact
                icon={Lightbulb}
                label={copy.lights}
                value={formatReportedBoolean(amenities.lighting, copy)}
              />
              <Fact
                icon={Unlock}
                label={copy.freeUse}
                value={formatReportedBoolean(amenities.freeUse, copy)}
              />
              {amenities.schoolUse !== null ? (
                <Fact
                  icon={School}
                  label={copy.schoolUse}
                  value={formatReportedBoolean(amenities.schoolUse, copy)}
                />
              ) : null}
              {amenities.fieldType ? (
                <Fact
                  icon={LayoutGrid}
                  label={copy.fieldType}
                  value={amenities.fieldType[0].toUpperCase() + amenities.fieldType.slice(1)}
                />
              ) : null}
              {amenities.surfaceMaterial.length ? (
                <Fact
                  icon={Layers}
                  label={copy.surface}
                  value={amenities.surfaceMaterial
                    .map((code) => formatSurface(code, copy))
                    .join(", ")}
                />
              ) : null}
              {amenities.surfaceMaterialInfo ? (
                <Fact
                  icon={StickyNote}
                  label={copy.surfaceNotes}
                  value={amenities.surfaceMaterialInfo}
                />
              ) : null}
              {dimensions ? (
                <Fact icon={Ruler} label={copy.dimensions} value={dimensions} />
              ) : null}
              {amenities.areaM2 ? (
                <Fact
                  icon={Square}
                  label={copy.area}
                  value={`${amenities.areaM2} m²`}
                />
              ) : null}
              {amenities.toilet !== null ? (
                <Fact
                  icon={Bath}
                  label={copy.toilet}
                  value={formatReportedBoolean(amenities.toilet, copy)}
                />
              ) : null}
              {amenities.heightAdjustable !== null ? (
                <Fact
                  icon={MoveVertical}
                  label={copy.adjustableRim}
                  value={formatReportedBoolean(amenities.heightAdjustable, copy)}
                />
              ) : null}
              {amenities.lightingInfo ? (
                <Fact
                  icon={Lightbulb}
                  label={copy.lightingNotes}
                  value={amenities.lightingInfo}
                />
              ) : null}
              {amenities.waterPoint ? (
                <Fact
                  icon={Droplets}
                  label={copy.waterPoint}
                  value={amenities.waterPoint}
                />
              ) : null}
              {amenities.matchClock !== null ? (
                <Fact
                  icon={Timer}
                  label={copy.matchClock}
                  value={formatReportedBoolean(amenities.matchClock, copy)}
                />
              ) : null}
              {amenities.scoreboard !== null ? (
                <Fact
                  icon={ClipboardList}
                  label={copy.scoreboard}
                  value={formatReportedBoolean(amenities.scoreboard, copy)}
                />
              ) : null}
              {court.constructionYear ? (
                <Fact
                  icon={Calendar}
                  label={copy.built}
                  value={court.constructionYear ? String(court.constructionYear) : copy.notReported}
                />
              ) : null}
            </dl>
          </section>

          {court.comment ? (
            <section className="rounded-3xl border border-white/10 bg-panel p-5">
              <h2 className="flex items-center gap-2 font-display text-2xl tracking-wide text-white">
                <StickyNote className="size-5 text-gold" aria-hidden />
                {source?.label
                  ? copy.notesFrom(source.label)
                  : copy.notesFromListing}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-muted">
                {court.comment}
              </p>
            </section>
          ) : null}
        </section>

        <aside className="overflow-hidden rounded-3xl border border-white/10 bg-panel">
          <BackToMap courtId={court.id} className="px-3 py-4" />
          <div className="h-80">
            <CourtMiniMap court={court} />
          </div>
          <dl className="grid gap-3 border-t border-white/10 p-5">
            <Fact
              icon={MapPinned}
              label={copy.mapLinks}
              value={
                <ul className="space-y-2">
                  <li>
                    <a
                      href={mapsUrl}
                      className="inline-flex items-center gap-1 text-gold hover:text-white"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {copy.googleMaps}
                      <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                    </a>
                  </li>
                  {listingUrl ? (
                    <li>
                      <a
                        href={listingUrl}
                        className="inline-flex items-center gap-1 text-gold hover:text-white"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {copy.viewListingOSM}
                        <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                      </a>
                    </li>
                  ) : null}
                </ul>
              }
            />
            {court.website ? (
              <Fact
                icon={Globe}
                label={copy.website}
                value={
                  <a
                    href={websiteHref(court.website)}
                    className="inline-flex items-center gap-1 break-all text-gold hover:text-white"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {websiteLabel(court.website)}
                    <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                  </a>
                }
              />
            ) : null}
            {court.admin ? (
              <Fact
                icon={UserCog}
                label={copy.administrator}
                value={formatAdmin(court.admin, copy)}
              />
            ) : null}
            {court.owner ? (
              <Fact
                icon={Building2}
                label={copy.owner}
                value={formatOwner(court.owner, copy)}
              />
            ) : null}
            {sourceFetchedAt && source ? (
              <Fact
                icon={Database}
                label={copy.dataFromSource}
                value={
                  <>
                    {source.label} -{" "}
                    <time dateTime={sourceFetchedAt}>
                      {formatFetchedAt(sourceFetchedAt)}
                    </time>
                  </>
                }
              />
            ) : null}
          </dl>
        </aside>
      </main>

      <AppFooter />
    </div>
  );
}

function CourtDistanceBlock({ court }: { court: Court }) {
  const copy = useCopy();
  const origin = useOrigin();
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [ready, setReady] = useState(false);
  const distanceKm = origin
    ? haversineKm(origin, { lat: court.lat, lon: court.lon })
    : null;

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  if (distanceKm !== null) {
    return (
      <p className="mt-2 inline-flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-gold">
          {copy.distanceAway}:
        </span>
        <CourtDistance km={distanceKm} />
      </p>
    );
  }

  const pending = status === "pending";
  const StatusIcon =
    pending ? LoaderCircle : status === "idle" ? Locate : LocateOff;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <button
        type="button"
        onClick={() => requestOrigin(setStatus)}
        disabled={pending}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-blue-800 px-3 py-1.5 text-sm font-bold text-white hover:bg-blue-900 disabled:cursor-default disabled:opacity-70"
      >
        <StatusIcon
          aria-hidden
          className={`size-3.5 ${pending ? "animate-spin" : ""}`}
        />
        {copy.nearMe[status]}
      </button>
      <p className="text-sm text-ink-muted">
        {status === "denied"
          ? copy.locationBlockedHelp
          : copy.locateToSeeDistance}
      </p>
    </div>
  );
}

function BackToMap({
  courtId,
  className,
}: {
  courtId: string;
  className?: string;
}) {
  const copy = useCopy();
  return (
    <Link
      href={`/?court=${encodeURIComponent(courtId)}`}
      className={`inline-flex shrink-0 items-center gap-1 text-md font-medium text-gold hover:text-white ${className ?? ""}`}
    >
      <Map aria-hidden />
      <ArrowLeft className="size-6" aria-hidden />
      {copy.backToMap}
    </Link>
  );
}

function websiteHref(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function websiteLabel(url: string) {
  return url.replace(/^https?:\/\//i, "");
}

function Fact({
  icon: FactIcon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-gold/80">
        <FactIcon className="size-3.5 shrink-0" aria-hidden />
        {label}
      </dt>
      <dd className="mt-1 text-base text-ink">{value}</dd>
    </div>
  );
}
