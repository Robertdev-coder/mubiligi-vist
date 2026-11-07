import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import type { PermissionKey, Profile, Role, SessionUser } from "@/shared/types";
import { isSupabaseEnabled, createSupabaseServerClient } from "@/backend/supabase/server";
import { backend } from "@/backend/data";
import { navItemsFor, workspaceFor } from "@/shared/constants";

export const SESSION_COOKIE = "mvd_session";
const SESSION_MAX_AGE = 60 * 60 * 12;

function sessionSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be configured in production.");
  }
  if (secret && secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }
  return new TextEncoder().encode(
    secret ?? "mubiligi-visit-day-development-secret-change-me-in-production-0123456789",
  );
}

export async function createLocalSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    sub: user.id,
    name: user.full_name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(sessionSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  if (isSupabaseEnabled()) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // ignore network errors during sign out
    }
  }
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

async function buildSession(profile: Profile | null): Promise<SessionUser | null> {
  if (!profile || profile.deleted_at || profile.status !== "active" || !profile.is_active) {
    return null;
  }
  const [permissions, roleName] = await Promise.all([
    backend.getEffectivePermissionsForProfile(profile),
    backend.roleNameFor(profile.role_key),
  ]);
  return {
    id: profile.id,
    full_name: profile.full_name,
    email: profile.email,
    role: profile.role_key,
    role_name: roleName,
    permissions,
    status: profile.status,
  };
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (isSupabaseEnabled()) {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      return buildSession(await backend.getProfileById(user.id));
    } catch {
      return null;
    }
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, sessionSecret());
    const id = payload.sub;
    if (!id) return null;
    return buildSession(await backend.getProfileById(id));
  } catch {
    return null;
  }
});

export function dashboardFor(role: Role): string {
  return role === "dean" ? "/dean" : "/admin";
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect(dashboardFor(user.role));
  return user;
}

export async function requirePermission(permission: PermissionKey | PermissionKey[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const required = Array.isArray(permission) ? permission : [permission];
  if (!required.some((key) => user.permissions.includes(key))) {
    const fallback =
      navItemsFor(user.permissions, user.role)[0]?.href ??
      (user.permissions.includes("registrations.create")
        ? `${workspaceFor(user.role)}/registrations/new`
        : null);
    if (fallback) redirect(fallback);
    notFound();
  }
  return user;
}
