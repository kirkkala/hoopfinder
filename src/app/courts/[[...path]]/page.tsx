import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { CourtDetails } from "@/components/court/CourtDetails";
import { getBasketballCourt, getCourtCatalog } from "@/lib/catalog";
import { SITE_URL } from "@/lib/constants";
import { getCopy } from "@/lib/copy";
import {
  courtHref,
  courtOgHref,
  courtTitle,
  formatAddress,
  parseCourtPath,
} from "@/lib/courts";
import { getPublishedSubmittedCourt } from "@/lib/submitted-courts";

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

  const name = courtTitle(result.court, finnish);
  const place =
    formatAddress([
      result.court.address,
      result.court.neighborhood,
      result.court.city,
    ]) || finnish.addressMissing;
  const description = finnish.metaCourtDescription(name, place);
  const canonical = courtHref(result.court);

  return {
    metadataBase: await requestOrigin(),
    title: name,
    description,
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

export default async function CourtPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const result = await courtFromParams(params);
  if (!result) notFound();
  const { courts, fetchedAtBySource } = await getCourtCatalog();
  return (
    <CourtDetails
      court={result.court}
      fetchedAtBySource={fetchedAtBySource}
      sourceFetchedAt={result.sourceFetchedAt}
      courtCount={courts.length}
    />
  );
}

async function courtFromParams(params: Promise<{ path?: string[] }>) {
  const { path } = await params;
  const parsed = parseCourtPath(path ?? []);
  if (parsed === "index") permanentRedirect("/");
  if (!parsed) return null;
  const catalogCourt = await getBasketballCourt(parsed.id);
  if (catalogCourt) return catalogCourt;
  const submitted = await getPublishedSubmittedCourt(parsed.id);
  if (!submitted) return null;
  return { court: submitted.court, sourceFetchedAt: submitted.createdAt };
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
