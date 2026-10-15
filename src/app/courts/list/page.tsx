import type { Metadata } from "next";
import { CourtIndexView } from "@/components/court/CourtIndexView";
import { getCourtCatalog } from "@/lib/catalog";
import { COURT_INDEX_PATH } from "@/lib/constants";
import { getCopy } from "@/lib/copy";
import { courtPageCount } from "@/lib/court-groups";
import { courtIndex } from "@/lib/court-index";

export async function generateMetadata(): Promise<Metadata> {
  const finnish = getCopy("fi");
  return {
    title: finnish.allCourts,
    description: finnish.allCourtsLead,
    alternates: { canonical: COURT_INDEX_PATH },
  };
}

export default async function CourtIndexPage() {
  const { courts, fetchedAtBySource } = await getCourtCatalog();
  return (
    <CourtIndexView
      groups={courtIndex(courts)}
      courtCount={courtPageCount(courts)}
      fetchedAtBySource={fetchedAtBySource}
    />
  );
}
