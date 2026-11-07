import type { Metadata } from "next";
import { Archive } from "lucide-react";
import { ArchivedRecords } from "@/frontend/components/admin/archived-records";
import { EmptyState } from "@/frontend/components/ui/empty-state";
import { ErrorState } from "@/frontend/components/ui/error-state";
import { PageHeader } from "@/frontend/components/ui/page-header";
import { requirePermission } from "@/backend/auth/session";
import { backend } from "@/backend/data";

export const metadata: Metadata = { title: "Record archive" };
export const dynamic = "force-dynamic";

export default async function AdminArchivePage() {
  const user = await requirePermission("records.restore");

  try {
    const records = await backend.listArchivedRecords();
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Record management"
          title="Archive"
          description="Restore archived registrations or permanently remove records only when retention requirements allow."
        />
        {records.length === 0 ? (
          <EmptyState icon={Archive} title="Archive is empty" description="Archived records will be available here for restoration." />
        ) : (
          <ArchivedRecords records={records} canDelete={user.permissions.includes("records.delete")} />
        )}
      </div>
    );
  } catch {
    return <ErrorState title="Could not load archived records" showHome={false} />;
  }
}
