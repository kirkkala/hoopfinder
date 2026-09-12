import { CourtExplorer } from "@/components/explorer/CourtExplorer";
import { getBasketballCourts } from "@/lib/catalog";

export const revalidate = 86400;

export default async function HomePage() {
  const courts = await getBasketballCourts();
  return <CourtExplorer courts={courts} />;
}
