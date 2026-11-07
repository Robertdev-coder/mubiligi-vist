"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  firstZodError,
  loginSchema,
  prefectSignupSchema,
  type ActionState,
} from "@/shared/validation/schemas";
import { createLocalSession, dashboardFor, destroySession } from "@/backend/auth/session";
import { isSupabaseEnabled, createSupabaseServerClient } from "@/backend/supabase/server";
import * as local from "@/backend/data/local";
import { backend } from "@/backend/data";

const signupAttempts = new Map<string, { count: number; resetAt: number }>();

async function signupAllowed(): Promise<boolean> {
  const headerStore = await headers();
  const key =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const entry = signupAttempts.get(key);
  if (!entry || entry.resetAt <= now) {
    signupAttempts.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count += 1;
  return true;
}

export async function signupPrefectAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  if (!(await signupAllowed())) {
    return { ok: false, message: "Too many account requests. Try again in an hour." };
  }
  const parsed = prefectSignupSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone_number: formData.get("phone_number"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password"),
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
    await backend.signupPrefect(parsed.data);
    await backend.logAudit(
      null,
      "user.signup_requested",
      "profile",
      null,
      `Prefect account request for ${parsed.data.email}`,
    );
    return {
      ok: true,
      message: "Account request submitted. An administrator must activate it before you can sign in.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not submit the account request.",
    };
  }
}

export async function loginAction(
  _prevState: ActionState | undefined,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
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

  const { email, password } = parsed.data;

  try {
    if (isSupabaseEnabled()) {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        return { ok: false, message: "Invalid email or password. Please try again." };
      }
      const profile = await backend.getProfileById(data.user.id);
      if (!profile || !profile.is_active || profile.status !== "active" || profile.deleted_at) {
        await supabase.auth.signOut();
        return {
          ok: false,
          message: "This staff account is not active. Contact the school administrator.",
        };
      }
      await backend.markLogin(profile.id);
      redirect(dashboardFor(profile.role_key));
    }

    const user = await local.verifyLocalCredentials(email, password);
    if (!user) {
      return { ok: false, message: "Invalid email or password. Please try again." };
    }
    await createLocalSession(user);
    redirect(dashboardFor(user.role));
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
    if (typeof error === "object" && error !== null && "digest" in error) throw error;
    return {
      ok: false,
      message: "We could not sign you in right now. Please try again in a moment.",
    };
  }
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
