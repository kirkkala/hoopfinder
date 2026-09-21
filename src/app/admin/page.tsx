import type { Metadata } from "next";
import { AdminCourtsView } from "@/components/admin/AdminCourtsView";
import { getCourtCatalog } from "@/lib/catalog";
import { getCopy } from "@/lib/copy";
import { listAdminSubmittedCourts } from "@/lib/submitted-courts";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const finnish = getCopy("fi");
  return {
    title: finnish.adminTitle,
    robots: { index: false, follow: false },
  };
}

export default async function AdminPage() {
  const [{ courts, fetchedAtBySource }, submitted] = await Promise.all([
    getCourtCatalog(),
    listAdminSubmittedCourts(),
  ]);

  return (
    <AdminCourtsView
      courtCount={courts.length}
      fetchedAtBySource={fetchedAtBySource}
      courts={submitted}
    />
  );
}
