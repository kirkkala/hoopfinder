import type { Metadata } from "next";
import { ConfirmCourtView } from "@/components/add-court/ConfirmCourtView";
import { ThanksRedirect } from "@/components/add-court/ThanksRedirect";
import { getCourtCatalog } from "@/lib/catalog";
import { courtHref } from "@/lib/courts";
import { getCopy } from "@/lib/copy";
import { confirmSubmittedCourt } from "@/lib/submitted-courts";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const finnish = getCopy("fi");
  return {
    title: finnish.confirmCourtInvalidTitle,
    robots: { index: false, follow: false },
  };
}

export default async function ConfirmCourtPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const courtId = await confirmSubmittedCourt(token);
  if (courtId) {
    return (
      <ThanksRedirect
        href={courtHref({ id: courtId, source: "pending" })}
        courtId={courtId}
      />
    );
  }

  const { courts, fetchedAtBySource } = await getCourtCatalog();
  return (
    <ConfirmCourtView
      courtCount={courts.length}
      fetchedAtBySource={fetchedAtBySource}
    />
  );
}
