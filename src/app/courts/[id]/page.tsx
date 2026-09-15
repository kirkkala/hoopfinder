import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourtDetails } from "@/components/court/CourtDetails";
import { getBasketballCourt, getCourtCatalog } from "@/lib/catalog";
import { getCopy } from "@/lib/copy";
import { courtName } from "@/lib/courts";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const result = await courtFromParams(params);
  const finnish = getCopy("fi");
  return {
    title: result ? courtName(result.court, finnish) : finnish.courtNotFound,
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
