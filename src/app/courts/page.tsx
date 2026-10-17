import { permanentRedirect } from "next/navigation";
import { COURT_INDEX_PATH } from "@/lib/constants";

export default function LegacyCourtIndexPage() {
  permanentRedirect(COURT_INDEX_PATH);
}
