import { COURT_DATA_REVALIDATE } from "@/lib/constants";
import { getCourtCatalog } from "@/lib/catalog";
import { toExplorerCourt } from "@/lib/courts";

export async function GET() {
  const { courts } = await getCourtCatalog();
  return Response.json(
    { courts: courts.map(toExplorerCourt) },
    {
      headers: {
        "Cache-Control": `public, max-age=${COURT_DATA_REVALIDATE}, stale-while-revalidate=86400`,
      },
    },
  );
}
