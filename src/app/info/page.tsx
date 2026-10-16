import { permanentRedirect } from "next/navigation";
import { INFO_HREF } from "@/lib/constants";

export default function InfoPage() {
  permanentRedirect(INFO_HREF);
}
