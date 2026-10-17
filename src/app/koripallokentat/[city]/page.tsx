import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import { CityCourtsView } from "@/components/court/CityCourtsView";
import { COURT_INDEX_PATH } from "@/lib/constants";
import { getCopy } from "@/lib/copy";
import {
  CITY_PAGE_MIN_COURTS,
  type CourtIndexGroup,
  canonicalCourtHref,
  cityCourtFacts,
  cityGroupBySegment,
  publicCityCourts,
} from "@/lib/court-index";
import { breadcrumbJsonLd, loadCourtById, loadCourtIndex } from "@/lib/court-page";
import { courtIdFromPublicId, isAwaitingEmail, mapCourtHref } from "@/lib/courts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const page = await cityPage(city);
  const finnish = getCopy("fi");
  if (!page) return { title: finnish.courtNotFound, robots: { index: false } };
  const place = page.group.city ?? finnish.cityUnknown;
  const facts = cityCourtFacts(page.courts);
  const intro = finnish.cityCourtsIntro(page.courts.length, facts.lit, facts.closed);
  return {
    title: finnish.cityCourtsHeading(place),
    description: `${finnish.cityCourtsHeading(place)}. ${intro}`,
    alternates: { canonical: page.group.pageHref ?? COURT_INDEX_PATH },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const page = await cityPage(city);
  if (!page) notFound();
  if (city !== page.group.anchor) {
    if (!page.group.pageHref) notFound();
    permanentRedirect(page.group.pageHref);
  }

  const finnish = getCopy("fi");
  const place = page.group.city ?? finnish.cityUnknown;
  const facts = cityCourtFacts(page.courts);
  const jsonLd = breadcrumbJsonLd([
    { name: finnish.allCourts, path: COURT_INDEX_PATH },
    { name: finnish.cityCourtsHeading(place), path: page.group.pageHref },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is built from our own court list
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CityCourtsView
        cityName={page.group.city}
        courts={page.courts}
        lit={facts.lit}
        closed={facts.closed}
        fetchedAtBySource={page.fetchedAtBySource}
      />
    </>
  );
}

async function cityPage(segment: string) {
  const { groups, fetchedAtBySource } = await loadCourtIndex();
  const group = cityGroupBySegment(groups, segment);
  if (!group) {
    await redirectPublicId(segment, groups);
    return null;
  }
  const courts = publicCityCourts(group.courts);
  if (courts.length >= CITY_PAGE_MIN_COURTS) {
    return { group, courts, fetchedAtBySource };
  }
  if (courts.length === 1) permanentRedirect(courts[0].href);
  if (group.courts.length === 1) permanentRedirect(group.courts[0].href);
  return null;
}

/** `/koripallokentat/l517429` has no city segment. Send it to the canonical court. */
async function redirectPublicId(segment: string, groups: CourtIndexGroup[]) {
  const id = courtIdFromPublicId(segment);
  if (!id) return;
  const loaded = await loadCourtById(id);
  if (!loaded) return;
  if (isAwaitingEmail(loaded.court) && !(await viewerIsAdmin())) {
    redirect(mapCourtHref({ id: loaded.court.id, source: "pending" }));
  }
  permanentRedirect(canonicalCourtHref(loaded.court, groups));
}

async function viewerIsAdmin() {
  const session = await getAuthSession();
  return session?.user?.isAdmin === true;
}
