import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CourtDetails } from "@/components/court/CourtDetails";
import { getBasketballCourt, getCourtCatalog } from "@/lib/catalog";
import { getCopy } from "@/lib/copy";
import {
  courtHref,
  courtTitle,
  formatAddress,
  parseCourtPath,
} from "@/lib/courts";

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
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
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
  return getBasketballCourt(parsed.id);
}
