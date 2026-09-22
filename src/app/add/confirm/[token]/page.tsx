import type { Metadata } from "next";
import { ConfirmCourtView } from "@/components/add-court/ConfirmCourtView";
import { getCourtCatalog } from "@/lib/catalog";
import { getCopy } from "@/lib/copy";
import { confirmSubmittedCourt } from "@/lib/submitted-courts";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const finnish = getCopy("fi");
  return {
    title: finnish.confirmCourtTitle,
    robots: { index: false, follow: false },
  };
}

export default async function ConfirmCourtPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const confirmed = (await confirmSubmittedCourt(token)) === "confirmed";
  const { courts, fetchedAtBySource } = await getCourtCatalog();

  return (
    <ConfirmCourtView
      confirmed={confirmed}
      courtCount={courts.length}
      fetchedAtBySource={fetchedAtBySource}
    />
  );
}
