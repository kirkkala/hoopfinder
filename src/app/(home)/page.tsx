import type { Metadata } from "next";
import { CourtExplorer } from "@/components/explorer/CourtExplorer";
import { getCourtCatalog } from "@/lib/catalog";
import { countPublicCourts } from "@/lib/submitted-courts";
import { SITE_URL } from "@/lib/constants";
import { getCopy } from "@/lib/copy";
import { courtIdFromParam } from "@/lib/courts";
import { homeOgHref, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const courtCount = await countPublicCourts();
  const finnish = getCopy("fi");
  return {
    description: finnish.metaDescriptionCount(courtCount),
    alternates: {
      canonical: "/",
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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ court?: string | string[]; thanks?: string | string[] }>;
}) {
  const [{ fetchedAtBySource }, courtCount] = await Promise.all([
    getCourtCatalog(),
    countPublicCourts(),
  ]);
  const { court, thanks } = await searchParams;
  const focusId = typeof court === "string" ? courtIdFromParam(court) : null;
  const finnish = getCopy("fi");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: finnish.appName,
    url: SITE_URL,
    description: finnish.metaDescriptionCount(courtCount),
    inLanguage: ["fi", "en"],
    author: {
      "@type": "Person",
      name: "Timo Kirkkala",
      url: "https://kirkkala.com",
    },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CourtExplorer
        courtCount={courtCount}
        fetchedAtBySource={fetchedAtBySource}
        focusId={focusId}
        thanks={thanks === "1"}
      />
    </>
  );
}
