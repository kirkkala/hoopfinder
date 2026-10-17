import type { Metadata } from "next";
import { CourtIndexView } from "@/components/court/CourtIndexView";
import { COURT_INDEX_PATH } from "@/lib/constants";
import { getCopy } from "@/lib/copy";
import { loadCourtIndex } from "@/lib/court-page";

export async function generateMetadata(): Promise<Metadata> {
  const finnish = getCopy("fi");
  return {
    title: finnish.allCourts,
    description: finnish.allCourtsLead,
    alternates: { canonical: COURT_INDEX_PATH },
  };
}

export default async function CourtIndexPage() {
  const { groups, courtCount, fetchedAtBySource } = await loadCourtIndex();
  return (
    <CourtIndexView groups={groups} courtCount={courtCount} fetchedAtBySource={fetchedAtBySource} />
  );
}
