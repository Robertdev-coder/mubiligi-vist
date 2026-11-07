"use server";

import { revalidatePath } from "next/cache";
import { backend } from "@/backend/data";
import { getSessionUser } from "@/backend/auth/session";
import {
  firstZodError,
  registrationSchema,
  registrationUpdateSchema,
  type ActionState,
} from "@/shared/validation/schemas";
import type { PermissionKey, RegistrationStatus } from "@/shared/types";

function revalidateStaff() {
  revalidatePath("/admin");
  revalidatePath("/admin/registrations");
  revalidatePath("/admin/attendance");
  revalidatePath("/admin/reports");
  revalidatePath("/dean");
  revalidatePath("/dean/registrations");
  revalidatePath("/dean/attendance");
  revalidatePath("/dean/reports");
}

async function allowed(permission: PermissionKey) {
  const user = await getSessionUser();
  if (!user) return { user: null, error: "Your session has expired. Please sign in again." };
  if (!user.permissions.includes(permission)) {
    return { user: null, error: "You do not have permission to perform this action." };
  }
  return { user, error: null };
}

export async function updateRegistrationAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const access = await allowed("registrations.edit");
  if (!access.user) return { ok: false, message: access.error as string };

  const id = String(formData.get("registrationId") ?? "");
  if (!id) return { ok: false, message: "Registration not found." };

  const parsed = registrationUpdateSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    national_id: formData.get("national_id") ?? "",
    relationship: formData.get("relationship"),
    student_full_name: formData.get("student_full_name"),
    registration_number: formData.get("registration_number"),
    trade: formData.get("trade"),
    level: formData.get("level"),
    class_name: formData.get("class_name"),
    purpose: formData.get("purpose"),
    message: formData.get("message") ?? "",
    status: formData.get("status"),
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
    await backend.updateRegistration(id, parsed.data, access.user.id);
    revalidateStaff();
    return { ok: true, message: "Registration updated successfully." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not update the registration.",
    };
  }
}

export async function updateStatusAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const access = await allowed("registrations.edit");
  if (!access.user) return { ok: false, message: access.error as string };

  const id = String(formData.get("registrationId") ?? "");
  const status = String(formData.get("status") ?? "") as RegistrationStatus;
  if (!id || !["pending", "confirmed", "cancelled", "completed"].includes(status)) {
    return { ok: false, message: "Invalid status update." };
  }

  try {
    await backend.updateRegistrationStatus(id, status, access.user.id);
    revalidateStaff();
    return { ok: true, message: `Registration marked as ${status}.` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not update the status.",
    };
  }
}

export async function deleteRegistrationAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const access = await allowed("registrations.delete");
  if (!access.user) return { ok: false, message: access.error as string };

  const id = String(formData.get("registrationId") ?? "");
  if (!id) return { ok: false, message: "Registration not found." };

  try {
    await backend.deleteRegistration(id, access.user.id);
    revalidateStaff();
    return { ok: true, message: "Registration deleted permanently." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not delete the registration.",
    };
  }
}

export async function createStaffRegistrationAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const access = await allowed("registrations.create");
  if (!access.user) return { ok: false, message: access.error as string };

  const parsed = registrationSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    nationalId: formData.get("nationalId") ?? "",
    relationship: formData.get("relationship"),
    studentFullName: formData.get("studentFullName"),
    studentRegistrationNumber: formData.get("studentRegistrationNumber"),
    trade: formData.get("trade"),
    level: formData.get("level"),
    className: formData.get("className"),
    visitDayId: formData.get("visitDayId"),
    purpose: formData.get("purpose"),
    message: formData.get("message") ?? "",
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
    const { id, reference } = await backend.createRegistration(parsed.data, {
      actorId: access.user.id,
      bypassWindow: true,
      status: "confirmed",
      markArrived: true,
    });
    revalidateStaff();
    return {
      ok: true,
      message: "Registration created successfully.",
      data: { id, reference },
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not create the registration.",
    };
  }
}
