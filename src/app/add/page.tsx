import type { Metadata } from "next";
import { AddCourtView } from "@/components/add-court/AddCourtView";
import { getCopy } from "@/lib/copy";
import { homeOgHref, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

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

export default function AddCourtPage() {
  return <AddCourtView />;
}
