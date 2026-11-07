"use server";

import { revalidatePath } from "next/cache";
import { backend } from "@/backend/data";
import { getSessionUser } from "@/backend/auth/session";
import type { PermissionKey } from "@/shared/types";
import type { ActionState } from "@/shared/validation/schemas";

function revalidateAttendance() {
  revalidatePath("/admin");
  revalidatePath("/admin/registrations");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/reports");
  revalidatePath("/dean");
  revalidatePath("/dean/registrations");
  revalidatePath("/dean/attendance");
  revalidatePath("/dean/reports");
}

async function run(
  formData: FormData,
  permission: PermissionKey,
  operation: (id: string, actorId: string) => Promise<void>,
  successMessage: string,
): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Your session has expired. Please sign in again." };
  if (!user.permissions.includes(permission)) {
    return { ok: false, message: "You do not have permission to record attendance." };
  }
  const id = String(formData.get("registrationId") ?? "");
  if (!id) return { ok: false, message: "Registration not found." };

  try {
    await operation(id, user.id);
    revalidateAttendance();
    return { ok: true, message: successMessage };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not record attendance.",
    };
  }
}

export async function recordArrivalAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return run(formData, "attendance.create", backend.recordArrival, "Visitor arrival recorded.");
}

export async function recordDepartureAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return run(formData, "attendance.edit", backend.recordDeparture, "Visitor departure recorded.");
}

export async function markNoShowAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return run(formData, "attendance.edit", backend.markNoShow, "Visitor marked as no-show.");
}

export async function completeVisitAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  return run(formData, "attendance.edit", backend.completeVisit, "Visit marked as completed.");
}
