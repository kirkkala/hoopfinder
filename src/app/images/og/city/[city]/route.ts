import { getCopy } from "@/lib/copy";
import { CITY_PAGE_MIN_COURTS, cityGroupBySegment, publicCityCourts } from "@/lib/court-index";
import { loadCourtIndex } from "@/lib/court-page";
import { generateCourtOgImage } from "@/lib/og";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext<"/images/og/city/[city]">) {
  const { city } = await context.params;
  const { groups } = await loadCourtIndex();
  const group = cityGroupBySegment(groups, city);
  const courts = group ? publicCityCourts(group.courts) : [];
  if (!group?.pageHref || courts.length < CITY_PAGE_MIN_COURTS) {
    return new Response("Not Found", { status: 404 });
  }

  const copy = getCopy("fi");
  const place = group.city ?? copy.cityUnknown;
  return generateCourtOgImage({
    name: place,
    place: copy.cityOgCaption(courts.length),
  });
}
