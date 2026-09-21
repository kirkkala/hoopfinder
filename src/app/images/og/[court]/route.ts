import { getBasketballCourt } from "@/lib/catalog";
import { getCopy } from "@/lib/copy";
import {
  courtIdFromParam,
  courtTitle,
  formatAddress,
} from "@/lib/courts";
import {
  generateCourtOgImage,
  generateHomeOgImage,
  HOME_OG_ID,
} from "@/lib/og";
import { getPublishedSubmittedCourt } from "@/lib/submitted-courts";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: RouteContext<"/images/og/[court]">,
) {
  const { court: param } = await context.params;
  if (param === HOME_OG_ID) return generateHomeOgImage();

  const id = courtIdFromParam(param);
  const result = id ? await getCourtById(id) : null;
  if (!result) return new Response("Not Found", { status: 404 });

  const copy = getCopy("fi");
  const name = courtTitle(result.court, copy);
  const place =
    formatAddress([
      result.court.address,
      result.court.neighborhood,
      result.court.city,
    ]) || copy.addressMissing;

  return generateCourtOgImage({ name, place });
}

async function getCourtById(id: string) {
  const catalogCourt = await getBasketballCourt(id);
  if (catalogCourt) return catalogCourt;
  const submitted = await getPublishedSubmittedCourt(id);
  if (!submitted) return null;
  return { court: submitted.court, sourceFetchedAt: submitted.createdAt };
}
