import type { Metadata } from "next";
import { CourtIndexView } from "@/components/court/CourtIndexView";
import { COURT_INDEX_PATH } from "@/lib/constants";
import { getCopy } from "@/lib/copy";
import { indexListFacts } from "@/lib/court-index";
import { loadCourtIndex } from "@/lib/court-page";
import { siteOpenGraph } from "@/lib/og";
import { countPublicCourts } from "@/lib/submitted-courts";

export async function generateMetadata(): Promise<Metadata> {
  const [courtCount, { groups }] = await Promise.all([countPublicCourts(), loadCourtIndex()]);
  const finnish = getCopy("fi");
  const facts = indexListFacts(groups);
  return {
    description: `${finnish.allCourtsIntro(facts.courts, facts.places, facts.lit, facts.closed)} ${finnish.allCourtsLead}`,
    alternates: { canonical: COURT_INDEX_PATH },
    openGraph: siteOpenGraph({
      description: finnish.metaDescriptionCount(courtCount),
      url: COURT_INDEX_PATH,
    }),
  };
}

export default async function CourtIndexPage() {
  const { groups, fetchedAtBySource } = await loadCourtIndex();
  return <CourtIndexView groups={groups} fetchedAtBySource={fetchedAtBySource} />;
}
