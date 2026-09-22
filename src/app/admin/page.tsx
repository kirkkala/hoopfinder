import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminCourtsView } from "@/components/admin/AdminCourtsView";
import { getAuthSession } from "@/auth";
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
  const session = await getAuthSession();
  if (!session?.user?.isAdmin) {
    redirect("/login?callbackUrl=/admin");
  }

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
