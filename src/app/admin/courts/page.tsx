import { requireAdminPage } from "@/auth";
import { AdminSubmittedCourts } from "@/components/admin/AdminCourtsView";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminMetadata } from "@/lib/admin-metadata";
import { getCourtCatalog } from "@/lib/catalog";
import { getCopy } from "@/lib/copy";
import { listAdminSubmittedCourts } from "@/lib/submitted-courts";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return adminMetadata(getCopy("fi").adminCourtsTitle);
}

export default async function AdminCourtsPage() {
  await requireAdminPage("/admin/courts");

  const [{ fetchedAtBySource }, courts] = await Promise.all([
    getCourtCatalog(),
    listAdminSubmittedCourts(),
  ]);

  return (
    <AdminShell fetchedAtBySource={fetchedAtBySource}>
      <AdminSubmittedCourts courts={courts} />
    </AdminShell>
  );
}
