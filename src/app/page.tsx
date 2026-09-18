import type { Metadata } from "next";
import { CourtExplorer } from "@/components/explorer/CourtExplorer";
import { getCourtCatalog } from "@/lib/catalog";
import { getCopy } from "@/lib/copy";

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
  const focusId = typeof court === "string" ? court : null;
  return (
    <CourtExplorer
      courts={courts}
      fetchedAtBySource={fetchedAtBySource}
      focusId={focusId}
    />
  );
}
