import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourtDetails } from "@/components/court/CourtDetails";
import { getBasketballCourt } from "@/lib/lipas";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const court = await courtFromParams(params);
  return {
    title: court?.name ?? "Court not found",
  };
}

export default async function CourtPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const court = await courtFromParams(params);
  if (!court) notFound();
  return <CourtDetails court={court} />;
}

async function courtFromParams(params: Promise<{ id: string }>) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return getBasketballCourt(id);
}
