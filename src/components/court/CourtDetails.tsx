import type { ReactNode } from "react";
import {
  Bath,
  Building2,
  Calendar,
  CircleCheck,
  CirclePause,
  ClipboardList,
  Compass,
  Droplets,
  ExternalLink,
  Globe,
  Layers,
  LayoutGrid,
  Lightbulb,
  MapPin,
  MoveVertical,
  Phone,
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
import { CourtMiniMap } from "@/components/court/CourtMiniMap";
import {
  formatAddress,
  formatReportedBoolean,
  formatStatus,
  formatSurface,
  type Court,
} from "@/lib/courts";
import { formatCoordinates } from "@/lib/geo";
import { courtSource, sourceListingUrl } from "@/lib/sources";

export function CourtDetails({ court }: { court: Court }) {
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
      <AppHeader backHref="/" />

      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-6 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
              {source && !source.required
                ? `Basketball court · ${source.label}`
                : "Basketball court"}
            </p>
            <h1 className="mt-1 font-display text-4xl tracking-wide text-white md:text-5xl">
              {court.name}
            </h1>
            {court.nameFi !== court.name ? (
              <p className="mt-1 text-ink-muted">{court.nameFi}</p>
            ) : null}
          </div>

          <dl className="grid gap-3 rounded-3xl border border-white/10 bg-panel p-5">
            <Fact
              icon={court.status === "active" ? CircleCheck : CirclePause}
              label="Status"
              value={formatStatus(court.status)}
            />
            <Fact
              icon={MapPin}
              label="Address"
              value={address || "Not reported"}
            />
            <Fact
              icon={Compass}
              label="Google Maps"
              value={
                <a
                  href={mapsUrl}
                  className="inline-flex items-center gap-1 text-gold hover:text-white"
                  target="_blank"
                  rel="noreferrer"
                >
                  maps.google.com
                  <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                </a>
              }
            />
            {listingUrl ? (
              <Fact
                icon={Globe}
                label={source?.label ?? "Listing"}
                value={
                  <a
                    href={listingUrl}
                    className="inline-flex items-center gap-1 text-gold hover:text-white"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View listing
                    <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                  </a>
                }
              />
            ) : null}
            {court.phone ? (
              <Fact icon={Phone} label="Phone" value={court.phone} />
            ) : null}
            {court.website ? (
              <Fact
                icon={Globe}
                label="Website"
                value={
                  <a
                    href={court.website}
                    className="inline-flex items-center gap-1 break-all text-gold hover:text-white"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {court.website}
                    <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                  </a>
                }
              />
            ) : null}
            {court.admin ? (
              <Fact icon={UserCog} label="Administrator" value={court.admin} />
            ) : null}
            {court.owner ? (
              <Fact icon={Building2} label="Owner" value={court.owner} />
            ) : null}
            {court.constructionYear ? (
              <Fact
                icon={Calendar}
                label="Built"
                value={String(court.constructionYear)}
              />
            ) : null}
          </dl>

          <section className="rounded-3xl border border-white/10 bg-panel p-5">
            <h2 className="font-display text-2xl tracking-wide text-white">
              Court scouting
            </h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Fact
                icon={Lightbulb}
                label="Lights"
                value={formatReportedBoolean(amenities.lighting)}
              />
              <Fact
                icon={Unlock}
                label="Free use"
                value={formatReportedBoolean(amenities.freeUse)}
              />
              {amenities.schoolUse !== null ? (
                <Fact
                  icon={School}
                  label="School use"
                  value={formatReportedBoolean(amenities.schoolUse)}
                />
              ) : null}
              {amenities.fieldType ? (
                <Fact
                  icon={LayoutGrid}
                  label="Field type"
                  value={amenities.fieldType}
                />
              ) : null}
              {amenities.surfaceMaterial.length ? (
                <Fact
                  icon={Layers}
                  label="Surface"
                  value={amenities.surfaceMaterial.map(formatSurface).join(", ")}
                />
              ) : null}
              {amenities.surfaceMaterialInfo ? (
                <Fact
                  icon={StickyNote}
                  label="Surface notes"
                  value={amenities.surfaceMaterialInfo}
                />
              ) : null}
              {dimensions ? (
                <Fact icon={Ruler} label="Dimensions" value={dimensions} />
              ) : null}
              {amenities.areaM2 ? (
                <Fact
                  icon={Square}
                  label="Area"
                  value={`${amenities.areaM2} m²`}
                />
              ) : null}
              {amenities.toilet !== null ? (
                <Fact
                  icon={Bath}
                  label="Toilet"
                  value={formatReportedBoolean(amenities.toilet)}
                />
              ) : null}
              {amenities.heightAdjustable !== null ? (
                <Fact
                  icon={MoveVertical}
                  label="Adjustable rim"
                  value={formatReportedBoolean(amenities.heightAdjustable)}
                />
              ) : null}
              {amenities.lightingInfo ? (
                <Fact
                  icon={Lightbulb}
                  label="Lighting notes"
                  value={amenities.lightingInfo}
                />
              ) : null}
              {amenities.waterPoint ? (
                <Fact
                  icon={Droplets}
                  label="Water point"
                  value={amenities.waterPoint}
                />
              ) : null}
              {amenities.matchClock !== null ? (
                <Fact
                  icon={Timer}
                  label="Match clock"
                  value={formatReportedBoolean(amenities.matchClock)}
                />
              ) : null}
              {amenities.scoreboard !== null ? (
                <Fact
                  icon={ClipboardList}
                  label="Scoreboard"
                  value={formatReportedBoolean(amenities.scoreboard)}
                />
              ) : null}
            </dl>
          </section>

          {court.comment ? (
            <section className="rounded-3xl border border-white/10 bg-panel p-5">
              <h2 className="flex items-center gap-2 font-display text-2xl tracking-wide text-white">
                <StickyNote className="size-5 text-gold" aria-hidden />
                Notes from {source?.label ?? "the listing"}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-muted">
                {court.comment}
              </p>
            </section>
          ) : null}
        </section>

        <aside className="h-80 overflow-hidden rounded-3xl border border-white/10 bg-panel">
          <CourtMiniMap court={court} />
        </aside>
      </main>

      <AppFooter />
    </div>
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
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gold/80">
        <FactIcon className="size-3.5 shrink-0" aria-hidden />
        {label}
      </dt>
      <dd className="mt-1 text-sm text-cream">{value}</dd>
    </div>
  );
}
