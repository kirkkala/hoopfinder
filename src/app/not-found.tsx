import type { Metadata } from "next";
import { NotFoundView } from "@/components/brand/NotFoundView";
import { getCourtCatalog } from "@/lib/catalog";
import { countPublicCourts } from "@/lib/submitted-courts";
import { getCopy } from "@/lib/copy";

const finnish = getCopy("fi");

export const metadata: Metadata = {
  title: finnish.notFoundTitle,
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  const [{ fetchedAtBySource }, courtCount] = await Promise.all([
    getCourtCatalog(),
    countPublicCourts(),
  ]);
  return (
    <NotFoundView
      courtCount={courtCount}
      fetchedAtBySource={fetchedAtBySource}
    />
  );
}
