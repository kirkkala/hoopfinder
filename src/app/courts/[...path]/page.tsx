import { notFound, permanentRedirect, redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import { COURT_INDEX_PATH } from "@/lib/constants";
import { canonicalCourtHref } from "@/lib/court-index";
import { loadCourtById, loadCourtIndex } from "@/lib/court-page";
import { isAwaitingEmail, mapCourtHref, parseCourtPath } from "@/lib/courts";

export default async function LegacyCourtPage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const parsed = parseCourtPath(path);
  if (parsed === "index") permanentRedirect(COURT_INDEX_PATH);
  if (!parsed) notFound();

  const [loaded, index] = await Promise.all([loadCourtById(parsed.id), loadCourtIndex()]);
  if (!loaded) notFound();
  if (isAwaitingEmail(loaded.court) && !(await viewerIsAdmin())) {
    redirect(mapCourtHref({ id: loaded.court.id, source: "pending" }));
  }
  permanentRedirect(canonicalCourtHref(loaded.court, index.groups));
}

async function viewerIsAdmin() {
  const session = await getAuthSession();
  return session?.user?.isAdmin === true;
}
