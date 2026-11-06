import { requireAdminPage } from "@/auth";
import { AdminPhotoList } from "@/components/admin/AdminCourtsView";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminMetadata } from "@/lib/admin-metadata";
import { getCourtCatalog } from "@/lib/catalog";
import { getCopy } from "@/lib/copy";
import { listAdminCourtsWithPhotos } from "@/lib/court-photos";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return adminMetadata(getCopy("fi").adminPhotosTitle);
}

export default async function AdminPhotosPage() {
  await requireAdminPage("/admin/photos");

  const [{ fetchedAtBySource }, photos] = await Promise.all([
    getCourtCatalog(),
    listAdminCourtsWithPhotos(),
  ]);

  return (
    <AdminShell fetchedAtBySource={fetchedAtBySource}>
      <AdminPhotoList courts={photos} />
    </AdminShell>
  );
}
