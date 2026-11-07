"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { ActionDialog } from "@/frontend/components/ui/action-dialog";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Card } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Select } from "@/frontend/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/frontend/components/ui/table";
import {
  changeUserRoleAction,
  changeUserStatusAction,
  deleteUserAction,
  resetUserPasswordAction,
  saveUserPermissionsAction,
  updateUserAction,
} from "@/backend/actions/users";
import { createStaffAction } from "@/backend/actions/staff";
import { PERMISSION_GROUPS } from "@/shared/constants";
import { formatDateTimeKigali } from "@/shared/utils";
import type { PermissionKey, Profile, RoleRecord } from "@/shared/types";

type UserRow = Profile & {
  role_name: string;
  effective_permissions: PermissionKey[];
};

function can(permissions: PermissionKey[], permission: PermissionKey) {
  return permissions.includes(permission);
}

export function UserManagement({
  users,
  roles,
  currentUserId,
  permissions,
}: {
  users: UserRow[];
  roles: RoleRecord[];
  currentUserId: string;
  permissions: PermissionKey[];
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !search ||
        [user.full_name, user.email, user.role_name].some((value) =>
          value.toLowerCase().includes(search),
        );
      return (
        matchesSearch &&
        (roleFilter === "all" || user.role_key === roleFilter) &&
        (statusFilter === "all" || user.status === statusFilter)
      );
    });
  }, [users, query, roleFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              aria-label="Search users"
              className="pl-9"
              placeholder="Search by name, email, or role"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
            <Select aria-label="Filter by role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="all">All roles</option>
              {roles.map((role) => <option key={role.key} value={role.key}>{role.name}</option>)}
            </Select>
            <Select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="disabled">Disabled</option>
            </Select>
          </div>
          {can(permissions, "users.create") ? (
            <ActionDialog
              trigger={<Button><UserPlus /> Create user</Button>}
              title="Create user account"
              description="Create a staff login and assign its initial role. The password is securely hashed by the authentication provider."
              confirmLabel="Create account"
              action={createStaffAction}
            >
              <div className="space-y-1.5">
                <Label htmlFor="create-full-name">Full name</Label>
                <Input id="create-full-name" name="full_name" autoComplete="name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-email">Email address</Label>
                <Input id="create-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-role">Role</Label>
                <Select
                  id="create-role"
                  name="role"
                  defaultValue={roles.find((role) => role.key !== "admin")?.key}
                  required
                >
                  {roles.map((role) => <option key={role.key} value={role.key}>{role.name}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="create-password">Temporary password</Label>
                <Input id="create-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
              </div>
            </ActionDialog>
          ) : null}
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <TableRow key={user.id}>
                  <TableCell className="min-w-[220px]">
                    <p className="font-semibold text-navy">{user.full_name}{isSelf ? <span className="ml-2 text-[10px] font-medium text-primary">YOU</span> : null}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{user.role_name}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "success" : user.status === "suspended" ? "warning" : "neutral"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{formatDateTimeKigali(user.created_at)}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{user.last_login_at ? formatDateTimeKigali(user.last_login_at) : "Never"}</TableCell>
                  <TableCell>
                    <div className="flex min-w-[170px] flex-wrap justify-end gap-1.5">
                      {can(permissions, "users.edit") ? (
                        <>
                          <ActionDialog
                            trigger={<Button size="sm" variant="outline">Edit</Button>}
                            title="Edit user details"
                            description={`Update the name or email address for ${user.full_name}.`}
                            confirmLabel="Save changes"
                            action={updateUserAction}
                            hidden={{ userId: user.id }}
                          >
                            <div className="space-y-1.5">
                              <Label htmlFor={`name-${user.id}`}>Full name</Label>
                              <Input id={`name-${user.id}`} name="full_name" defaultValue={user.full_name} required />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor={`email-${user.id}`}>Email address</Label>
                              <Input id={`email-${user.id}`} name="email" type="email" defaultValue={user.email} required />
                            </div>
                          </ActionDialog>
                          <ActionDialog
                            trigger={<Button size="sm" variant="outline" disabled={isSelf}>Role</Button>}
                            title="Change user role"
                            description={`Changing the role affects ${user.full_name}'s inherited permissions.`}
                            confirmLabel="Save role"
                            action={changeUserRoleAction}
                            hidden={{ userId: user.id }}
                          >
                            <div className="space-y-1.5">
                              <Label htmlFor={`role-${user.id}`}>Assigned role</Label>
                              <Select id={`role-${user.id}`} name="role_key" defaultValue={user.role_key}>
                                {roles.map((role) => <option key={role.key} value={role.key}>{role.name}</option>)}
                              </Select>
                            </div>
                          </ActionDialog>
                          <ActionDialog
                            trigger={<Button size="sm" variant="outline" disabled={isSelf}>Status</Button>}
                            title="Change account status"
                            description={`Choose whether ${user.full_name} can sign in to MUBILIGI HUB.`}
                            confirmLabel="Update status"
                            action={changeUserStatusAction}
                            hidden={{ userId: user.id }}
                          >
                            <div className="space-y-1.5">
                              <Label htmlFor={`status-${user.id}`}>Account status</Label>
                              <Select id={`status-${user.id}`} name="status" defaultValue={user.status}>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="disabled">Disabled</option>
                              </Select>
                            </div>
                          </ActionDialog>
                        </>
                      ) : null}
                      {can(permissions, "permissions.assign") ? (
                        <ActionDialog
                          trigger={<Button size="sm" variant="outline" disabled={user.role_key === "admin"}>Access</Button>}
                          title="Individual permissions"
                          description="These permissions override the selected role for this user."
                          confirmLabel="Save permissions"
                          action={saveUserPermissionsAction}
                          hidden={{ userId: user.id }}
                        >
                          <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
                            {PERMISSION_GROUPS.map((group) => (
                              <fieldset key={group.group} className="space-y-2">
                                <legend className="text-xs font-semibold text-navy">{group.group}</legend>
                                {group.permissions.map((permission) => (
                                  <label key={permission.key} className="flex items-start gap-2 text-xs text-slate-600">
                                    <input
                                      type="checkbox"
                                      name="permissions"
                                      value={permission.key}
                                      defaultChecked={user.effective_permissions.includes(permission.key)}
                                      className="mt-0.5 accent-primary"
                                    />
                                    <span>{permission.label}</span>
                                  </label>
                                ))}
                              </fieldset>
                            ))}
                          </div>
                        </ActionDialog>
                      ) : null}
                      {can(permissions, "users.edit") ? (
                        <ActionDialog
                          trigger={<Button size="sm" variant="outline" disabled={isSelf}>Reset password</Button>}
                          title="Set a new password"
                          description={`Set a temporary password for ${user.full_name}. Share it securely.`}
                          confirmLabel="Reset password"
                          action={resetUserPasswordAction}
                          hidden={{ userId: user.id }}
                        >
                          <div className="space-y-1.5">
                            <Label htmlFor={`password-${user.id}`}>New password</Label>
                            <Input id={`password-${user.id}`} name="password" type="password" autoComplete="new-password" minLength={8} required />
                          </div>
                        </ActionDialog>
                      ) : null}
                      {can(permissions, "users.delete") ? (
                        <ActionDialog
                          trigger={<Button size="sm" variant="destructive" disabled={isSelf}>Delete</Button>}
                          title="Delete user account?"
                          description={`This will deactivate ${user.full_name}'s account. Existing audit history will be preserved.`}
                          confirmLabel="Delete account"
                          variant="destructive"
                          action={deleteUserAction}
                          hidden={{ userId: user.id }}
                        />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredUsers.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-12 text-center text-sm text-slate-500">No users match these filters.</TableCell></TableRow>
            ) : null}
          </TableBody>
        </Table>
        <p className="border-t border-line px-4 py-3 text-xs text-slate-500">
          Showing {filteredUsers.length} of {users.length} accounts
        </p>
      </Card>
    </div>
  );
}
