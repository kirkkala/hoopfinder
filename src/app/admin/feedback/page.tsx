import { requireAdminPage } from "@/auth";
import { AdminFeedbackList } from "@/components/admin/AdminFeedbackList";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminMetadata } from "@/lib/admin-metadata";
import { getCourtCatalog } from "@/lib/catalog";
import { getCopy } from "@/lib/copy";
import { listAdminFeedback } from "@/lib/feedback-store";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return adminMetadata(getCopy("fi").adminFeedbackTitle);
}

export default async function AdminFeedbackPage() {
  await requireAdminPage("/admin/feedback");

  const [{ fetchedAtBySource }, feedback] = await Promise.all([
    getCourtCatalog(),
    listAdminFeedback(),
  ]);

  return (
    <AdminShell fetchedAtBySource={fetchedAtBySource}>
      <AdminFeedbackList items={feedback} />
    </AdminShell>
  );
}
