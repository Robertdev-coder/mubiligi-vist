"use server";

import { revalidatePath } from "next/cache";
import { backend } from "@/backend/data";
import { getSessionUser } from "@/backend/auth/session";
import {
  firstZodError,
  passwordResetSchema,
  userStatusSchema,
  userUpdateSchema,
  type ActionState,
} from "@/shared/validation/schemas";
import { PERMISSION_KEYS } from "@/shared/constants";
import type { PermissionKey, UserPermissionOverride } from "@/shared/types";

async function userWith(permission: PermissionKey) {
  const user = await getSessionUser();
  if (!user || !user.permissions.includes(permission)) return null;
  return user;
}

function revalidateUsers() {
  revalidatePath("/admin/users");
  revalidatePath("/admin/roles");
  revalidatePath("/admin/settings");
}

export async function updateUserAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await userWith("users.edit");
  if (!user) return { ok: false, message: "You do not have permission to edit users." };

  const id = String(formData.get("userId") ?? "");
  if (!id) return { ok: false, message: "User not found." };

  const parsed = userUpdateSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
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
    await backend.updateStaffProfile(id, parsed.data);
    await backend.logAudit(user.id, "user.updated", "profile", id, `Updated ${parsed.data.email}`);
    revalidateUsers();
    return { ok: true, message: "User details updated." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not update the user.",
    };
  }
}

export async function changeUserRoleAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await userWith("users.edit");
  if (!user) return { ok: false, message: "You do not have permission to change roles." };

  const id = String(formData.get("userId") ?? "");
  const roleKey = String(formData.get("role_key") ?? "");
  if (!id || !roleKey) return { ok: false, message: "Invalid role change." };
  if (id === user.id && roleKey !== "admin" && user.role === "admin") {
    return { ok: false, message: "You cannot remove your own Super Administrator role." };
  }

  try {
    await backend.updateStaffRole(id, roleKey);
    const role = await backend.getRole(roleKey);
    await backend.logAudit(
      user.id,
      "user.role_changed",
      "profile",
      id,
      `Role changed to ${role?.name ?? roleKey}`,
    );
    revalidateUsers();
    return { ok: true, message: "User role updated." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not update the role.",
    };
  }
}

export async function changeUserStatusAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await userWith("users.edit");
  if (!user) return { ok: false, message: "You do not have permission to change account status." };

  const id = String(formData.get("userId") ?? "");
  const parsed = userStatusSchema.safeParse({ status: formData.get("status") });
  if (!id || !parsed.success) return { ok: false, message: "Invalid account status." };
  if (id === user.id && parsed.data.status !== "active") {
    return { ok: false, message: "You cannot suspend or disable your own account." };
  }

  try {
    await backend.setStaffStatus(id, parsed.data.status);
    await backend.logAudit(
      user.id,
      `user.${parsed.data.status}`,
      "profile",
      id,
      `Account status set to ${parsed.data.status}`,
    );
    revalidateUsers();
    return { ok: true, message: `Account marked as ${parsed.data.status}.` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not update the account status.",
    };
  }
}

export async function deleteUserAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await userWith("users.delete");
  if (!user) return { ok: false, message: "You do not have permission to delete users." };

  const id = String(formData.get("userId") ?? "");
  if (!id) return { ok: false, message: "User not found." };
  if (id === user.id) return { ok: false, message: "You cannot delete your own account." };

  try {
    await backend.deleteStaff(id, user.id);
    revalidateUsers();
    return { ok: true, message: "User account deleted. Audit history is preserved." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not delete the user.",
    };
  }
}

export async function resetUserPasswordAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await userWith("users.edit");
  if (!user) return { ok: false, message: "You do not have permission to reset passwords." };

  const id = String(formData.get("userId") ?? "");
  const parsed = passwordResetSchema.safeParse({ password: formData.get("password") });
  if (!id) return { ok: false, message: "User not found." };
  if (!parsed.success) {
    return { ok: false, message: firstZodError(parsed.error) };
  }

  try {
    await backend.resetStaffPassword(id, parsed.data.password);
    await backend.logAudit(user.id, "user.password_reset", "profile", id, "Password reset by administrator");
    revalidateUsers();
    return { ok: true, message: "Password reset successfully." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not reset the password.",
    };
  }
}

export async function saveUserPermissionsAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await userWith("permissions.assign");
  if (!user) return { ok: false, message: "You do not have permission to assign permissions." };

  const id = String(formData.get("userId") ?? "");
  if (!id) return { ok: false, message: "User not found." };

  const target = await backend.getProfileById(id);
  if (!target) return { ok: false, message: "User not found." };
  if (target.role_key === "admin") {
    return { ok: false, message: "Super Administrator always keeps every permission." };
  }

  const desired = new Set(formData.getAll("permissions").map(String));
  const rolePermissions = new Set(await backend.listRolePermissions(target.role_key));
  const overrides: UserPermissionOverride[] = [];
  for (const key of PERMISSION_KEYS) {
    const shouldAllow = desired.has(key);
    const roleAllows = rolePermissions.has(key);
    if (shouldAllow !== roleAllows) {
      overrides.push({ permission_key: key, allowed: shouldAllow });
    }
  }

  try {
    await backend.setUserPermissionOverrides(id, overrides);
    await backend.logAudit(
      user.id,
      "user.permissions_changed",
      "profile",
      id,
      `${overrides.length} permission override(s) for ${target.email}`,
    );
    revalidateUsers();
    return { ok: true, message: "User permissions saved." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not save user permissions.",
    };
  }
}
