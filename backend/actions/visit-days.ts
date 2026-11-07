"use server";

import { revalidatePath } from "next/cache";
import { backend } from "@/backend/data";
import { getSessionUser } from "@/backend/auth/session";
import { firstZodError, visitDaySchema, type ActionState } from "@/shared/validation/schemas";

async function adminUser() {
  const user = await getSessionUser();
  if (!user || !user.permissions.includes("settings.manage")) return null;
  return user;
}

function revalidateVisitDays() {
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/register");
  revalidatePath("/");
}

function parse(formData: FormData) {
  return visitDaySchema.safeParse({
    title: formData.get("title"),
    visit_date: formData.get("visit_date"),
    registration_open: formData.get("registration_open"),
    registration_close: formData.get("registration_close"),
    is_active:
      formData.get("is_active") === "on" ||
      formData.get("is_active") === "true" ||
      formData.get("is_active") === "1",
    instructions: formData.get("instructions") ?? "",
  });
}

export async function createVisitDayAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await adminUser();
  if (!user) return { ok: false, message: "You do not have permission to manage visit days." };

  const parsed = parse(formData);
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
    const day = await backend.createVisitDay(parsed.data);
    await backend.logAudit(user.id, "visit_day.created", "visit_day", day.id, `Created ${day.title}`);
    revalidateVisitDays();
    return { ok: true, message: "Visit day created successfully." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not create the visit day.",
    };
  }
}

export async function updateVisitDayAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await adminUser();
  if (!user) return { ok: false, message: "You do not have permission to manage visit days." };
  const id = String(formData.get("visitDayId") ?? "");
  if (!id) return { ok: false, message: "Visit day not found." };

  const parsed = parse(formData);
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
    const day = await backend.updateVisitDay(id, parsed.data);
    await backend.logAudit(user.id, "visit_day.updated", "visit_day", id, `Updated ${day.title}`);
    revalidateVisitDays();
    return { ok: true, message: "Visit day updated successfully." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not update the visit day.",
    };
  }
}

export async function toggleVisitDayAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const user = await adminUser();
  if (!user) return { ok: false, message: "You do not have permission to manage visit days." };
  const id = String(formData.get("visitDayId") ?? "");
  const active = formData.get("isActive") === "true";
  if (!id) return { ok: false, message: "Visit day not found." };

  try {
    await backend.toggleVisitDay(id, active);
    await backend.logAudit(
      user.id,
      active ? "visit_day.activated" : "visit_day.deactivated",
      "visit_day",
      id,
      active ? "Registration opened" : "Registration closed",
    );
    revalidateVisitDays();
    return { ok: true, message: active ? "Registration opened." : "Registration closed." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not update the visit day.",
    };
  }
}
