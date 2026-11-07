"use server";

import type { ActionState } from "@/shared/validation/schemas";

export async function submitRegistrationAction(): Promise<ActionState> {
  return {
    ok: false,
    message: "Parent self-registration is not available. School staff register parents on arrival.",
  };
}

export async function lookupRegistrationAction(): Promise<ActionState> {
  return {
    ok: false,
    message: "Attendance records are available to authorized school staff only.",
  };
}
