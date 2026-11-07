"use server";

import { revalidatePath } from "next/cache";
import { backend } from "@/backend/data";
import { getSessionUser } from "@/backend/auth/session";
import type { PermissionKey } from "@/shared/types";
import type { ActionState } from "@/shared/validation/schemas";

async function recordUser(permission: PermissionKey) {
  const user = await getSessionUser();
  if (!user || !user.permissions.includes(permission)) return null;
  return user;
}

function revalidateRecords() {
  revalidatePath("/admin");
  revalidatePath("/admin/registrations");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/archive");
  revalidatePath("/dean");
  revalidatePath("/dean/registrations");
  revalidatePath("/dean/attendance");
  revalidatePath("/dean/reports");
}

export async function archiveRegistrationAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await recordUser("records.archive");
  if (!user) return { ok: false, message: "You do not have permission to archive records." };

  const id = String(formData.get("registrationId") ?? "");
  if (!id) return { ok: false, message: "Registration not found." };

  try {
    await backend.archiveRegistration(id, user.id);
    revalidateRecords();
    return { ok: true, message: "Registration archived. It is no longer counted in reports." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not archive the registration.",
    };
  }
}

export async function bulkArchiveAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await recordUser("records.archive");
  if (!user) return { ok: false, message: "You do not have permission to archive records." };

  const ids = formData.getAll("registrationId").map(String).filter(Boolean);
  if (ids.length === 0) return { ok: false, message: "Select at least one record." };

  try {
    const count = await backend.bulkArchiveRegistrations(ids, user.id);
    revalidateRecords();
    return { ok: true, message: `${count} record(s) archived.` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not archive the selected records.",
    };
  }
}

export async function restoreArchivedAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await recordUser("records.restore");
  if (!user) return { ok: false, message: "You do not have permission to restore records." };

  const id = String(formData.get("archiveId") ?? "");
  if (!id) return { ok: false, message: "Archived record not found." };

  try {
    await backend.restoreArchivedRecord(id, user.id);
    revalidateRecords();
    return { ok: true, message: "Record restored successfully." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not restore the record.",
    };
  }
}

export async function purgeArchivedAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await recordUser("records.delete");
  if (!user) return { ok: false, message: "You do not have permission to delete records permanently." };

  const id = String(formData.get("archiveId") ?? "");
  if (!id) return { ok: false, message: "Archived record not found." };

  try {
    await backend.deleteArchivedRecord(id, user.id);
    revalidateRecords();
    return { ok: true, message: "Archived record permanently deleted." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not delete the record.",
    };
  }
}
