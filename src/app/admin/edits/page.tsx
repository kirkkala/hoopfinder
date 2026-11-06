import { requireAdminPage } from "@/auth";
import { AdminEditsView } from "@/components/admin/AdminCourtsView";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminMetadata } from "@/lib/admin-metadata";
import { getCourtCatalog } from "@/lib/catalog";
import { getCopy } from "@/lib/copy";
import { listAdminSubmittedCourts } from "@/lib/submitted-courts";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return adminMetadata(getCopy("fi").adminEditSuggestions);
}

export default async function AdminEditsPage() {
  await requireAdminPage("/admin/edits");

  const [{ fetchedAtBySource }, courts] = await Promise.all([
    getCourtCatalog(),
    listAdminSubmittedCourts(),
  ]);

  return (
    <AdminShell fetchedAtBySource={fetchedAtBySource}>
      <AdminEditsView courts={courts} />
    </AdminShell>
  );
}
