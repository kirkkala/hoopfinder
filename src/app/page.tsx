import { CourtExplorer } from "@/components/explorer/CourtExplorer";
import { getCourtCatalog } from "@/lib/catalog";

export const revalidate = 86400;

export default async function HomePage() {
  const { courts, fetchedAt } = await getCourtCatalog();
  return <CourtExplorer courts={courts} fetchedAt={fetchedAt} />;
}
