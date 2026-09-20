import type { Metadata } from "next";
import { AddCourtView } from "@/components/add-court/AddCourtView";
import { getCourtCatalog } from "@/lib/catalog";
import { getCopy } from "@/lib/copy";
import { homeOgHref, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const finnish = getCopy("fi");
  return {
    title: finnish.addCourt,
    description: finnish.addCourtLead,
    alternates: { canonical: "/add" },
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

export default async function AddCourtPage() {
  const { courts, fetchedAtBySource } = await getCourtCatalog();
  return (
    <AddCourtView
      courtCount={courts.length}
      fetchedAtBySource={fetchedAtBySource}
    />
  );
}
