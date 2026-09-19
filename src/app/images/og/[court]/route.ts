import { getBasketballCourt } from "@/lib/catalog";
import { getCopy } from "@/lib/copy";
import {
  courtIdFromParam,
  courtTitle,
  formatAddress,
} from "@/lib/courts";
import { generateCourtOgImage } from "@/lib/og";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: RouteContext<"/images/og/[court]">,
) {
  const { court: param } = await context.params;
  const id = courtIdFromParam(param);
  const result = id ? await getBasketballCourt(id) : null;
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
