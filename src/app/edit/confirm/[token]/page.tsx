import type { Metadata } from "next";
import { headers } from "next/headers";
import { ConfirmCourtView } from "@/components/add-court/ConfirmCourtView";
import { ThanksRedirect } from "@/components/add-court/ThanksRedirect";
import { getCourtCatalog } from "@/lib/catalog";
import { getCopy } from "@/lib/copy";
import { canonicalCourtHref } from "@/lib/court-index";
import { loadCourtById, loadCourtIndex } from "@/lib/court-page";
import { courtHref } from "@/lib/courts";
import { siteOrigin } from "@/lib/site-origin";
import { confirmSubmittedCourt, getSubmittedCourt } from "@/lib/submitted-courts";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const finnish = getCopy("fi");
  return {
    title: finnish.confirmCourtInvalidTitle,
    robots: { index: false, follow: false },
  };
}

export default async function ConfirmEditPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const origin = siteOrigin(await headers());
  const result = await confirmSubmittedCourt(token, origin);
  if (typeof result === "string") {
    const submitted = await getSubmittedCourt(result);
    if (submitted?.editOf) {
      const [target, index] = await Promise.all([
        loadCourtById(submitted.editOf),
        loadCourtIndex(),
      ]);
      if (target && !target.editOf) {
        return (
          <ThanksRedirect
            href={canonicalCourtHref(target.court, index.groups)}
            courtId={target.court.id}
            edit
            live={submitted.status === "published"}
          />
        );
      }
    }
    return <ThanksRedirect href={courtHref({ id: result, source: "pending" })} courtId={result} />;
  }

  const { fetchedAtBySource } = await getCourtCatalog();
  return (
    <ConfirmCourtView
      notifyFailed={result?.error === "email"}
      fetchedAtBySource={fetchedAtBySource}
    />
  );
}
