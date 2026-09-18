import { getCopy } from "@/lib/copy";
import { getBasketballCourt } from "@/lib/catalog";
import { courtName, formatAddress } from "@/lib/courts";
import {
  generateCourtOgImage,
  generateHomeOgImage,
  OG_CONTENT_TYPE,
  OG_SIZE,
} from "@/lib/og";

export const alt = getCopy("fi").metaOgImageAlt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function CourtOpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getBasketballCourt(id);
  const copy = getCopy("fi");
  if (!result) return generateHomeOgImage();

  const name = courtName(result.court, copy);
  const place =
    formatAddress([
      result.court.address,
      result.court.neighborhood,
      result.court.city,
    ]) || copy.addressMissing;

  return generateCourtOgImage({ name, place });
}
