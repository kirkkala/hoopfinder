import type { Metadata } from "next";
import { CourtExplorer } from "@/components/explorer/CourtExplorer";
import { getCourtCatalog } from "@/lib/catalog";
import { MAP_PATH } from "@/lib/constants";
import { getCopy } from "@/lib/copy";
import { courtIdFromParam } from "@/lib/courts";
import { homeOgHref, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import { countPublicCourts } from "@/lib/submitted-courts";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const courtCount = await countPublicCourts();
  const finnish = getCopy("fi");
  return {
    title: finnish.courtsOnMap,
    description: finnish.metaDescriptionCount(courtCount),
    alternates: {
      canonical: MAP_PATH,
    },
    openGraph: {
      images: [
        {
          url: homeOgHref(),
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          alt: finnish.metaOgImageAlt,
          type: OG_CONTENT_TYPE,
        },
      ],
    },
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
