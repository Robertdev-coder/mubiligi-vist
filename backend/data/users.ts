import "server-only";
import bcrypt from "bcryptjs";
import { newId, row, rows, run } from "@/backend/db/sqlite";
import { nowIso } from "@/shared/utils";
import type { ApprovalStatus, Profile, Role, UserStatus } from "@/shared/types";
import { mapProfile, type RawRow } from "./mappers";

const SELECT = "SELECT * FROM profiles";

export async function listUsers(): Promise<Profile[]> {
  return rows<RawRow>(`${SELECT} ORDER BY
    CASE role WHEN 'admin' THEN 0 WHEN 'dean' THEN 1 ELSE 2 END,
    full_name ASC`).map(mapProfile);
}

export async function listApprovedUsers(): Promise<Profile[]> {
  return rows<RawRow>(
    `${SELECT} WHERE approval_status = 'approved' AND status = 'active' ORDER BY full_name ASC`,
  ).map(mapProfile);
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const raw = row<RawRow>(`${SELECT} WHERE id = ?`, id);
  return raw ? mapProfile(raw) : null;
}

export async function getProfileByEmail(email: string): Promise<Profile | null> {
  const raw = row<RawRow>(`${SELECT} WHERE lower(email) = lower(?)`, email);
  return raw ? mapProfile(raw) : null;
}

export async function getPasswordHash(id: string): Promise<string | null> {
  const raw = row<{ password_hash: string | null }>(
    "SELECT password_hash FROM profiles WHERE id = ?",
    id,
  );
  return raw?.password_hash ?? null;
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<{ profile: Profile } | { error: string }> {
  const raw = row<RawRow>(`${SELECT} WHERE lower(email) = lower(?)`, email.trim());
  if (!raw) return { error: "No account exists for that email address." };

  const profile = mapProfile(raw);
  const hash = raw.password_hash ? String(raw.password_hash) : null;
  if (!hash || !bcrypt.compareSync(password, hash)) {
    return { error: "The password you entered is incorrect." };
  }
  if (profile.approval_status === "pending") {
    return { error: "Your account is awaiting approval by an administrator." };
  }
  if (profile.approval_status === "rejected") {
    return { error: "Your account request was declined. Contact the school administrator." };
  }
  if (profile.status !== "active" || !profile.is_active) {
    return { error: "This account has been deactivated. Contact the administrator." };
  }

  run("UPDATE profiles SET last_login_at = ?, updated_at = ? WHERE id = ?", nowIso(), nowIso(), profile.id);
  return { profile };
}

export async function markLogin(id: string): Promise<void> {
  const now = nowIso();
  run("UPDATE profiles SET last_login_at = ?, updated_at = ? WHERE id = ?", now, now, id);
}

export interface SignupInput {
  full_name: string;
  email: string;
  phone_number: string;
  password: string;
}

/**
 * Public signup always creates a Prefect account that is inactive until an
 * administrator approves it. Elevated roles can never be self-assigned.
 */
export async function signupPrefect(input: SignupInput): Promise<Profile> {
  const existing = await getProfileByEmail(input.email);
  if (existing) throw new Error("An account already exists for that email address.");

  const id = newId();
  const now = nowIso();
  run(
    `INSERT INTO profiles (id, full_name, email, phone_number, role, status, approval_status, is_active, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'prefect', 'inactive', 'pending', 0, ?, ?, ?)`,
    id,
    input.full_name.trim(),
    input.email.trim().toLowerCase(),
    input.phone_number.trim(),
    bcrypt.hashSync(input.password, 10),
    now,
    now,
  );
  return (await getProfileById(id)) as Profile;
}

export interface CreateUserInput extends SignupInput {
  role: Role;
  approval_status?: ApprovalStatus;
}

export async function createUser(input: CreateUserInput, _actorId: string): Promise<Profile> {
  const existing = await getProfileByEmail(input.email);
  if (existing) throw new Error("An account already exists for that email address.");

  const id = newId();
  const now = nowIso();
  run(
    `INSERT INTO profiles (id, full_name, email, phone_number, role, status, approval_status, is_active, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'active', ?, 1, ?, ?, ?)`,
    id,
    input.full_name.trim(),
    input.email.trim().toLowerCase(),
    input.phone_number.trim(),
    input.role,
    input.approval_status ?? "approved",
    bcrypt.hashSync(input.password, 10),
    now,
    now,
  );
  return (await getProfileById(id)) as Profile;
}

export async function updateOwnProfile(
  id: string,
  input: { full_name: string; phone_number: string },
): Promise<void> {
  run(
    "UPDATE profiles SET full_name = ?, phone_number = ?, updated_at = ? WHERE id = ?",
    input.full_name.trim(),
    input.phone_number.trim(),
    nowIso(),
    id,
  );
}

export async function updateUserRole(id: string, role: Role): Promise<void> {
  const target = await getProfileById(id);
  if (!target) throw new Error("User not found.");
  if (target.role === "admin" && role !== "admin" && (await activeAdminCount()) <= 1) {
    throw new Error("At least one active administrator is required.");
  }
  run("UPDATE profiles SET role = ?, updated_at = ? WHERE id = ?", role, nowIso(), id);
}

export async function setUserStatus(id: string, status: UserStatus): Promise<void> {
  const target = await getProfileById(id);
  if (!target) throw new Error("User not found.");
  if (target.role === "admin" && status !== "active" && (await activeAdminCount()) <= 1) {
    throw new Error("At least one active administrator is required.");
  }
  run(
    "UPDATE profiles SET status = ?, is_active = ?, updated_at = ? WHERE id = ?",
    status,
    status === "active" ? 1 : 0,
    nowIso(),
    id,
  );
}

export async function setApprovalStatus(id: string, approval: ApprovalStatus): Promise<void> {
  const target = await getProfileById(id);
  if (!target) throw new Error("User not found.");
  const active = approval === "approved";
  run(
    "UPDATE profiles SET approval_status = ?, status = ?, is_active = ?, updated_at = ? WHERE id = ?",
    approval,
    active ? "active" : "inactive",
    active ? 1 : 0,
    nowIso(),
    id,
  );
}

export async function resetPassword(id: string, password: string): Promise<void> {
  const target = await getProfileById(id);
  if (!target) throw new Error("User not found.");
  run(
    "UPDATE profiles SET password_hash = ?, updated_at = ? WHERE id = ?",
    bcrypt.hashSync(password, 10),
    nowIso(),
    id,
  );
}

export async function changeOwnPassword(
  id: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const hash = await getPasswordHash(id);
  if (!hash || !bcrypt.compareSync(currentPassword, hash)) {
    throw new Error("Your current password is incorrect.");
  }
  await resetPassword(id, newPassword);
}

export async function deleteUser(id: string): Promise<void> {
  const target = await getProfileById(id);
  if (!target) throw new Error("User not found.");
  if (target.role === "admin" && (await activeAdminCount()) <= 1) {
    throw new Error("The last administrator account cannot be deleted.");
  }
  run("DELETE FROM profiles WHERE id = ?", id);
}

export async function activeAdminCount(): Promise<number> {
  const result = row<{ count: number }>(
    "SELECT COUNT(*) AS count FROM profiles WHERE role = 'admin' AND is_active = 1 AND approval_status = 'approved'",
  );
  return Number(result?.count ?? 0);
}

export async function pendingApprovalCount(): Promise<number> {
  const result = row<{ count: number }>(
    "SELECT COUNT(*) AS count FROM profiles WHERE approval_status = 'pending'",
  );
  return Number(result?.count ?? 0);
}
