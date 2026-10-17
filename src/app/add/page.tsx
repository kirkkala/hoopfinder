import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddCourtView } from "@/components/add-court/AddCourtView";
import { getCourtCatalog } from "@/lib/catalog";
import { MAP_PATH } from "@/lib/constants";
import { getCopy } from "@/lib/copy";
import { isDatabaseUnavailable } from "@/lib/db";
import { siteOpenGraph } from "@/lib/og";

export async function generateMetadata(): Promise<Metadata> {
  const finnish = getCopy("fi");
  return {
    title: finnish.addCourt,
    description: finnish.addCourtLead,
    alternates: { canonical: "/add" },
    openGraph: siteOpenGraph({
      title: finnish.addCourt,
      description: finnish.addCourtLead,
      url: "/add",
    }),
  };
}

export default async function AddCourtPage() {
  const { fetchedAtBySource } = await getCourtCatalog();
  if (isDatabaseUnavailable()) redirect(MAP_PATH);

  return <AddCourtView fetchedAtBySource={fetchedAtBySource} />;
}
