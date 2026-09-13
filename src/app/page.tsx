import { CourtExplorer } from "@/components/explorer/CourtExplorer";
import { getCourtCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ court?: string | string[] }>;
}) {
  const { courts, fetchedAt } = await getCourtCatalog();
  const { court } = await searchParams;
  const focusId = typeof court === "string" ? court : null;
  return (
    <CourtExplorer courts={courts} fetchedAt={fetchedAt} focusId={focusId} />
  );
}
