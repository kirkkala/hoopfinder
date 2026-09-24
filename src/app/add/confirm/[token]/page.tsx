import type { Metadata } from "next";
import { headers } from "next/headers";
import { ConfirmCourtView } from "@/components/add-court/ConfirmCourtView";
import { ThanksRedirect } from "@/components/add-court/ThanksRedirect";
import { getCourtCatalog } from "@/lib/catalog";
import { courtHref } from "@/lib/courts";
import { getCopy } from "@/lib/copy";
import { siteOrigin } from "@/lib/site-origin";
import { confirmSubmittedCourt, countPublicCourts } from "@/lib/submitted-courts";

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
  const result = await confirmSubmittedCourt(token, siteOrigin(await headers()));
  if (typeof result === "string") {
    return (
      <ThanksRedirect
        href={courtHref({ id: result, source: "pending" })}
        courtId={result}
      />
    );
  }

  const [{ fetchedAtBySource }, courtCount] = await Promise.all([
    getCourtCatalog(),
    countPublicCourts(),
  ]);
  return (
    <ConfirmCourtView
      notifyFailed={result?.error === "email"}
      courtCount={courtCount}
      fetchedAtBySource={fetchedAtBySource}
    />
  );
}
