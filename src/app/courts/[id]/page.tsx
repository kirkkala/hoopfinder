import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourtDetails } from "@/components/court/CourtDetails";
import { getBasketballCourt } from "@/lib/catalog";

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const result = await courtFromParams(params);
  return {
    title: result?.court.name ?? "Court not found",
  };
}

export default async function CourtPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const result = await courtFromParams(params);
  if (!result) notFound();
  return <CourtDetails court={result.court} fetchedAt={result.fetchedAt} />;
}

async function courtFromParams(params: Promise<{ id: string }>) {
  const { id } = await params;
  if (!id) return null;
  return getBasketballCourt(id);
}
