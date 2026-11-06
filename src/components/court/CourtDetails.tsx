"use client";

import {
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
  type LucideIcon,
  Map as MapIcon,
  MapPin,
  MoveVertical,
  Pencil,
  Ruler,
  School,
  Square,
  StickyNote,
  Timer,
  Unlock,
  UserCog,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { useIsAdmin } from "@/components/admin/AdminProvider";
import { AdminStatusButton } from "@/components/admin/AdminStatusButton";
import { AppFooter } from "@/components/brand/AppFooter";
import { AppHeader } from "@/components/brand/AppHeader";
import { AppLink } from "@/components/brand/AppLink";
import { useCopy } from "@/components/brand/LocaleProvider";
import { CourtDistance } from "@/components/CourtDistance";
import { CourtEditForm } from "@/components/court/CourtEditForm";
import { CourtGallery } from "@/components/court/CourtGallery";
import { LocateMeButton, locationHint } from "@/components/LocateMeButton";
import type { FetchedAtBySource } from "@/lib/catalog";
import { COURT_INDEX_PATH } from "@/lib/constants";
import type { Copy } from "@/lib/copy";
import { editChangeLines } from "@/lib/court-edit-summary";
import type { CourtPhoto } from "@/lib/court-photos";
import {
  COURT_THANKS_KEY,
  type Court,
  courtHref,
  courtPadLabel,
  courtTitle,
  formatAddress,
  formatAdmin,
  formatFieldType,
  formatOwner,
  formatReportedBoolean,
  formatStatus,
  formatSurface,
  formatWaterPoint,
  mapCourtHref,
} from "@/lib/courts";
import { haversineKm } from "@/lib/geo";
import { useLocationStatus } from "@/lib/origin";
import { courtSource, OSM_COPYRIGHT_URL, sourceListingUrl } from "@/lib/sources";
import type { CourtEditChanges, PendingCourtEdit } from "@/lib/submitted-courts";
import { formatFetchedAt } from "@/lib/time";

function MiniMapPlaceholder() {
  return <div className="mt-2 h-80 rounded-xl bg-white/5" aria-hidden />;
}

// A card while the page is one column. At the split breakpoint the aside is the card.
const stackedPanel =
  "overflow-hidden rounded-3xl border border-white/10 bg-panel split:overflow-visible split:rounded-none split:border-0 split:bg-transparent";

const CourtMiniMap = dynamic(
  () => import("@/components/court/CourtMiniMap").then((mod) => mod.CourtMiniMap),
  { ssr: false, loading: MiniMapPlaceholder },
);

export function CourtDetails({
  court,
  fetchedAtBySource,
  sourceFetchedAt,
  photos,
  otherCourts = [],
  visitorEmail = null,
  pendingEdits = [],
  cityName = null,
  cityUnknown = false,
  cityPageHref = null,
}: {
  court: Court;
  fetchedAtBySource: FetchedAtBySource;
  sourceFetchedAt: string | null;
  photos: CourtPhoto[];
  /** Other hoops at this place. Each one has its own page. */
  otherCourts?: Court[];
  visitorEmail?: string | null;
  /** Corrections waiting for an admin, including ones whose email link is still unopened. */
  pendingEdits?: PendingCourtEdit[];
  /** Place name. Null with `cityUnknown` shows the "other" label. */
  cityName?: string | null;
  cityUnknown?: boolean;
  /** City page. Absent when the city has fewer than two public courts. */
  cityPageHref?: string | null;
}) {
  const copy = useCopy();
  const isAdmin = useIsAdmin();
  const [suggesting, setSuggesting] = useState(false);
  const address = formatAddress([
    court.address,
    court.neighborhood,
    [court.postalCode, court.city].filter(Boolean).join(" ") || null,
  ]);
  const source = courtSource(court.source);
  const listingUrl = sourceListingUrl(court.source, court.id);
  const { amenities } = court;
  const pending = court.status === "pending";
  const [thanks, setThanks] = useState<"court" | "edit" | "edit-live" | null>(null);
  useEffect(() => {
    const flag = sessionStorage.getItem(COURT_THANKS_KEY);
    const editThanks = flag === `edit:${court.id}`;
    const editLive = flag === `edit-live:${court.id}`;
    if (flag !== court.id && !editThanks && !editLive) return;
    sessionStorage.removeItem(COURT_THANKS_KEY);
    setThanks(editLive ? "edit-live" : editThanks ? "edit" : "court");
  }, [court.id]);
  const awaitingEmail = isAdmin && court.emailConfirmed === false;
  const hideUnpublishedFacts = pending && !isAdmin;
  const showAdminStatus = isAdmin && court.source === "submitted";
  const suggested = (field: keyof CourtEditChanges) =>
    pendingEdits.some((edit) => Object.hasOwn(edit.changes, field));
  const suggestion = (field: keyof CourtEditChanges) => (
    <FieldSuggestions courtName={court.name} edits={pendingEdits} field={field} />
  );
  const dimensions =
    amenities.lengthM && amenities.widthM ? `${amenities.lengthM} × ${amenities.widthM} m` : null;
  const osmSources = (court.hidden ?? []).filter((item) => item.source === "osm");

  return (
    <div className="flex min-h-dvh flex-col bg-asphalt">
      <AppHeader fetchedAtBySource={fetchedAtBySource} />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 split:grid split:content-start split:grid-cols-[1.1fr_0.9fr]">
        {/* contents drops these wrappers on a narrow screen so the gallery can sit between the intro and the facts. */}
        <section className="contents split:block split:space-y-5">
          <div className="order-1 space-y-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <CourtCrumb
                cityName={cityName}
                cityUnknown={cityUnknown}
                cityPageHref={cityPageHref}
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
                {copy.courtKind}
              </p>
              <h1 className="mt-1 font-display text-4xl tracking-wide text-white md:text-5xl">
                {courtTitle(court, copy)}
              </h1>
              {suggestion("name")}
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
                <p className="mt-1 text-sm text-ink-muted">
                  {thanks === "edit-live"
                    ? copy.suggestEditSaved
                    : thanks === "edit"
                      ? copy.suggestEditThanksBody
                      : copy.confirmThanksBody}
                </p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setSuggesting(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm font-bold text-ink/80 outline-none hover:border-gold/40 hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              <Pencil className="size-3.5" aria-hidden />
              {copy.suggestContribute}
            </button>

            <dl
              className={`relative grid gap-3 rounded-3xl border border-white/10 bg-panel p-5 ${
                showAdminStatus ? "pr-40" : ""
              }`}
            >
              {showAdminStatus ? (
                <div className="absolute top-3 right-3 flex items-start gap-1">
                  <AdminStatusButton compact id={court.id} name={court.name} published={!pending} />
                </div>
              ) : null}
              <Fact
                icon={court.status === "active" ? CircleCheck : CirclePause}
                label={copy.status}
                value={
                  pending ? (
                    <>
                      {awaitingEmail ? copy.adminStatusUnconfirmed : copy.statusUnderReview}
                      {awaitingEmail ? (
                        <span className="mt-2 block rounded-2xl border border-gold/50 bg-gold/15 px-3 py-2 text-sm font-medium text-white">
                          {copy.adminUnconfirmedNotice}
                        </span>
                      ) : (
                        <span className="mt-1 block text-sm text-ink-muted">
                          {copy.pendingPublishAfterReview}
                        </span>
                      )}
                      {suggestion("status")}
                    </>
                  ) : (
                    <>
                      {formatStatus(court.status, copy)}
                      {suggestion("status")}
                    </>
                  )
                }
              />
              {!hideUnpublishedFacts && (
                <>
                  <Fact
                    icon={MapPin}
                    label={copy.address}
                    value={
                      <>
                        <span className="block">{address || copy.notReported}</span>
                        {googleMapsDirectionsLink(court.lat, court.lon, copy)}
                        {suggestion("address")}
                      </>
                    }
                  />
                  {otherCourts.length > 0 ? (
                    <Fact
                      icon={LayoutGrid}
                      label={copy.otherCourts}
                      value={
                        <ul className="space-y-1">
                          {otherCourts.map((pad) => (
                            <li key={pad.id}>
                              <AppLink
                                href={courtHref(pad)}
                                className="font-medium text-gold hover:text-white"
                              >
                                {courtPadLabel(pad, copy)}
                              </AppLink>
                            </li>
                          ))}
                        </ul>
                      }
                    />
                  ) : null}
                </>
              )}
            </dl>
          </div>

          <div className="order-3 space-y-5">
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
                    {amenities.hoopHeight || suggested("hoopHeight") ? (
                      <Fact
                        icon={Ruler}
                        label={copy.hoopHeight}
                        value={
                          <>
                            {amenities.hoopHeight
                              ? copy.hoopHeights[amenities.hoopHeight]
                              : copy.notReported}
                            {suggestion("hoopHeight")}
                          </>
                        }
                      />
                    ) : null}
                    {amenities.heightAdjustable !== null || suggested("heightAdjustable") ? (
                      <Fact
                        icon={MoveVertical}
                        label={copy.adjustableRim}
                        value={
                          <>
                            {formatReportedBoolean(amenities.heightAdjustable, copy)}
                            {suggestion("heightAdjustable")}
                          </>
                        }
                      />
                    ) : null}
                    <Fact
                      icon={Unlock}
                      label={copy.freeUse}
                      value={
                        <>
                          {formatReportedBoolean(amenities.freeUse, copy)}
                          {suggestion("freeUse")}
                        </>
                      }
                    />
                    {amenities.schoolUse !== null || suggested("schoolUse") ? (
                      <Fact
                        icon={School}
                        label={copy.schoolUse}
                        value={
                          <>
                            {formatReportedBoolean(amenities.schoolUse, copy)}
                            {suggestion("schoolUse")}
                          </>
                        }
                      />
                    ) : null}
                    {amenities.fieldType || suggested("fieldType") ? (
                      <Fact
                        icon={LayoutGrid}
                        label={copy.fieldType}
                        value={
                          <>
                            {amenities.fieldType
                              ? formatFieldType(amenities.fieldType, copy)
                              : copy.notReported}
                            {suggestion("fieldType")}
                          </>
                        }
                      />
                    ) : null}
                    {amenities.surfaceMaterial.length || suggested("surfaceMaterial") ? (
                      <Fact
                        icon={Layers}
                        label={copy.surface}
                        value={
                          <>
                            {amenities.surfaceMaterial.length
                              ? amenities.surfaceMaterial
                                  .map((code) => formatSurface(code, copy))
                                  .join(", ")
                              : copy.notReported}
                            {suggestion("surfaceMaterial")}
                          </>
                        }
                      />
                    ) : null}
                    {amenities.surfaceMaterialInfo ? (
                      <Fact
                        icon={StickyNote}
                        label={copy.surfaceNotes}
                        value={amenities.surfaceMaterialInfo}
                      />
                    ) : null}
                    {dimensions || suggested("lengthM") || suggested("widthM") ? (
                      <Fact
                        icon={Ruler}
                        label={copy.dimensions}
                        value={
                          <>
                            {dimensions ?? copy.notReported}
                            {suggestion("lengthM")}
                            {suggestion("widthM")}
                          </>
                        }
                      />
                    ) : null}
                    {amenities.areaM2 || suggested("areaM2") ? (
                      <Fact
                        icon={Square}
                        label={copy.area}
                        value={
                          <>
                            {amenities.areaM2 ? `${amenities.areaM2} m²` : copy.notReported}
                            {suggestion("areaM2")}
                          </>
                        }
                      />
                    ) : null}
                    {amenities.toilet !== null || suggested("toilet") ? (
                      <Fact
                        icon={Bath}
                        label={copy.toilet}
                        value={
                          <>
                            {formatReportedBoolean(amenities.toilet, copy)}
                            {suggestion("toilet")}
                          </>
                        }
                      />
                    ) : null}
                    <Fact
                      icon={Lightbulb}
                      label={copy.lights}
                      value={
                        <>
                          {formatReportedBoolean(amenities.lighting, copy)}
                          {suggestion("lighting")}
                        </>
                      }
                    />
                    {amenities.lightingInfo || suggested("lightingInfo") ? (
                      <Fact
                        icon={Lightbulb}
                        label={copy.lightingNotes}
                        value={
                          <>
                            {amenities.lightingInfo ?? copy.notReported}
                            {suggestion("lightingInfo")}
                          </>
                        }
                      />
                    ) : null}
                    {amenities.waterPoint || suggested("waterPoint") ? (
                      <Fact
                        icon={Droplets}
                        label={copy.waterPoint}
                        value={
                          <>
                            {amenities.waterPoint
                              ? formatWaterPoint(amenities.waterPoint, copy)
                              : copy.notReported}
                            {suggestion("waterPoint")}
                          </>
                        }
                      />
                    ) : null}
                    {amenities.matchClock !== null || suggested("matchClock") ? (
                      <Fact
                        icon={Timer}
                        label={copy.matchClock}
                        value={
                          <>
                            {formatReportedBoolean(amenities.matchClock, copy)}
                            {suggestion("matchClock")}
                          </>
                        }
                      />
                    ) : null}
                    {amenities.scoreboard !== null || suggested("scoreboard") ? (
                      <Fact
                        icon={ClipboardList}
                        label={copy.scoreboard}
                        value={
                          <>
                            {formatReportedBoolean(amenities.scoreboard, copy)}
                            {suggestion("scoreboard")}
                          </>
                        }
                      />
                    ) : null}
                    {court.constructionYear ? (
                      <Fact
                        icon={Calendar}
                        label={copy.built}
                        value={
                          court.constructionYear ? String(court.constructionYear) : copy.notReported
                        }
                      />
                    ) : null}
                  </dl>
                </section>

                {court.comment || suggested("comment") ? (
                  <section className="rounded-3xl border border-white/10 bg-panel p-5">
                    <h2 className="flex items-center gap-2 font-display text-2xl tracking-wide text-white">
                      <StickyNote className="size-5 text-gold" aria-hidden />
                      {source?.label ? copy.notesFrom(source.label) : copy.notesFromListing}
                    </h2>
                    <p className="mt-2 whitespace-pre-wrap text-md leading-6 text-ink-muted">
                      {court.comment || copy.notReported}
                    </p>
                    {suggestion("comment")}
                  </section>
                ) : null}
              </>
            )}
            {suggesting ? (
              <CourtEditForm court={court} onClose={() => setSuggesting(false)} />
            ) : null}
          </div>
        </section>

        <aside className="contents split:block split:overflow-hidden split:rounded-3xl split:border split:border-white/10 split:bg-panel">
          <div className={`order-2 ${stackedPanel}`}>
            <CourtGallery
              key={court.id}
              courtId={court.id}
              courtName={courtTitle(court, copy)}
              photos={photos}
            />
          </div>
          <div className={`order-4 ${stackedPanel}`}>
            <section className="px-3 py-4">
              <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-gold/80">
                <MapIcon className="size-4 shrink-0" aria-hidden />
                {copy.courtLocation}
              </h2>
              <CourtMiniMap court={court} />
              <CourtOnMapLink court={court} className="mt-2" />
            </section>
            <dl className="grid gap-3 border-t border-white/10 p-5">
              {court.website || suggested("website") ? (
                <Fact
                  icon={Globe}
                  label={copy.website}
                  value={
                    <>
                      {court.website ? (
                        <a
                          href={websiteHref(court.website)}
                          className="inline-flex items-center gap-1 break-all text-gold hover:text-white"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {websiteLabel(court.website)}
                          <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                        </a>
                      ) : (
                        copy.notReported
                      )}
                      {suggestion("website")}
                    </>
                  }
                />
              ) : null}
              {court.admin || suggested("admin") ? (
                <Fact
                  icon={UserCog}
                  label={copy.administrator}
                  value={
                    <>
                      {court.admin ? formatAdmin(court.admin, copy) : copy.notReported}
                      {suggestion("admin")}
                    </>
                  }
                />
              ) : null}
              {court.owner || suggested("owner") ? (
                <Fact
                  icon={Building2}
                  label={copy.owner}
                  value={
                    <>
                      {court.owner ? formatOwner(court.owner, copy) : copy.notReported}
                      {suggestion("owner")}
                    </>
                  }
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
                      {court.source === "osm" || osmSources.length > 0 || listingUrl ? (
                        <ul>
                          {court.source === "osm" || osmSources.length > 0 ? (
                            <li className="text-sm leading-5 text-ink-muted">
                              <span className="block">© OpenStreetMap {copy.osmContributors}.</span>
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
                          {listingUrl ? <SourceLink href={listingUrl} /> : null}
                          {osmSources.map((item) => {
                            const href = sourceListingUrl(item.source, item.id);
                            return href ? <SourceLink key={item.id} href={href} /> : null;
                          })}
                        </ul>
                      ) : null}
                      {sourceFetchedAt ? (
                        <p className="text-xs text-ink-muted">
                          {court.source === "submitted" ? copy.addedAt : copy.dataFetchedAt}:{" "}
                          <time dateTime={sourceFetchedAt}>{formatFetchedAt(sourceFetchedAt)}</time>
                        </p>
                      ) : null}
                    </div>
                  }
                />
              ) : null}
            </dl>
          </div>
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
      className="mt-1 inline-flex items-center gap-1 text-gold hover:text-white"
      target="_blank"
      rel="noreferrer"
    >
      {copy.showDirections}
      <ExternalLink className="size-3.5" aria-hidden />
    </a>
  );
}

function CourtDistanceBlock({ court }: { court: Court }) {
  const copy = useCopy();
  const { origin, status, request } = useLocationStatus();
  const [ready, setReady] = useState(false);
  const distanceKm = origin ? haversineKm(origin, { lat: court.lat, lon: court.lon }) : null;
  const hint = locationHint(copy, status);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  if (distanceKm !== null) {
    return (
      <p className="mt-2 inline-flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-gold">{copy.distanceAway}:</span>
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

function CourtOnMapLink({ court, className }: { court: Court; className?: string }) {
  const copy = useCopy();
  return (
    <AppLink
      href={mapCourtHref(court)}
      className={[
        "inline-flex items-center gap-1.5 text-sm font-bold text-gold hover:text-white",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <MapIcon className="size-4 shrink-0" aria-hidden />
      {copy.backToMap}
    </AppLink>
  );
}

function CourtCrumb({
  cityName,
  cityUnknown,
  cityPageHref,
}: {
  cityName: string | null;
  cityUnknown: boolean;
  cityPageHref: string | null;
}) {
  const copy = useCopy();
  const city = cityName ?? (cityUnknown ? copy.cityUnknown : null);
  return (
    <nav aria-label={copy.breadcrumb}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
        <li>
          <AppLink
            href={COURT_INDEX_PATH}
            trailingPending={false}
            className="font-medium text-gold hover:text-white"
          >
            {copy.allCourts}
          </AppLink>
        </li>
        {city ? (
          <li className="flex items-center gap-2">
            <span aria-hidden="true">/</span>
            {cityPageHref ? (
              <AppLink
                href={cityPageHref}
                trailingPending={false}
                className="font-medium text-gold hover:text-white"
              >
                {city}
              </AppLink>
            ) : (
              <span>{city}</span>
            )}
          </li>
        ) : null}
      </ol>
    </nav>
  );
}

function SourceLink({ href }: { href: string }) {
  return (
    <li>
      <a
        href={href}
        className="inline-flex items-center gap-1 break-all text-gold hover:text-white"
        target="_blank"
        rel="noreferrer"
      >
        {websiteLabel(href)}
        <ExternalLink className="size-3.5 shrink-0" aria-hidden />
      </a>
    </li>
  );
}

function websiteHref(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function websiteLabel(url: string) {
  return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
}

function FieldSuggestions({
  edits,
  field,
  courtName,
}: {
  edits: PendingCourtEdit[];
  field: keyof CourtEditChanges;
  courtName: string;
}) {
  const copy = useCopy();
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;
  const rows = edits.filter((edit) => Object.hasOwn(edit.changes, field));
  if (rows.length === 0) return null;
  return (
    <ul className="mt-2 space-y-2">
      {rows.map((edit) => {
        const line = editChangeLines(edit.changes, copy).find((item) => item.key === field);
        if (!line) return null;
        return (
          <li key={edit.id} className="rounded-2xl border border-gold/40 bg-gold/10 px-3 py-2">
            <p className="text-sm text-white">
              <span className="text-ink-muted">{copy.fieldSuggestion}: </span>
              <span className="font-semibold">{line.value}</span>
            </p>
            <p className="text-xs text-ink-muted">{edit.email}</p>
            {edit.status === "unconfirmed" ? (
              <p className="text-xs text-ink-muted">{copy.adminEditUnconfirmed}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <AdminStatusButton id={edit.id} name={courtName} published={false} notifies={false} />
              <RejectSuggestion id={edit.id} name={courtName} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function RejectSuggestion({ id, name }: { id: string; name: string }) {
  const copy = useCopy();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function remove() {
    if (!window.confirm(copy.adminEditDeleteConfirm(name))) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/courts/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("delete failed");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      disabled={saving}
      onClick={() => void remove()}
      className="rounded-full px-2.5 py-0.5 text-xs font-bold text-ink/70 hover:bg-red-500/15 hover:text-red-300 disabled:cursor-wait disabled:opacity-70"
    >
      {copy.adminEditDelete}
    </button>
  );
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
