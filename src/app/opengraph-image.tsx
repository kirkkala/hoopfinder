import { getCopy } from "@/lib/copy";
import {
  generateHomeOgImage,
  OG_CONTENT_TYPE,
  OG_SIZE,
} from "@/lib/og";

export const alt = getCopy("fi").metaOgImageAlt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpenGraphImage() {
  return generateHomeOgImage();
}
