"use server";

import { revalidatePath } from "next/cache";
import { backend } from "@/backend/data";
import { getSessionUser } from "@/backend/auth/session";
import { firstZodError, staffSchema, type ActionState } from "@/shared/validation/schemas";
import type { PermissionKey, Role } from "@/shared/types";

async function staffUser(permission: PermissionKey) {
  const user = await getSessionUser();
  if (!user || !user.permissions.includes(permission)) return null;
  return user;
}

export async function createStaffAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await staffUser("users.create");
  if (!user) return { ok: false, message: "You do not have permission to add staff accounts." };

  const parsed = staffSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
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
    const profile = await backend.createStaff(parsed.data);
    await backend.logAudit(
      user.id,
      "user.created",
      "profile",
      profile.id,
      `Created ${profile.email} with role ${profile.role_key}`,
    );
    revalidatePath("/admin/users");
    revalidatePath("/admin/settings");
    return { ok: true, message: "Staff account created successfully." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not create the staff account.",
    };
  }
}

export async function updateStaffRoleAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await staffUser("users.edit");
  if (!user) return { ok: false, message: "You do not have permission to change user roles." };

  const id = String(formData.get("staffId") ?? "");
  const role = String(formData.get("role") ?? "") as Role;
  if (!id || !role) {
    return { ok: false, message: "Invalid staff update." };
  }
  if (id === user.id && role !== "admin" && user.role === "admin") {
    return { ok: false, message: "You cannot remove your own Super Administrator role." };
  }

  try {
    await backend.updateStaffRole(id, role);
    await backend.logAudit(user.id, "user.role_changed", "profile", id, `Role changed to ${role}`);
    revalidatePath("/admin/users");
    revalidatePath("/admin/settings");
    return { ok: true, message: "Staff role updated." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not update the staff role.",
    };
  }
}

export async function toggleStaffActiveAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await staffUser("users.edit");
  if (!user) return { ok: false, message: "You do not have permission to change account status." };

  const id = String(formData.get("staffId") ?? "");
  const active = formData.get("isActive") === "true";
  if (!id) return { ok: false, message: "Staff member not found." };
  if (id === user.id && !active) {
    return { ok: false, message: "You cannot deactivate your own account." };
  }

  try {
    await backend.setStaffActive(id, active);
    await backend.logAudit(
      user.id,
      active ? "user.activated" : "user.deactivated",
      "profile",
      id,
      active ? "Account activated" : "Account deactivated",
    );
    revalidatePath("/admin/users");
    revalidatePath("/admin/settings");
    return { ok: true, message: active ? "Staff account activated." : "Staff account deactivated." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not update the staff account.",
    };
  }
}
