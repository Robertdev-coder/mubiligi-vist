"use server";

import { revalidatePath } from "next/cache";
import { backend } from "@/backend/data";
import { getSessionUser } from "@/backend/auth/session";
import { PERMISSION_KEYS } from "@/shared/constants";
import type { PermissionKey } from "@/shared/types";
import { firstZodError, roleSchema, type ActionState } from "@/shared/validation/schemas";

async function roleManager() {
  const user = await getSessionUser();
  if (!user || !user.permissions.includes("roles.manage")) return null;
  return user;
}

function revalidateRoles() {
  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");
}

export async function createRoleAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await roleManager();
  if (!user) return { ok: false, message: "You do not have permission to manage roles." };

  const parsed = roleSchema.safeParse({
    key: String(formData.get("key") ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: firstZodError(parsed.error),
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
      ),
    };
  }

  try {
    const role = await backend.createRole({
      key: parsed.data.key,
      name: parsed.data.name,
      description: parsed.data.description ?? "",
    });
    await backend.logAudit(user.id, "role.created", "role", role.key, `Created role ${role.name}`);
    revalidateRoles();
    return { ok: true, message: "Role created successfully." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not create the role.",
    };
  }
}

export async function updateRoleAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await roleManager();
  if (!user) return { ok: false, message: "You do not have permission to manage roles." };

  const key = String(formData.get("key") ?? "");
  const parsed = roleSchema.safeParse({
    key,
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!key || !parsed.success) {
    return { ok: false, message: parsed.success ? "Role not found." : firstZodError(parsed.error) };
  }

  try {
    await backend.updateRole(key, {
      name: parsed.data.name,
      description: parsed.data.description ?? "",
    });
    await backend.logAudit(user.id, "role.updated", "role", key, `Updated role ${parsed.data.name}`);
    revalidateRoles();
    return { ok: true, message: "Role updated." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not update the role.",
    };
  }
}

export async function deleteRoleAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await roleManager();
  if (!user) return { ok: false, message: "You do not have permission to manage roles." };

  const key = String(formData.get("key") ?? "");
  if (!key) return { ok: false, message: "Role not found." };

  try {
    const role = await backend.getRole(key);
    await backend.deleteRole(key);
    await backend.logAudit(user.id, "role.deleted", "role", key, `Deleted role ${role?.name ?? key}`);
    revalidateRoles();
    return { ok: true, message: "Role deleted." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not delete the role.",
    };
  }
}

export async function saveRolePermissionsAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await roleManager();
  if (!user) return { ok: false, message: "You do not have permission to manage roles." };

  const key = String(formData.get("key") ?? "");
  if (!key) return { ok: false, message: "Role not found." };
  const submittedPermissions = formData.getAll("permissions").map(String);
  const validPermissions = new Set<string>(PERMISSION_KEYS);
  if (submittedPermissions.some((permission) => !validPermissions.has(permission))) {
    return { ok: false, message: "One or more selected permissions are invalid." };
  }
  const permissions = submittedPermissions.filter(
    (permission): permission is PermissionKey => validPermissions.has(permission),
  );

  try {
    await backend.setRolePermissions(key, permissions);
    const role = await backend.getRole(key);
    await backend.logAudit(
      user.id,
      "role.permissions_changed",
      "role",
      key,
      `${permissions.length} permission(s) for ${role?.name ?? key}`,
    );
    revalidateRoles();
    return { ok: true, message: "Role permissions saved." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not save role permissions.",
    };
  }
}
