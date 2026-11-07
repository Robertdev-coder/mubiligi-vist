"use client";

import { ActionDialog } from "@/frontend/components/ui/action-dialog";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import {
  createRoleAction,
  deleteRoleAction,
  saveRolePermissionsAction,
  updateRoleAction,
} from "@/backend/actions/roles";
import { PERMISSION_GROUPS } from "@/shared/constants";
import type { PermissionKey, RoleRecord } from "@/shared/types";

export function RolesManagement({
  roles,
  permissionMap,
}: {
  roles: RoleRecord[];
  permissionMap: Record<string, PermissionKey[]>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-navy">{roles.length} roles configured</h2>
          <p className="text-xs text-muted">The Super Administrator always retains every permission.</p>
        </div>
        <ActionDialog
          trigger={<Button>Create custom role</Button>}
          title="Create custom role"
          description="Use a unique key made from lowercase letters, numbers, and underscores."
          confirmLabel="Create role"
          action={createRoleAction}
        >
          <div className="space-y-1.5">
            <Label htmlFor="role-key">Role key</Label>
            <Input id="role-key" name="key" placeholder="assistant_dos" pattern="[a-z][a-z0-9_]*" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-name">Role name</Label>
            <Input id="role-name" name="name" placeholder="Assistant DOS" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-description">Description</Label>
            <Textarea id="role-description" name="description" rows={3} />
          </div>
        </ActionDialog>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {roles.map((role) => {
          const granted = role.key === "admin" ? PERMISSION_GROUPS.flatMap((group) => group.permissions.map((item) => item.key)) : permissionMap[role.key] ?? [];
          return (
            <Card key={role.key} className="overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-navy">{role.name}</h3>
                    {role.is_system ? <span className="rounded-full bg-sky-soft px-2 py-0.5 text-[10px] font-semibold text-primary">SYSTEM</span> : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{role.description || "No description"}</p>
                  <p className="mt-1 font-mono text-[10px] text-slate-400">{role.key}</p>
                </div>
                <div className="flex gap-2">
                  <ActionDialog
                    trigger={<Button size="sm" variant="outline">Edit</Button>}
                    title="Edit role details"
                    description={`Update the display name or description for ${role.name}.`}
                    confirmLabel="Save changes"
                    action={updateRoleAction}
                    hidden={{ key: role.key }}
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor={`role-name-${role.key}`}>Role name</Label>
                      <Input id={`role-name-${role.key}`} name="name" defaultValue={role.name} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`role-description-${role.key}`}>Description</Label>
                      <Textarea id={`role-description-${role.key}`} name="description" defaultValue={role.description} rows={3} />
                    </div>
                  </ActionDialog>
                  <ActionDialog
                    trigger={<Button size="sm" variant="outline" disabled={role.is_system || role.key === "admin"}>Delete</Button>}
                    title="Delete role?"
                    description={`Delete ${role.name}? Any users assigned to this role must first be reassigned. This action cannot be undone.`}
                    confirmLabel="Delete role"
                    variant="destructive"
                    action={deleteRoleAction}
                    hidden={{ key: role.key }}
                  />
                </div>
              </div>

              <ActionDialog
                trigger={<Button variant="outline" className="m-4 mb-0">Configure permissions ({granted.length})</Button>}
                title={`Permissions: ${role.name}`}
                description="Changes are applied to all users assigned to this role after saving."
                confirmLabel="Save permissions"
                action={saveRolePermissionsAction}
                hidden={{ key: role.key }}
              >
                <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
                  {PERMISSION_GROUPS.map((group) => (
                    <fieldset key={group.group} className="space-y-2">
                      <legend className="text-xs font-semibold text-navy">{group.group}</legend>
                      {group.permissions.map((permission) => (
                        <label key={permission.key} className="flex items-start gap-2 text-xs text-slate-600">
                          <input
                            type="checkbox"
                            name="permissions"
                            value={permission.key}
                            defaultChecked={granted.includes(permission.key)}
                            disabled={role.key === "admin"}
                            className="mt-0.5 accent-primary"
                          />
                          <span>
                            <span className="block font-medium text-slate-700">{permission.label}</span>
                            <span className="block text-[11px] text-slate-400">{permission.description}</span>
                          </span>
                        </label>
                      ))}
                    </fieldset>
                  ))}
                </div>
              </ActionDialog>
              <p className="px-5 pb-4 pt-2 text-[11px] text-slate-400">
                {role.key === "admin" ? "All permissions are permanently enabled." : `${granted.length} permissions granted`}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
