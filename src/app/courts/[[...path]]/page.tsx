import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import { CourtDetails } from "@/components/court/CourtDetails";
import { getCourtCatalog, getCourtPlace } from "@/lib/catalog";
import { SITE_URL } from "@/lib/constants";
import { getCopy } from "@/lib/copy";
import { courtOnPlace, courtsWithPhotos } from "@/lib/court-groups";
import type { CourtPhoto } from "@/lib/court-photos";
import { listCourtPhotos } from "@/lib/court-photos";
import {
  applyVisitorCourt,
  type Court,
  courtHref,
  courtOgHref,
  courtTitle,
  formatAddress,
  homeCourtHref,
  isAwaitingEmail,
  parseCourtPath,
} from "@/lib/courts";
import { isDatabaseUnavailable } from "@/lib/db";
import {
  countPublicCourts,
  getSubmittedCourt,
  listPublishedCourtsNear,
} from "@/lib/submitted-courts";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}): Promise<Metadata> {
  const result = await courtFromParams(params);
  const finnish = getCopy("fi");
  if (!result) {
    return { title: finnish.courtNotFound, robots: { index: false } };
  }
  if (isAwaitingEmail(result.court) && !(await viewerIsAdmin())) {
    return { title: finnish.statusAwaitingEmail, robots: { index: false, follow: false } };
  }

  const name = courtTitle(result.court, finnish);
  const place =
    formatAddress([result.court.address, result.court.neighborhood, result.court.city]) ||
    finnish.addressMissing;
  const description = finnish.metaCourtDescription(name, place);
  const canonical = courtHref(result.court);
  const pending = result.court.status === "pending";

  return {
    metadataBase: await requestOrigin(),
    title: name,
    description,
    robots: pending ? { index: false, follow: false } : undefined,
    alternates: {
      canonical,
    },
    openGraph: {
      title: name,
      description,
      type: "article",
      url: canonical,
      images: [
        {
          url: courtOgHref(result.court, result.sourceFetchedAt),
          width: 1200,
          height: 630,
          alt: `${name} — ${place}`,
        },
      ],
    },
  };
}

export default async function CourtPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const result = await courtFromParams(params);
  if (!result) notFound();
  const isAdmin = await viewerIsAdmin();
  if (isAwaitingEmail(result.court) && !isAdmin) {
    redirect(homeCourtHref({ id: result.court.id, source: "pending" }));
  }
  const court = await withVisitorFacts(result.court);
  const mapSpots =
    result.place.members && result.place.members.length > 1 ? result.place.members : undefined;
  const [{ fetchedAtBySource }, courtCount, photos] = await Promise.all([
    getCourtCatalog(),
    countPublicCourts(),
    listPlacePhotos(result.place),
  ]);
  return (
    <CourtDetails
      court={court}
      mapSpots={mapSpots}
      fetchedAtBySource={fetchedAtBySource}
      sourceFetchedAt={result.sourceFetchedAt}
      courtCount={courtCount}
      photos={photos}
      visitorEmail={isAdmin && "email" in result ? result.email : null}
    />
  );
}

async function viewerIsAdmin() {
  const session = await getAuthSession();
  return session?.user?.isAdmin === true;
}

async function courtFromParams(params: Promise<{ path?: string[] }>) {
  const { path } = await params;
  const parsed = parseCourtPath(path ?? []);
  if (parsed === "index") permanentRedirect("/");
  if (!parsed) return null;
  const catalogCourt = await getCourtPlace(parsed.id);
  if (catalogCourt) {
    return {
      court: courtOnPlace(catalogCourt.court, parsed.id),
      place: catalogCourt.court,
      sourceFetchedAt: catalogCourt.sourceFetchedAt,
    };
  }
  const submitted = await getSubmittedCourt(parsed.id);
  if (!submitted) {
    if (isDatabaseUnavailable()) throw new Error("database unavailable");
    return null;
  }
  return {
    court: submitted.court,
    place: submitted.court,
    sourceFetchedAt: submitted.createdAt,
    email: submitted.email,
  };
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

async function requestOrigin(): Promise<URL> {
  const headerList = await headers();
  const host = (headerList.get("x-forwarded-host") ?? headerList.get("host"))
    ?.split(",")[0]
    ?.trim();
  if (!host) return new URL(SITE_URL);
  const protocol =
    headerList.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return new URL(`${protocol}://${host}`);
}
