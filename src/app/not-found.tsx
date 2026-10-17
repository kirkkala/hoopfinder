import type { Metadata } from "next";
import { NotFoundView } from "@/components/brand/NotFoundView";
import { getCourtCatalog } from "@/lib/catalog";
import { getCopy } from "@/lib/copy";

const finnish = getCopy("fi");

export const metadata: Metadata = {
  title: finnish.notFoundTitle,
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  const { fetchedAtBySource } = await getCourtCatalog();
  return <NotFoundView fetchedAtBySource={fetchedAtBySource} />;
}
