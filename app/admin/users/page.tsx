import type { Metadata } from "next";
import { ErrorState } from "@/frontend/components/ui/error-state";
import { PageHeader } from "@/frontend/components/ui/page-header";
import { UserManagement } from "@/frontend/components/admin/user-management";
import { requirePermission } from "@/backend/auth/session";
import { backend } from "@/backend/data";

export const metadata: Metadata = { title: "User Management" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await requirePermission("users.view");

  try {
    const [profiles, roles] = await Promise.all([backend.listStaff(), backend.listRoles()]);
    const users = await Promise.all(
      profiles.map(async (profile) => ({
        ...profile,
        role_name: (await backend.roleNameFor(profile.role_key)) ?? profile.role_key,
        effective_permissions: await backend.getEffectivePermissionsForProfile(profile),
      })),
    );

    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Administration"
          title="User management"
          description="Manage staff identities, account status, assigned roles, and individual access."
        />
        <UserManagement users={users} roles={roles} currentUserId={user.id} permissions={user.permissions} />
      </div>
    );
  } catch {
    return <ErrorState title="Could not load user accounts" showHome={false} />;
  }
}
