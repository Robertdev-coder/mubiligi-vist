"use server";

import { headers } from "next/headers";
import type { ActionState } from "@/shared/validation/schemas";
import { lookupSchema, firstZodError } from "@/shared/validation/schemas";
import { backend } from "@/backend/data";
import { ATTENDANCE_STATUS_LABEL, REGISTRATION_STATUS_LABEL } from "@/shared/constants";
import { formatDateKigali, formatTimeKigali } from "@/shared/utils";

const lookupAttempts = new Map<string, { count: number; resetAt: number }>();

async function lookupAllowed(): Promise<boolean> {
  const headerStore = await headers();
  const key =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const entry = lookupAttempts.get(key);
  if (!entry || entry.resetAt <= now) {
    lookupAttempts.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count += 1;
  return true;
}

export async function lookupRegistrationAction(
  _previous: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const parsed = lookupSchema.safeParse({
    reference: formData.get("reference"),
    phone: formData.get("phone"),
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
  if (!(await lookupAllowed())) {
    return {
      ok: false,
      message: "Too many lookup attempts. Please try again later.",
    };
  }

  try {
    const registration = await backend.findRegistrationForLookup(
      parsed.data.reference,
      parsed.data.phone,
    );
    if (!registration) {
      return { ok: false, message: "No registration matched that reference and phone number." };
    }

    return {
      ok: true,
      message: "Registration found.",
      data: {
        reference: registration.reference_code,
        visitorName: registration.visitor.full_name,
        studentName: registration.student.full_name,
        trade: registration.student.trade,
        level: registration.student.level,
        className: registration.student.class_name,
        visitDateLabel: formatDateKigali(registration.visit_day.visit_date, "EEEE, dd MMMM yyyy"),
        status: registration.status,
        statusLabel: REGISTRATION_STATUS_LABEL[registration.status],
        attendanceStatus: registration.attendance?.status ?? "expected",
        attendanceLabel:
          ATTENDANCE_STATUS_LABEL[registration.attendance?.status ?? "expected"],
        arrivalTime: registration.attendance?.arrival_time
          ? formatTimeKigali(registration.attendance.arrival_time)
          : null,
        departureTime: registration.attendance?.departure_time
          ? formatTimeKigali(registration.attendance.departure_time)
          : null,
        submittedAt: formatDateKigali(registration.created_at, "dd MMM yyyy, HH:mm"),
      },
    };
  } catch (error) {
    console.error("Could not check the registration.", error);
    return {
      ok: false,
      message: "Could not check the registration right now. Please try again.",
    };
  }
}
