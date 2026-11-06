import { requireAdminPage } from "@/auth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminMetadata } from "@/lib/admin-metadata";
import { adminOverview } from "@/lib/admin-overview";
import { getCourtCatalog } from "@/lib/catalog";
import { getCopy } from "@/lib/copy";
import { listAdminCourtsWithPhotos } from "@/lib/court-photos";
import { listAdminFeedback } from "@/lib/feedback-store";
import { listAdminSubmittedCourts } from "@/lib/submitted-courts";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return adminMetadata(getCopy("fi").adminTitle);
}

export default async function AdminPage() {
  await requireAdminPage("/admin");

  const [{ fetchedAtBySource }, submitted, photoCourts, feedback] = await Promise.all([
    getCourtCatalog(),
    listAdminSubmittedCourts(),
    listAdminCourtsWithPhotos(),
    listAdminFeedback(),
  ]);

  return (
    <AdminShell fetchedAtBySource={fetchedAtBySource}>
      <AdminDashboard
        overview={adminOverview({
          feedback,
          photos: photoCourts,
          courts: submitted,
        })}
      />
    </AdminShell>
  );
}
