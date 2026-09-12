import type { ReactNode } from "react";
import { AppHeader } from "@/components/brand/AppHeader";
import { CourtMiniMap } from "@/components/court/CourtMiniMap";
import {
  formatAddress,
  formatReportedBoolean,
  formatStatus,
  formatSurface,
  type Court,
} from "@/lib/courts";
import { formatCoordinates } from "@/lib/geo";

export function CourtDetails({ court }: { court: Court }) {
  const address = formatAddress([
    court.address,
    court.neighborhood,
    [court.postalCode, court.city].filter(Boolean).join(" ") || null,
  ]);
  const osmUrl = `https://www.openstreetmap.org/?mlat=${court.lat}&mlon=${court.lon}#map=17/${court.lat}/${court.lon}`;
  const { amenities } = court;
  const dimensions =
    amenities.lengthM && amenities.widthM
      ? `${amenities.lengthM} × ${amenities.widthM} m`
      : null;

  return (
    <div className="min-h-dvh bg-asphalt">
      <AppHeader backHref="/" />

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
              Basketball court
            </p>
            <h1 className="mt-1 font-display text-4xl tracking-wide text-white md:text-5xl">
              {court.name}
            </h1>
            {court.nameFi !== court.name ? (
              <p className="mt-1 text-ink-muted">{court.nameFi}</p>
            ) : null}
          </div>

          <dl className="grid gap-3 rounded-3xl border border-white/10 bg-panel p-5">
            <Fact label="Status" value={formatStatus(court.status)} />
            <Fact label="Address" value={address || "Not reported"} />
            <Fact
              label="Coordinates"
              value={
                <a
                  href={osmUrl}
                  className="text-gold hover:text-white"
                  target="_blank"
                  rel="noreferrer"
                >
                  {formatCoordinates(court.lat, court.lon)}
                </a>
              }
            />
            {court.phone ? <Fact label="Phone" value={court.phone} /> : null}
            {court.website ? (
              <Fact
                label="Website"
                value={
                  <a
                    href={court.website}
                    className="break-all text-gold hover:text-white"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {court.website}
                  </a>
                }
              />
            ) : null}
            {court.admin ? <Fact label="Administrator" value={court.admin} /> : null}
            {court.owner ? <Fact label="Owner" value={court.owner} /> : null}
            {court.constructionYear ? (
              <Fact label="Built" value={String(court.constructionYear)} />
            ) : null}
          </dl>

          <section className="rounded-3xl border border-white/10 bg-panel p-5">
            <h2 className="font-display text-2xl tracking-wide text-white">
              Court scouting
            </h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Fact label="Lights" value={formatReportedBoolean(amenities.lighting)} />
              <Fact label="Free run" value={formatReportedBoolean(amenities.freeUse)} />
              {amenities.schoolUse !== null ? (
                <Fact
                  label="School use"
                  value={formatReportedBoolean(amenities.schoolUse)}
                />
              ) : null}
              {amenities.fieldType ? (
                <Fact label="Field type" value={amenities.fieldType} />
              ) : null}
              {amenities.surfaceMaterial.length ? (
                <Fact
                  label="Surface"
                  value={amenities.surfaceMaterial.map(formatSurface).join(", ")}
                />
              ) : null}
              {amenities.surfaceMaterialInfo ? (
                <Fact label="Surface notes" value={amenities.surfaceMaterialInfo} />
              ) : null}
              {dimensions ? <Fact label="Dimensions" value={dimensions} /> : null}
              {amenities.areaM2 ? (
                <Fact label="Area" value={`${amenities.areaM2} m²`} />
              ) : null}
              {amenities.toilet !== null ? (
                <Fact
                  label="Toilet"
                  value={formatReportedBoolean(amenities.toilet)}
                />
              ) : null}
              {amenities.heightAdjustable !== null ? (
                <Fact
                  label="Adjustable rim"
                  value={formatReportedBoolean(amenities.heightAdjustable)}
                />
              ) : null}
              {amenities.lightingInfo ? (
                <Fact label="Lighting notes" value={amenities.lightingInfo} />
              ) : null}
              {amenities.waterPoint ? (
                <Fact label="Water point" value={amenities.waterPoint} />
              ) : null}
              {amenities.matchClock !== null ? (
                <Fact
                  label="Match clock"
                  value={formatReportedBoolean(amenities.matchClock)}
                />
              ) : null}
              {amenities.scoreboard !== null ? (
                <Fact
                  label="Scoreboard"
                  value={formatReportedBoolean(amenities.scoreboard)}
                />
              ) : null}
            </dl>
          </section>

          {court.comment ? (
            <section className="rounded-3xl border border-white/10 bg-panel p-5">
              <h2 className="font-display text-2xl tracking-wide text-white">
                Notes from LIPAS
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
    </div>
  );
}

function Fact({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-gold/80">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-cream">{value}</dd>
    </div>
  );
}
