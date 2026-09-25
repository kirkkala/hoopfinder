"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AppLink } from "@/components/brand/AppLink";
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
  Map,
  MapPin,
  MoveVertical,
  Pencil,
  Route,
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
import { LocateMeButton, locationHint } from "@/components/LocateMeButton";
import { useCopy } from "@/components/brand/LocaleProvider";
import { AdminCourtEditor } from "@/components/admin/AdminCourtEditor";
import { useIsAdmin } from "@/components/admin/AdminProvider";
import { AdminStatusButton } from "@/components/admin/AdminStatusButton";
import { CourtGallery } from "@/components/court/CourtGallery";
import { CourtMiniMap } from "@/components/court/CourtMiniMap";
import {
  COURT_THANKS_KEY,
  courtTitle,
  formatAddress,
  formatAdmin,
  formatOwner,
  formatFieldType,
  formatReportedBoolean,
  formatStatus,
  formatSurface,
  formatWaterPoint,
  homeCourtHref,
  type Court,
} from "@/lib/courts";
import { haversineKm } from "@/lib/geo";
import { useLocationStatus } from "@/lib/origin";
import { courtSource, OSM_COPYRIGHT_URL, sourceListingUrl } from "@/lib/sources";
import { formatFetchedAt } from "@/lib/time";
import { split } from "@/lib/layout";
import type { FetchedAtBySource } from "@/lib/catalog";
import type { CourtPhoto } from "@/lib/court-photos";
import type { Copy } from "@/lib/copy";

export function CourtDetails({
  court,
  fetchedAtBySource,
  sourceFetchedAt,
  courtCount,
  photos,
  visitorEmail = null,
}: {
  court: Court;
  fetchedAtBySource: FetchedAtBySource;
  sourceFetchedAt: string | null;
  courtCount: number;
  photos: CourtPhoto[];
  visitorEmail?: string | null;
}) {
  const copy = useCopy();
  const isAdmin = useIsAdmin();
  const [editing, setEditing] = useState(false);
  const address = formatAddress([
    court.address,
    court.neighborhood,
    [court.postalCode, court.city].filter(Boolean).join(" ") || null,
  ]);
  const source = courtSource(court.source);
  const listingUrl = sourceListingUrl(court.source, court.id);
  const { amenities } = court;
  const pending = court.status === "pending";
  const [thanks, setThanks] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem(COURT_THANKS_KEY) !== court.id) return;
    sessionStorage.removeItem(COURT_THANKS_KEY);
    setThanks(true);
  }, [court.id]);
  const awaitingEmail = isAdmin && court.emailConfirmed === false;
  const hideUnpublishedFacts = pending && !isAdmin;
  const showAdminStatus = isAdmin && court.source === "submitted";
  const canEdit = showAdminStatus && visitorEmail !== null;
  const dimensions =
    amenities.lengthM && amenities.widthM
      ? `${amenities.lengthM} × ${amenities.widthM} m`
      : null;

  return (
    <div className="flex min-h-dvh flex-col bg-asphalt">
      <AppHeader fetchedAtBySource={fetchedAtBySource} courtCount={courtCount} />

      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-6 px-4 py-8 split:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <BackToMap court={court} className={split.hidden} />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
              {copy.courtKind}
            </p>
            <h1 className="mt-1 font-display text-4xl tracking-wide text-white md:text-5xl">
              {courtTitle(court, copy)}
            </h1>
            {pending ? (
              <p className="mt-2 text-sm font-medium text-gold">
                {sourceFetchedAt ? (
                  <time dateTime={sourceFetchedAt}>
                    {copy.pendingAddedOn(formatFetchedAt(sourceFetchedAt, true))}
                  </time>
                ) : (
                  copy.pendingComingSoon
                )}
              </p>
            ) : null}
            <CourtDistanceBlock court={court} />
          </div>

          {thanks ? (
            <div className="rounded-3xl border border-gold/40 bg-gold/10 p-5">
              <p className="font-bold text-white">{copy.confirmThanksTitle}</p>
              <p className="mt-1 text-sm text-ink-muted">{copy.confirmThanksBody}</p>
            </div>
          ) : null}

          <dl
            className={`relative grid gap-3 rounded-3xl border border-white/10 bg-panel p-5 ${
              showAdminStatus ? "pr-40" : ""
            }`}
          >
            {showAdminStatus ? (
              <div className="absolute top-3 right-3 flex items-start gap-1">
                <AdminStatusButton
                  compact
                  id={court.id}
                  name={court.name}
                  published={!pending}
                />
                {canEdit ? (
                  <button
                    type="button"
                    aria-pressed={editing}
                    onClick={() => setEditing((open) => !open)}
                    aria-label={copy.adminEdit}
                    title={copy.adminEdit}
                    className={`inline-flex size-8 items-center justify-center rounded-full ${
                      editing
                        ? "bg-gold text-asphalt"
                        : "bg-white/15 text-white hover:bg-white/25"
                    }`}
                  >
                    <Pencil className="size-4" aria-hidden />
                  </button>
                ) : null}
              </div>
            ) : null}
            <Fact
              icon={court.status === "active" ? CircleCheck : CirclePause}
              label={copy.status}
              value={
                pending ? (
                  <>
                    {awaitingEmail
                      ? copy.adminStatusUnconfirmed
                      : copy.statusUnderReview}
                    {awaitingEmail ? (
                      <span className="mt-2 block rounded-2xl border border-gold/50 bg-gold/15 px-3 py-2 text-sm font-medium text-white">
                        {copy.adminUnconfirmedNotice}
                      </span>
                    ) : (
                      <span className="mt-1 block text-sm text-ink-muted">
                        {copy.pendingPublishAfterReview}
                      </span>
                    )}
                  </>
                ) : (
                  formatStatus(court.status, copy)
                )
              }
            />
            {!hideUnpublishedFacts && (
              <>
                <Fact
                  icon={MapPin}
                  label={copy.address}
                  value={address || copy.notReported}
                />
                <Fact
                  icon={Route}
                  label={copy.showDirections}
                  value={googleMapsDirectionsLink(court.lat, court.lon, copy)}
                />
              </>
            )}
          </dl>

          {hideUnpublishedFacts ? (
            <div className="relative overflow-hidden" aria-hidden>
              <div className="space-y-5">
                <div className="rounded-3xl border border-white/10 bg-panel p-5">
                  <div className="space-y-3 blur-md">
                    <div className="h-3 w-24 rounded bg-gold/40" />
                    <div className="h-3 w-40 rounded bg-white/20" />
                    <div className="h-3 w-32 rounded bg-white/20" />
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-panel p-5">
                  <div className="space-y-3 blur-md">
                    <div className="h-5 w-36 rounded bg-white/20" />
                    <div className="h-3 w-28 rounded bg-gold/40" />
                    <div className="h-3 w-24 rounded bg-white/20" />
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-asphalt" />
            </div>
          ) : (
          <>
          <section className="rounded-3xl border border-white/10 bg-panel p-5">
            <h2 className="font-display text-2xl tracking-wide text-white">
              {copy.courtFacts}
            </h2>
            <dl className="mt-4 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-6 gap-y-3 max-sm:[&>div]:col-span-2 max-sm:[&>div]:grid max-sm:[&>div]:grid-cols-subgrid max-sm:[&>div]:items-start max-sm:[&>div]:border-b max-sm:[&>div]:border-white/10 max-sm:[&>div]:pb-2 max-sm:[&_dt]:mt-0 max-sm:[&_dt]:translate-y-[3px] max-sm:[&_dd]:mt-0 sm:grid-cols-2 sm:gap-3">
              {amenities.hoopHeight ? (
                <Fact
                  icon={Ruler}
                  label={copy.hoopHeight}
                  value={copy.hoopHeights[amenities.hoopHeight]}
                />
              ) : null}
              {amenities.heightAdjustable !== null ? (
                <Fact
                  icon={MoveVertical}
                  label={copy.adjustableRim}
                  value={formatReportedBoolean(amenities.heightAdjustable, copy)}
                />
              ) : null}
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
                  value={formatFieldType(amenities.fieldType, copy)}
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
              <Fact
                icon={Lightbulb}
                label={copy.lights}
                value={formatReportedBoolean(amenities.lighting, copy)}
              />
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
                  value={formatWaterPoint(amenities.waterPoint, copy)}
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
              <p className="mt-2 whitespace-pre-wrap text-md leading-6 text-ink-muted">
                {court.comment}
              </p>
            </section>
          ) : null}
          </>
          )}
          {editing && visitorEmail ? (
            <AdminCourtEditor
              court={court}
              email={visitorEmail}
              onClose={() => setEditing(false)}
            />
          ) : null}
        </section>

        <aside className="overflow-hidden rounded-3xl border border-white/10 bg-panel">
          <BackToMap court={court} className="px-3 py-4" />
          <CourtGallery
            courtId={court.id}
            courtName={courtTitle(court, copy)}
            photos={photos}
          />
          <div className="h-80">
            <CourtMiniMap court={court} />
          </div>
          <dl className="grid gap-3 border-t border-white/10 p-5">
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
            {court.source === "submitted" || source ? (
              <Fact
                icon={Database}
                label={copy.dataFromSource}
                value={
                  <div className="space-y-1">
                    {court.source === "submitted" ? (
                      <p>
                        {copy.sourceSubmitted}
                        {visitorEmail ? (
                          <a
                            href={`mailto:${visitorEmail}`}
                            className="mt-1 block text-gold hover:text-white"
                          >
                            {visitorEmail}
                          </a>
                        ) : null}
                      </p>
                    ) : null}
                    {court.source === "osm" || listingUrl ? (
                      <ul>
                        {court.source === "osm" ? (
                          <li className="text-sm leading-5 text-ink-muted">
                            <span className="block">
                              © OpenStreetMap {copy.osmContributors}.
                            </span>
                            <span className="block">
                              {copy.osmLicenseLead}:{" "}
                              <a
                                href={OSM_COPYRIGHT_URL}
                                className="text-gold hover:text-white"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {copy.osmLicense}
                              </a>
                            </span>
                          </li>
                        ) : null}
                        {listingUrl ? (
                          <li>
                            <a
                              href={listingUrl}
                              className="inline-flex items-center gap-1 break-all text-gold hover:text-white"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {websiteLabel(listingUrl)}
                              <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                            </a>
                          </li>
                        ) : null}
                      </ul>
                    ) : null}
                    {sourceFetchedAt ? (
                      <p className="text-xs text-ink-muted">
                        {court.source === "submitted"
                          ? copy.addedAt
                          : copy.dataFetchedAt}
                        :{" "}
                        <time dateTime={sourceFetchedAt}>
                          {formatFetchedAt(sourceFetchedAt)}
                        </time>
                      </p>
                    ) : null}
                  </div>
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

function googleMapsDirectionsLink(lat: number, lon: number, copy: Copy) {
  return (
    <a
      href={`https://${copy.googleMaps}/maps/dir/?api=1&destination=${lat},${lon}`}
      className="inline-flex items-center gap-1 break-all text-gold hover:text-white"
      target="_blank"
      rel="noreferrer"
    >
      Google Maps <ExternalLink className="size-3.5 aria-hidden" />
    </a>
  );
}

function CourtDistanceBlock({ court }: { court: Court }) {
  const copy = useCopy();
  const { origin, status, request } = useLocationStatus();
  const [ready, setReady] = useState(false);
  const distanceKm = origin
    ? haversineKm(origin, { lat: court.lat, lon: court.lon })
    : null;
  const hint = locationHint(copy, status);

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

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <LocateMeButton status={status} onClick={request} />
      {hint ? <p className="text-sm text-ink-muted">{hint}</p> : null}
    </div>
  );
}

function BackToMap({
  court,
  className,
}: {
  court: Court;
  className?: string;
}) {
  const copy = useCopy();
  return (
    <AppLink
      href={homeCourtHref(court)}
      className={`inline-flex shrink-0 items-center gap-1 text-md font-medium text-gold hover:text-white ${className ?? ""}`}
    >
      <Map aria-hidden />
      <ArrowLeft className="size-6" aria-hidden />
      {copy.backToMap}
    </AppLink>
  );
}

function websiteHref(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function websiteLabel(url: string) {
  return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
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
    <div className="min-w-0">
      <dt className="mt-2 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-gold/80">
        <FactIcon className="size-3.5 shrink-0" aria-hidden />
        {label}
      </dt>
      <dd className="mt-1 min-w-0 hyphens-auto text-base text-ink">{value}</dd>
    </div>
  );
}
