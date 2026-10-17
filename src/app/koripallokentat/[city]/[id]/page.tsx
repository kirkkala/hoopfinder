import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import { CourtDetails } from "@/components/court/CourtDetails";
import { getCourtCatalog } from "@/lib/catalog";
import { COURT_INDEX_PATH } from "@/lib/constants";
import { getCopy } from "@/lib/copy";
import { courtsWithPhotos } from "@/lib/court-groups";
import { canonicalCourtHref, cityHeading, courtIndexGroup } from "@/lib/court-index";
import { breadcrumbJsonLd, loadCourtById, loadCourtIndex } from "@/lib/court-page";
import type { CourtPhoto } from "@/lib/court-photos";
import { listCourtPhotos } from "@/lib/court-photos";
import {
  applyVisitorCourt,
  type Court,
  courtIdFromPublicId,
  courtOgHref,
  courtTitle,
  formatAddress,
  isAwaitingEmail,
  listingCity,
  mapCourtHref,
} from "@/lib/courts";
import { OG_CONTENT_TYPE, OG_SIZE, siteOpenGraph } from "@/lib/og";
import { siteOrigin } from "@/lib/site-origin";
import { listPublishedCourtsNear } from "@/lib/submitted-courts";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; id: string }>;
}): Promise<Metadata> {
  const resolved = await resolveCourt(params);
  const finnish = getCopy("fi");
  if (!resolved) return { title: finnish.courtNotFound, robots: { index: false } };
  if (isAwaitingEmail(resolved.court) && !(await viewerIsAdmin())) {
    return { title: finnish.statusAwaitingEmail, robots: { index: false, follow: false } };
  }

  const name = courtTitle(resolved.court, finnish);
  const place =
    formatAddress([resolved.court.address, resolved.court.neighborhood, resolved.court.city]) ||
    finnish.addressMissing;
  const description = finnish.metaCourtDescription(name, place);
  const pending = resolved.court.status === "pending";

  return {
    metadataBase: new URL(siteOrigin(await headers())),
    title: name,
    description,
    robots: pending ? { index: false, follow: false } : undefined,
    alternates: { canonical: resolved.canonical },
    openGraph: siteOpenGraph({
      title: name,
      description,
      type: "article",
      url: resolved.canonical,
      images: [
        {
          url: courtOgHref(resolved.court, resolved.sourceFetchedAt),
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          alt: `${name} — ${place}`,
          type: OG_CONTENT_TYPE,
        },
      ],
    }),
  };
}

export default async function CourtPage({
  params,
}: {
  params: Promise<{ city: string; id: string }>;
}) {
  const resolved = await resolveCourt(params);
  if (!resolved) notFound();
  const isAdmin = await viewerIsAdmin();
  if (isAwaitingEmail(resolved.court) && !isAdmin) {
    redirect(mapCourtHref({ id: resolved.court.id, source: "pending" }));
  }
  if (!resolved.matches) permanentRedirect(resolved.canonical);

  const finnish = getCopy("fi");
  const court = await withVisitorFacts(resolved.court);
  const otherCourts = (resolved.place.members ?? []).filter((member) => member.id !== court.id);
  const [{ fetchedAtBySource }, photos] = await Promise.all([
    getCourtCatalog(),
    listPlacePhotos(resolved.place),
  ]);
  const cityName = resolved.group?.city ?? cityHeading(listingCity(court));
  const jsonLd = breadcrumbJsonLd([
    { name: finnish.allCourts, path: COURT_INDEX_PATH },
    {
      name: cityName ?? finnish.cityUnknown,
      path: resolved.group?.pageHref ?? null,
    },
    { name: courtTitle(court, finnish), path: resolved.canonical },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is built from our own court list
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CourtDetails
        court={court}
        otherCourts={otherCourts}
        fetchedAtBySource={fetchedAtBySource}
        sourceFetchedAt={resolved.sourceFetchedAt}
        photos={photos}
        visitorEmail={isAdmin && resolved.email ? resolved.email : null}
        cityName={cityName}
        cityUnknown={cityName === null}
        cityPageHref={resolved.group?.pageHref ?? null}
      />
    </>
  );
}

async function resolveCourt(params: Promise<{ city: string; id: string }>) {
  const { city, id: publicId } = await params;
  const id = courtIdFromPublicId(publicId);
  if (!id) return null;
  const [loaded, index] = await Promise.all([loadCourtById(id), loadCourtIndex()]);
  if (!loaded) return null;
  const canonical = canonicalCourtHref(loaded.court, index.groups);
  return {
    court: loaded.court,
    place: loaded.place,
    sourceFetchedAt: loaded.sourceFetchedAt,
    email: loaded.email,
    canonical,
    group: courtIndexGroup(index.groups, loaded.court),
    matches: `${COURT_INDEX_PATH}/${city}/${publicId}` === canonical,
  };
}

async function viewerIsAdmin() {
  const session = await getAuthSession();
  return session?.user?.isAdmin === true;
}

async function withVisitorFacts(court: Court): Promise<Court> {
  if (court.source === "submitted") return court;
  const visitors = await listPublishedCourtsNear(court.members ?? [court]);
  return visitors.reduce((current, visitor) => applyVisitorCourt(current, visitor), court);
}

async function listPlacePhotos(court: Court): Promise<CourtPhoto[]> {
  const lists = await Promise.all(courtsWithPhotos(court).map((item) => listCourtPhotos(item)));
  return lists.flat();
}
