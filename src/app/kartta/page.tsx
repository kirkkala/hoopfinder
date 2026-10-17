import type { Metadata } from "next";
import { CourtExplorer } from "@/components/explorer/CourtExplorer";
import { getCourtCatalog } from "@/lib/catalog";
import { MAP_PATH } from "@/lib/constants";
import { getCopy } from "@/lib/copy";
import { courtIdFromParam } from "@/lib/courts";
import { siteOpenGraph } from "@/lib/og";
import { countPublicCourts } from "@/lib/submitted-courts";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const courtCount = await countPublicCourts();
  const description = getCopy("fi").metaDescriptionCount(courtCount);
  return {
    description,
    alternates: {
      canonical: MAP_PATH,
    },
    openGraph: siteOpenGraph({ description, url: MAP_PATH }),
  };
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ court?: string | string[]; thanks?: string | string[] }>;
}) {
  const { fetchedAtBySource } = await getCourtCatalog();
  const { court, thanks } = await searchParams;
  const focusId = typeof court === "string" ? courtIdFromParam(court) : null;
  return (
    <CourtExplorer
      fetchedAtBySource={fetchedAtBySource}
      focusId={focusId}
      thanks={thanks === "1"}
    />
  );
}
