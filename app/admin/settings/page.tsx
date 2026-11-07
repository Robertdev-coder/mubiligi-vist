import type { Metadata } from "next";
import { requirePermission } from "@/backend/auth/session";
import { backend } from "@/backend/data";
import { PageHeader } from "@/frontend/components/ui/page-header";
import { ErrorState } from "@/frontend/components/ui/error-state";
import { SettingsView } from "@/frontend/components/settings/settings-view";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await requirePermission("settings.manage");

  try {
    const [visitDays, staff, auditLogs] = await Promise.all([
      backend.listVisitDays(),
      backend.listStaff(),
      backend.listAuditLogs(30),
    ]);

    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Administration"
          title="Settings"
          description="Manage visit days and the registration window, control staff access, and review recent activity."
        />
        <SettingsView
          visitDays={visitDays}
          staff={staff}
          currentUserId={user.id}
          auditLogs={auditLogs}
        />
      </div>
    );
  } catch {
    return <ErrorState title="Could not load settings" showHome={false} />;
  }
}
