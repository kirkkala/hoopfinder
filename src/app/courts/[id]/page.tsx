import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourtDetails } from "@/components/court/CourtDetails";
import { getBasketballCourt, getCourtCatalog } from "@/lib/catalog";
import { getCopy } from "@/lib/copy";
import { courtName, formatAddress } from "@/lib/courts";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const result = await courtFromParams(params);
  const finnish = getCopy("fi");
  if (!result) {
    return { title: finnish.courtNotFound, robots: { index: false } };
  }

  const name = courtName(result.court, finnish);
  const place =
    formatAddress([
      result.court.address,
      result.court.neighborhood,
      result.court.city,
    ]) || finnish.addressMissing;
  const description = finnish.metaCourtDescription(name, place);
  const canonical = `/courts/${encodeURIComponent(result.court.id)}`;

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
  params: Promise<{ id: string }>;
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

async function courtFromParams(params: Promise<{ id: string }>) {
  const { id } = await params;
  if (!id) return null;
  return getBasketballCourt(id);
}
