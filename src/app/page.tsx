import { CourtExplorer } from "@/components/explorer/CourtExplorer";
import { getCourtCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ court?: string | string[] }>;
}) {
  const { courts, fetchedAtBySource } = await getCourtCatalog();
  const { court } = await searchParams;
  const focusId = typeof court === "string" ? court : null;
  return (
    <CourtExplorer
      courts={courts}
      fetchedAtBySource={fetchedAtBySource}
      focusId={focusId}
    />
  );
}
