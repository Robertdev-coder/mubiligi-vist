import type { Metadata } from "next";
import { ErrorState } from "@/frontend/components/ui/error-state";
import { PageHeader } from "@/frontend/components/ui/page-header";
import { RolesManagement } from "@/frontend/components/admin/roles-management";
import { requirePermission } from "@/backend/auth/session";
import { backend } from "@/backend/data";

export const metadata: Metadata = { title: "Roles & Permissions" };
export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  await requirePermission("roles.manage");

  try {
    const [roles, permissionMap] = await Promise.all([
      backend.listRoles(),
      backend.listRolePermissionMap(),
    ]);

    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Administration"
          title="Roles & permissions"
          description="Create custom roles and configure exactly which actions each role can perform."
        />
        <RolesManagement roles={roles} permissionMap={permissionMap} />
      </div>
    );
  } catch {
    return <ErrorState title="Could not load roles and permissions" showHome={false} />;
  }
}
