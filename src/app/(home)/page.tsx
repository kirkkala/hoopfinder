import type { Metadata } from "next";
import { CourtExplorer } from "@/components/explorer/CourtExplorer";
import { getCourtCatalog } from "@/lib/catalog";
import { SITE_URL } from "@/lib/constants";
import { getCopy } from "@/lib/copy";
import { courtIdFromParam } from "@/lib/courts";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { courts } = await getCourtCatalog();
  const finnish = getCopy("fi");
  return {
    description: finnish.metaDescriptionCount(courts.length),
    alternates: {
      canonical: "/",
    },
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ court?: string | string[] }>;
}) {
  const { courts, fetchedAtBySource } = await getCourtCatalog();
  const { court } = await searchParams;
  const focusId = typeof court === "string" ? courtIdFromParam(court) : null;
  const finnish = getCopy("fi");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: finnish.appName,
    url: SITE_URL,
    description: finnish.metaDescriptionCount(courts.length),
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
        courtCount={courts.length}
        fetchedAtBySource={fetchedAtBySource}
        focusId={focusId}
      />
    </>
  );
}
