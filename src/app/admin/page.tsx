import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import { AdminCourtsView } from "@/components/admin/AdminCourtsView";
import { getCourtCatalog } from "@/lib/catalog";
import { getCopy } from "@/lib/copy";
import { listAdminCourtsWithPhotos } from "@/lib/court-photos";
import { listAdminFeedback } from "@/lib/feedback-store";
import { countPublicCourts, listAdminSubmittedCourts } from "@/lib/submitted-courts";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const finnish = getCopy("fi");
  return {
    title: finnish.adminTitle,
    robots: { index: false, follow: false },
  };
}

export default async function AdminPage() {
  const session = await getAuthSession();
  if (!session?.user?.isAdmin) {
    redirect("/login?callbackUrl=/admin");
  }

  const [{ fetchedAtBySource }, submitted, courtCount, photoCourts, feedback] = await Promise.all([
    getCourtCatalog(),
    listAdminSubmittedCourts(),
    countPublicCourts(),
    listAdminCourtsWithPhotos(),
    listAdminFeedback(),
  ]);

  return (
    <AdminCourtsView
      courtCount={courtCount}
      fetchedAtBySource={fetchedAtBySource}
      courts={submitted}
      photoCourts={photoCourts}
      feedback={feedback}
    />
  );
}
