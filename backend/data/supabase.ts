/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { subDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { createSupabaseAdminClient } from "@/backend/supabase/server";
import {
  KIGALI_TZ,
  formatDateKigali,
  generateReferenceCode,
  normalizePhone,
  nowIso,
  todayKigali,
} from "@/shared/utils";
import type {
  ArchivedRecord,
  AuditLog,
  AuditStatus,
  AttendanceStatus,
  DashboardData,
  DashboardStats,
  EmailFormat,
  EmailSettings,
  Notification,
  Paginated,
  PermissionKey,
  Profile,
  RegistrationFilters,
  RegistrationRow,
  RegistrationStatus,
  ReportFilters,
  ReportHistory,
  Role,
  RoleRecord,
  SessionUser,
  TrendPoint,
  UserPermissionOverride,
  UserStatus,
  VisitDay,
} from "@/shared/types";
import type {
  PrefectSignupInput,
  RegistrationInput,
  RegistrationUpdateInput,
  StaffInput,
  VisitDayInput,
} from "@/shared/validation/schemas";
import { DEFAULT_ROLE_PERMISSIONS } from "@/shared/constants";
import { computePermissions } from "@/backend/auth/permissions";

const SELECT = `*, visitor:visitors!inner(*), student:students!inner(*), visit_day:visit_days!inner(*), attendance(*)`;

function admin() {
  return createSupabaseAdminClient();
}

function normalizeRow(raw: any): RegistrationRow {
  const attendance = Array.isArray(raw.attendance) ? (raw.attendance[0] ?? null) : (raw.attendance ?? null);
  return {
    ...raw,
    attendance,
    recorded_by_name: null,
  } as RegistrationRow;
}

function normalizeProfile(raw: any): Profile {
  const roleKey = raw.role_key ?? raw.role;
  return {
    ...raw,
    role: roleKey,
    role_key: roleKey,
    status: raw.status ?? (raw.is_active ? "active" : "disabled"),
    is_active: Boolean(raw.is_active) && (raw.status ?? "active") === "active",
    last_login_at: raw.last_login_at ?? null,
    deleted_at: raw.deleted_at ?? null,
  } as Profile;
}

async function fetchAllForDate(date: string): Promise<RegistrationRow[]> {
  const { data, error } = await admin()
    .from("registrations")
    .select(SELECT)
    .eq("visit_days.visit_date", date)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeRow);
}

/* ------------------------------------------------------------------ */
/* Visit days                                                          */
/* ------------------------------------------------------------------ */

export async function listVisitDays(): Promise<VisitDay[]> {
  const { data, error } = await admin().from("visit_days").select("*").order("visit_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as VisitDay[];
}

export async function getActiveVisitDays(): Promise<VisitDay[]> {
  const now = nowIso();
  const { data, error } = await admin()
    .from("visit_days")
    .select("*")
    .eq("is_active", true)
    .lte("registration_open", now)
    .gte("registration_close", now)
    .order("visit_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as VisitDay[];
}

export async function getVisitDay(id: string): Promise<VisitDay | null> {
  const { data, error } = await admin().from("visit_days").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as VisitDay) ?? null;
}

export async function createVisitDay(input: VisitDayInput): Promise<VisitDay> {
  const { data, error } = await admin()
    .from("visit_days")
    .insert({
      title: input.title,
      visit_date: input.visit_date,
      registration_open: fromZonedTime(input.registration_open, KIGALI_TZ).toISOString(),
      registration_close: fromZonedTime(input.registration_close, KIGALI_TZ).toISOString(),
      is_active: input.is_active,
      instructions: input.instructions || null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as VisitDay;
}

export async function updateVisitDay(id: string, input: VisitDayInput): Promise<VisitDay> {
  const { data, error } = await admin()
    .from("visit_days")
    .update({
      title: input.title,
      visit_date: input.visit_date,
      registration_open: fromZonedTime(input.registration_open, KIGALI_TZ).toISOString(),
      registration_close: fromZonedTime(input.registration_close, KIGALI_TZ).toISOString(),
      is_active: input.is_active,
      instructions: input.instructions || null,
      updated_at: nowIso(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as VisitDay;
}

export async function toggleVisitDay(id: string, isActive: boolean): Promise<void> {
  const { error } = await admin()
    .from("visit_days")
    .update({ is_active: isActive, updated_at: nowIso() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ */
/* Registrations                                                       */
/* ------------------------------------------------------------------ */

async function upsertVisitor(input: RegistrationInput): Promise<string> {
  const client = admin();
  const phone = normalizePhone(input.phone);
  const { data: existing } = await client
    .from("visitors")
    .select("id")
    .eq("phone", phone)
    .ilike("full_name", input.fullName)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await client
      .from("visitors")
      .update({
        email: input.email || null,
        national_id: input.nationalId || null,
        relationship: input.relationship,
        updated_at: nowIso(),
      })
      .eq("id", existing.id);
    return existing.id as string;
  }

  const { data, error } = await client
    .from("visitors")
    .insert({
      full_name: input.fullName,
      phone,
      email: input.email || null,
      national_id: input.nationalId || null,
      relationship: input.relationship,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

async function upsertStudent(input: RegistrationInput): Promise<string> {
  const client = admin();
  const { data: existing } = await client
    .from("students")
    .select("id")
    .ilike("registration_number", input.studentRegistrationNumber)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    await client
      .from("students")
      .update({
        full_name: input.studentFullName,
        trade: input.trade,
        level: input.level,
        class_name: input.className,
        updated_at: nowIso(),
      })
      .eq("id", existing.id);
    return existing.id as string;
  }

  const { data, error } = await client
    .from("students")
    .insert({
      registration_number: input.studentRegistrationNumber.toUpperCase(),
      full_name: input.studentFullName,
      trade: input.trade,
      level: input.level,
      class_name: input.className,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

async function uniqueReference(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const reference = generateReferenceCode();
    const { data } = await admin()
      .from("registrations")
      .select("id")
      .eq("reference_code", reference)
      .maybeSingle();
    if (!data) return reference;
  }
  throw new Error("Could not generate a unique registration reference.");
}

async function notifyDeans(title: string, message: string, registrationId: string | null) {
  const client = admin();
  const { data: deans } = await client
    .from("profiles")
    .select("id")
    .eq("role_key", "dean")
    .eq("status", "active")
    .eq("is_active", true);
  const rows =
    deans && deans.length > 0
      ? deans.map((dean: any) => ({
          title,
          message,
          registration_id: registrationId,
          recipient_id: dean.id,
        }))
      : [{ title, message, registration_id: registrationId, recipient_id: null }];
  await client.from("notifications").insert(rows);
}

export async function createRegistration(
  input: RegistrationInput,
  options: {
    actorId?: string | null;
    status?: RegistrationStatus;
    bypassWindow?: boolean;
    markArrived?: boolean;
    arrivalAt?: string;
    arrivalTimezone?: string;
    arrivalSource?: "server" | "device";
    departureAt?: string;
    departureTimezone?: string;
    departureSource?: "server" | "device";
    departureOperationId?: string;
    syncedAt?: string;
    syncOperationId?: string;
  } = {},
): Promise<{ id: string; reference: string }> {
  const client = admin();
  if (options.syncOperationId) {
    const { data: existing, error: existingError } = await client
      .from("registrations")
      .select("id, reference_code")
      .eq("sync_operation_id", options.syncOperationId)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (existing) return { id: existing.id as string, reference: existing.reference_code as string };
  }

  const visitDay = await getVisitDay(input.visitDayId);
  if (!visitDay) throw new Error("The selected visit day could not be found.");

  if (!visitDay.is_active) throw new Error("This Visit Day session is closed.");
  if (!options.bypassWindow) {
    const now = Date.now();
    if (
      new Date(visitDay.registration_open).getTime() > now ||
      new Date(visitDay.registration_close).getTime() < now
    ) {
      throw new Error("Registration for this visit day is not currently open.");
    }
  }

  const phone = normalizePhone(input.phone);
  const since = subDays(new Date(), 1).toISOString();
  const { data: visitors } = await client.from("visitors").select("id").eq("phone", phone);
  const visitorIds = (visitors ?? []).map((v: any) => v.id);
  const { data: students } = await client
    .from("students")
    .select("id")
    .ilike("registration_number", input.studentRegistrationNumber);
  const studentIds = (students ?? []).map((s: any) => s.id);

  if (visitorIds.length && studentIds.length) {
    const { data: duplicate } = await client
      .from("registrations")
      .select("id, reference_code")
      .in("visitor_id", visitorIds)
      .in("student_id", studentIds)
      .eq("visit_day_id", input.visitDayId)
      .neq("status", "cancelled")
      .gte("created_at", since)
      .limit(1)
      .maybeSingle();
    if (duplicate) {
      throw new Error(
        `A registration for this student already exists for this visit day (ref ${duplicate.reference_code}). Use "Check My Registration" to view it.`,
      );
    }
  }

  const visitorId = await upsertVisitor(input);
  const studentId = await upsertStudent(input);
  const reference = await uniqueReference();

  const { data: registration, error } = await client
    .from("registrations")
    .insert({
      reference_code: reference,
      visitor_id: visitorId,
      student_id: studentId,
      visit_day_id: input.visitDayId,
      purpose: input.purpose,
      message: input.message || null,
      status: options.departureAt ? "completed" : options.status ?? "pending",
      sync_operation_id: options.syncOperationId ?? null,
    })
    .select("id")
    .single();
  if (error) {
    if (options.syncOperationId) {
      const { data: existing } = await client
        .from("registrations")
        .select("id, reference_code")
        .eq("sync_operation_id", options.syncOperationId)
        .maybeSingle();
      if (existing) return { id: existing.id as string, reference: existing.reference_code as string };
    }
    throw new Error(error.message);
  }

  const arrivalTime = options.markArrived ? options.arrivalAt ?? nowIso() : null;
  const departureTime = options.departureAt ?? null;
  const { error: attendanceError } = await client.from("attendance").insert({
    registration_id: registration.id,
    arrival_time: arrivalTime,
    arrival_device_timezone: options.arrivalTimezone ?? null,
    arrival_source: options.arrivalSource ?? "server",
    departure_time: departureTime,
    departure_device_timezone: departureTime ? options.departureTimezone ?? null : null,
    departure_source: departureTime ? options.departureSource ?? "server" : null,
    sync_confirmed_at: options.syncedAt ?? null,
    status: departureTime ? "departed" : arrivalTime ? "on_campus" : "expected",
    recorded_by: arrivalTime ? options.actorId ?? null : null,
    departure_recorded_by: departureTime ? options.actorId ?? null : null,
    departure_operation_id: departureTime ? options.departureOperationId ?? null : null,
  });
  if (attendanceError) throw new Error(attendanceError.message);

  await notifyDeans(
    "New visit registration received",
    `${input.fullName} registered to visit ${input.studentFullName} (${input.studentRegistrationNumber}) on ${formatDateKigali(
      visitDay.visit_date,
      "dd MMM yyyy",
    )}. Reference: ${reference}. Submitted ${formatDateKigali(new Date(), "dd MMM yyyy, HH:mm")}.`,
    registration.id,
  );

  await logAudit(
    options.actorId ?? null,
    options.actorId ? "registration.created_by_staff" : "registration.created",
    "registration",
    registration.id,
    `${input.fullName} → ${input.studentFullName} (${reference})`,
  );
  if (arrivalTime && options.actorId) {
    await logAudit(
      options.actorId,
      "attendance.arrival",
      "registration",
      registration.id as string,
      `Arrival recorded for ${reference}`,
    );
  }
  if (departureTime && options.actorId) {
    await logAudit(
      options.actorId,
      "attendance.departure",
      "registration",
      registration.id as string,
      `Offline departure synchronized for ${reference}`,
    );
  }

  return { id: registration.id as string, reference };
}

export async function getRegistrationById(id: string): Promise<RegistrationRow | null> {
  const { data, error } = await admin().from("registrations").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeRow(data) : null;
}

export async function getRegistrationByReference(reference: string): Promise<RegistrationRow | null> {
  const { data, error } = await admin()
    .from("registrations")
    .select(SELECT)
    .eq("reference_code", reference.toUpperCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeRow(data) : null;
}

export async function getRegistrationBySyncOperationId(
  syncOperationId: string,
): Promise<{ id: string; reference: string } | null> {
  const { data, error } = await admin()
    .from("registrations")
    .select("id, reference_code")
    .eq("sync_operation_id", syncOperationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? { id: data.id as string, reference: data.reference_code as string } : null;
}

export async function findRegistrationForLookup(
  reference: string,
  phone: string,
): Promise<RegistrationRow | null> {
  const row = await getRegistrationByReference(reference);
  if (!row) return null;
  if (row.visitor.phone !== normalizePhone(phone)) return null;
  return row;
}

export async function listRegistrations(
  filters: RegistrationFilters = {},
): Promise<Paginated<RegistrationRow>> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(500, Math.max(5, filters.pageSize ?? 10));

  let query = admin().from("registrations").select(SELECT);
  if (filters.visitDate) query = query.eq("visit_days.visit_date", filters.visitDate);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.trade) query = query.eq("students.trade", filters.trade);
  if (filters.level) query = query.eq("students.level", filters.level);
  if (filters.className) query = query.ilike("students.class_name", `%${filters.className}%`);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(2000);
  if (error) throw new Error(error.message);

  let rows = (data ?? []).map(normalizeRow);

  if (filters.search) {
    const term = filters.search.trim().toLowerCase();
    rows = rows.filter((r) =>
      [r.visitor.full_name, r.student.full_name, r.student.registration_number, r.reference_code, r.visitor.phone]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }
  if (filters.attendance) {
    rows = rows.filter((r) => (r.attendance?.status ?? "expected") === filters.attendance);
  }

  const direction = filters.direction === "asc" ? 1 : -1;
  const sort = filters.sort ?? "created_at";
  rows.sort((a, b) => {
    const pick = (r: RegistrationRow): string => {
      switch (sort) {
        case "visitor":
          return r.visitor.full_name;
        case "student":
          return r.student.full_name;
        case "visit_date":
          return r.visit_day.visit_date;
        case "status":
          return r.status;
        case "reference":
          return r.reference_code;
        case "class":
          return r.student.class_name;
        case "trade":
          return r.student.trade;
        case "arrival":
          return r.attendance?.arrival_time ?? "";
        default:
          return r.created_at;
      }
    };
    return pick(a).localeCompare(pick(b)) * direction;
  });

  const total = rows.length;
  const start = (page - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function updateRegistration(
  id: string,
  input: RegistrationUpdateInput,
  actorId: string,
): Promise<void> {
  const current = await getRegistrationById(id);
  if (!current) throw new Error("Registration not found.");
  const client = admin();
  await client
    .from("visitors")
    .update({
      full_name: input.full_name,
      phone: normalizePhone(input.phone),
      email: input.email || null,
      national_id: input.national_id || null,
      relationship: input.relationship,
      updated_at: nowIso(),
    })
    .eq("id", current.visitor_id);
  await client
    .from("students")
    .update({
      full_name: input.student_full_name,
      registration_number: input.registration_number.toUpperCase(),
      trade: input.trade,
      level: input.level,
      class_name: input.class_name,
      updated_at: nowIso(),
    })
    .eq("id", current.student_id);
  const { error } = await client
    .from("registrations")
    .update({
      purpose: input.purpose,
      message: input.message || null,
      status: input.status,
      updated_at: nowIso(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(actorId, "registration.updated", "registration", id, `Updated ${current.reference_code}`);
}

export async function updateRegistrationStatus(
  id: string,
  status: RegistrationStatus,
  actorId: string,
): Promise<void> {
  const current = await getRegistrationById(id);
  if (!current) throw new Error("Registration not found.");
  const client = admin();
  const { error } = await client
    .from("registrations")
    .update({ status, updated_at: nowIso() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  if (status === "cancelled" && !current.attendance?.arrival_time) {
    await client
      .from("attendance")
      .update({ status: "no_show", updated_at: nowIso() })
      .eq("registration_id", id);
  }
  await logAudit(
    actorId,
    "registration.status_changed",
    "registration",
    id,
    `${current.reference_code}: ${current.status} → ${status}`,
  );
}

export async function deleteRegistration(id: string, actorId: string): Promise<void> {
  const current = await getRegistrationById(id);
  if (!current) throw new Error("Registration not found.");
  const { error } = await admin().from("registrations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(actorId, "registration.deleted", "registration", id, `Deleted ${current.reference_code}`);
}

export async function listRecentRegistrations(limit = 6): Promise<RegistrationRow[]> {
  const { data, error } = await admin()
    .from("registrations")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeRow);
}

export async function listUpcomingVisits(limit = 5): Promise<RegistrationRow[]> {
  const { data, error } = await admin()
    .from("registrations")
    .select(SELECT)
    .gte("visit_days.visit_date", todayKigali())
    .in("status", ["pending", "confirmed"])
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  const rows = (data ?? []).map(normalizeRow);
  rows.sort((a, b) => a.visit_day.visit_date.localeCompare(b.visit_day.visit_date));
  return rows.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Attendance                                                          */
/* ------------------------------------------------------------------ */

async function ensureAttendance(registrationId: string) {
  const client = admin();
  const { data } = await client.from("attendance").select("*").eq("registration_id", registrationId).maybeSingle();
  if (data) return data;
  const { data: created, error } = await client
    .from("attendance")
    .insert({ registration_id: registrationId, status: "expected" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return created;
}

export async function recordArrival(registrationId: string, actorId: string): Promise<void> {
  const registration = await getRegistrationById(registrationId);
  if (!registration) throw new Error("Registration not found.");
  if (registration.status === "cancelled") throw new Error("This registration has been cancelled.");
  const attendance = await ensureAttendance(registrationId);
  if (attendance.arrival_time) throw new Error("Arrival has already been recorded for this visitor.");
  const now = nowIso();
  const client = admin();
  const { data: updated, error } = await client
    .from("attendance")
    .update({ arrival_time: now, status: "on_campus", recorded_by: actorId, updated_at: now })
    .eq("registration_id", registrationId)
    .is("arrival_time", null)
    .select("registration_id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!updated) throw new Error("Arrival was already recorded by another user.");
  if (registration.status === "pending") {
    await client.from("registrations").update({ status: "confirmed", updated_at: now }).eq("id", registrationId);
  }
  await logAudit(actorId, "attendance.arrival", "registration", registrationId, `Arrival recorded for ${registration.reference_code}`);
}

export async function recordDeparture(
  registrationId: string,
  actorId: string,
  departureAt?: string,
  operationId?: string,
  deviceTimezone?: string,
): Promise<void> {
  const registration = await getRegistrationById(registrationId);
  if (!registration) throw new Error("Registration not found.");
  const attendance = await ensureAttendance(registrationId);
  if (!attendance.arrival_time) throw new Error("Record the visitor's arrival before departure.");
  if (attendance.departure_time) {
    if (operationId && attendance.departure_operation_id === operationId) return;
    throw new Error("Departure has already been recorded for this visitor.");
  }
  const now = nowIso();
  const departureTime = departureAt ?? now;
  const client = admin();
  const { data: updated, error } = await client
    .from("attendance")
    .update({
      departure_time: departureTime,
      departure_device_timezone: deviceTimezone ?? null,
      departure_source: deviceTimezone ? "device" : "server",
      sync_confirmed_at: deviceTimezone ? now : null,
      status: "departed",
      departure_recorded_by: actorId,
      departure_operation_id: operationId ?? null,
      updated_at: now,
    })
    .eq("registration_id", registrationId)
    .is("departure_time", null)
    .is("departure_operation_id", null)
    .select("registration_id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!updated) throw new Error("Departure was already recorded by another user.");
  const { error: registrationError } = await client
    .from("registrations")
    .update({ status: "completed", updated_at: now })
    .eq("id", registrationId);
  if (registrationError) throw new Error(registrationError.message);
  await logAudit(actorId, "attendance.departure", "registration", registrationId, `${departureAt ? "Offline " : ""}departure recorded for ${registration.reference_code}`);
}

export async function markNoShow(registrationId: string, actorId: string): Promise<void> {
  const registration = await getRegistrationById(registrationId);
  if (!registration) throw new Error("Registration not found.");
  const attendance = await ensureAttendance(registrationId);
  if (attendance.arrival_time) throw new Error("This visitor already arrived; no-show cannot be recorded.");
  const now = nowIso();
  const { error } = await admin()
    .from("attendance")
    .update({ status: "no_show", recorded_by: actorId, updated_at: now })
    .eq("registration_id", registrationId);
  if (error) throw new Error(error.message);
  await logAudit(actorId, "attendance.no_show", "registration", registrationId, `No-show for ${registration.reference_code}`);
}

export async function completeVisit(registrationId: string, actorId: string): Promise<void> {
  const registration = await getRegistrationById(registrationId);
  if (!registration) throw new Error("Registration not found.");
  const attendance = await ensureAttendance(registrationId);
  const now = nowIso();
  const client = admin();
  if (attendance.arrival_time && !attendance.departure_time) {
    await client
      .from("attendance")
      .update({ departure_time: now, status: "departed", recorded_by: actorId, updated_at: now })
      .eq("registration_id", registrationId);
  }
  await client.from("registrations").update({ status: "completed", updated_at: now }).eq("id", registrationId);
  await logAudit(actorId, "registration.completed", "registration", registrationId, `Completed ${registration.reference_code}`);
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export async function listNotifications(
  userId: string,
  includeAll = false,
  limit = 30,
): Promise<Notification[]> {
  let query = admin().from("notifications").select("*");
  if (!includeAll) query = query.or(`recipient_id.eq.${userId},recipient_id.is.null`);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as Notification[];
}

export async function unreadNotificationCount(userId: string, includeAll = false): Promise<number> {
  let query = admin().from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false);
  if (!includeAll) query = query.or(`recipient_id.eq.${userId},recipient_id.is.null`);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function markNotificationRead(
  id: string,
  userId: string,
  includeAll = false,
): Promise<void> {
  const client = admin();
  if (!includeAll) {
    const { data } = await client.from("notifications").select("recipient_id").eq("id", id).maybeSingle();
    if (!data) return;
    if (data.recipient_id && data.recipient_id !== userId) return;
  }
  await client.from("notifications").update({ is_read: true }).eq("id", id);
}

export async function markAllNotificationsRead(userId: string, includeAll = false): Promise<void> {
  let query = admin().from("notifications").update({ is_read: true }).eq("is_read", false);
  if (!includeAll) query = query.or(`recipient_id.eq.${userId},recipient_id.is.null`);
  await query;
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export async function getDashboardData(
  date: string,
  user: SessionUser,
  includeAllNotifications = false,
): Promise<DashboardData> {
  const rows = await fetchAllForDate(date);
  const expectedVisitors = rows.filter((r) => r.status === "pending" || r.status === "confirmed").length;
  const arrived = rows.filter((r) => Boolean(r.attendance?.arrival_time)).length;
  const onCampus = rows.filter((r) => r.attendance?.status === "on_campus").length;
  const completed = rows.filter((r) => r.status === "completed" || r.attendance?.status === "departed").length;
  const cancelled = rows.filter((r) => r.status === "cancelled").length;
  const newRegistrations = rows.filter((r) => r.status === "pending").length;
  const upcoming = await listUpcomingVisits(200);

  const stats: DashboardStats = {
    date,
    totalRegistrations: rows.length,
    expectedVisitors,
    arrived,
    notArrived: Math.max(0, expectedVisitors - arrived),
    onCampus,
    completed,
    cancelled,
    newRegistrations,
    totalUpcoming: upcoming.length,
  };

  const startDate = subDays(new Date(`${date}T12:00:00`), 6);
  const startKey = startDate.toISOString().slice(0, 10);
  const client = admin();
  const { data: days } = await client
    .from("visit_days")
    .select("id, visit_date")
    .gte("visit_date", startKey)
    .lte("visit_date", date);
  const dayIds = (days ?? []).map((d: any) => d.id);
  const { data: regs } = dayIds.length
    ? await client.from("registrations").select("visit_day_id, attendance(arrival_time)").in("visit_day_id", dayIds)
    : { data: [] as any[] };

  const trend: TrendPoint[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = subDays(new Date(`${date}T12:00:00`), i);
    const key = d.toISOString().slice(0, 10);
    const day = (days ?? []).find((x: any) => x.visit_date === key);
    const dayRegs = (regs ?? []).filter((r: any) => r.visit_day_id === day?.id);
    trend.push({
      date: key,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      registrations: dayRegs.length,
      arrivals: dayRegs.filter((r: any) => {
        const attendance = Array.isArray(r.attendance) ? r.attendance[0] : r.attendance;
        return Boolean(attendance?.arrival_time);
      }).length,
    });
  }

  const statusBreakdown = (["pending", "confirmed", "cancelled", "completed"] as RegistrationStatus[]).map(
    (status) => ({ status, count: rows.filter((r) => r.status === status).length }),
  );

  const notifications = await listNotifications(user.id, includeAllNotifications, 8);
  const unreadNotifications = await unreadNotificationCount(user.id, includeAllNotifications);

  return {
    stats,
    recent: rows.slice(0, 6),
    upcoming: upcoming.slice(0, 5),
    trend,
    statusBreakdown,
    notifications,
    unreadNotifications,
  };
}

/* ------------------------------------------------------------------ */
/* Staff                                                               */
/* ------------------------------------------------------------------ */

export async function listStaff(): Promise<Profile[]> {
  const { data, error } = await admin()
    .from("profiles")
    .select("*")
    .is("deleted_at", null)
    .order("role_key", { ascending: true })
    .order("full_name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeProfile);
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await admin().from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeProfile(data) : null;
}

export async function getProfileByEmail(email: string): Promise<Profile | null> {
  const { data, error } = await admin().from("profiles").select("*").ilike("email", email).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeProfile(data) : null;
}

async function activeAdminCount(): Promise<number> {
  const { count } = await admin()
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role_key", "admin")
    .eq("status", "active")
    .eq("is_active", true)
    .is("deleted_at", null);
  return count ?? 0;
}

function baseRoleFor(roleKey: string): Role {
  return roleKey === "dean" ? "dean" : "admin";
}

export async function createStaff(input: StaffInput): Promise<Profile> {
  const client = admin();
  const role = await getRole(input.role);
  if (!role) throw new Error("The selected role does not exist.");
  const { data, error } = await client.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.full_name, role: input.role },
  });
  if (error) throw new Error(error.message);
  const user = data.user;
  if (!user) throw new Error("Could not create the staff account.");
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .upsert({
      id: user.id,
      full_name: input.full_name,
      email: input.email,
      role: baseRoleFor(input.role),
      role_key: input.role,
      status: "active",
      is_active: true,
    })
    .select("*")
    .single();
  if (profileError) throw new Error(profileError.message);
  return normalizeProfile(profile);
}

export async function signupPrefect(input: PrefectSignupInput): Promise<void> {
  const client = admin();
  const { data, error } = await client.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name,
      phone_number: input.phone_number,
      role: "prefect",
    },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Could not create the account.");

  const { error: profileError } = await client.from("profiles").upsert({
    id: data.user.id,
    full_name: input.full_name,
    email: input.email.toLowerCase(),
    phone_number: input.phone_number,
    role: "admin",
    role_key: "prefect",
    status: "suspended",
    is_active: false,
  });
  if (profileError) {
    const { error: cleanupError } = await client.auth.admin.deleteUser(data.user.id);
    if (cleanupError) {
      throw new Error(
        `Could not create the profile (${profileError.message}); cleanup failed (${cleanupError.message}).`,
      );
    }
    throw new Error(profileError.message);
  }
}

export async function updateStaffProfile(
  id: string,
  input: { full_name: string; email: string },
): Promise<void> {
  const target = await getProfileById(id);
  if (!target) throw new Error("Staff member not found.");
  const email = input.email.toLowerCase();
  const existing = await getProfileByEmail(email);
  if (existing && existing.id !== id) throw new Error("Another staff member already uses this email address.");
  const client = admin();
  const { error: authError } = await client.auth.admin.updateUserById(id, { email });
  if (authError) throw new Error(authError.message);
  const { error } = await client
    .from("profiles")
    .update({ full_name: input.full_name, email, updated_at: nowIso() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function updateStaffRole(id: string, roleKey: Role): Promise<void> {
  const target = await getProfileById(id);
  if (!target) throw new Error("Staff member not found.");
  const role = await getRole(roleKey);
  if (!role) throw new Error("The selected role does not exist.");
  if (target.role_key === "admin" && roleKey !== "admin" && (await activeAdminCount()) <= 1) {
    throw new Error("At least one active Super Administrator is required.");
  }
  const { error } = await admin()
    .from("profiles")
    .update({ role_key: roleKey, role: baseRoleFor(roleKey), updated_at: nowIso() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setStaffStatus(id: string, status: UserStatus): Promise<void> {
  const target = await getProfileById(id);
  if (!target) throw new Error("Staff member not found.");
  if (target.role_key === "admin" && status !== "active" && (await activeAdminCount()) <= 1) {
    throw new Error("At least one active Super Administrator is required.");
  }
  const { error } = await admin()
    .from("profiles")
    .update({ status, is_active: status === "active", updated_at: nowIso() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setStaffActive(id: string, active: boolean): Promise<void> {
  await setStaffStatus(id, active ? "active" : "suspended");
}

export async function deleteStaff(id: string, actorId: string): Promise<void> {
  const target = await getProfileById(id);
  if (!target) throw new Error("Staff member not found.");
  if (target.role_key === "admin" && (await activeAdminCount()) <= 1) {
    throw new Error("The last active Super Administrator cannot be deleted.");
  }
  const now = nowIso();
  const { error } = await admin()
    .from("profiles")
    .update({ deleted_at: now, status: "disabled", is_active: false, updated_at: now })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await logAudit(actorId, "user.deleted", "profile", id, `Deleted ${target.full_name} (${target.email})`);
}

export async function resetStaffPassword(id: string, password: string): Promise<void> {
  const target = await getProfileById(id);
  if (!target) throw new Error("Staff member not found.");
  const { error } = await admin().auth.admin.updateUserById(id, { password });
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ */
/* Roles & permissions                                                 */
/* ------------------------------------------------------------------ */

export async function listRoles(): Promise<RoleRecord[]> {
  const { data, error } = await admin()
    .from("roles")
    .select("*")
    .order("is_system", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as RoleRecord[];
}

export async function getRole(key: string): Promise<RoleRecord | null> {
  const { data, error } = await admin().from("roles").select("*").eq("key", key).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as RoleRecord) ?? null;
}

export async function roleNameFor(key: string): Promise<string> {
  return (await getRole(key))?.name ?? key;
}

export async function createRole(input: {
  key: string;
  name: string;
  description: string;
}): Promise<RoleRecord> {
  const existing = await getRole(input.key);
  if (existing) throw new Error("A role with this key already exists.");
  const { data, error } = await admin()
    .from("roles")
    .insert({
      key: input.key,
      name: input.name,
      description: input.description,
      is_system: false,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as RoleRecord;
}

export async function updateRole(
  key: string,
  input: { name: string; description: string },
): Promise<void> {
  const role = await getRole(key);
  if (!role) throw new Error("Role not found.");
  const { error } = await admin()
    .from("roles")
    .update({ name: input.name, description: input.description, updated_at: nowIso() })
    .eq("key", key);
  if (error) throw new Error(error.message);
}

export async function deleteRole(key: string): Promise<void> {
  const role = await getRole(key);
  if (!role) throw new Error("Role not found.");
  if (role.is_system) throw new Error("System roles cannot be deleted.");
  const { count } = await admin()
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role_key", key)
    .is("deleted_at", null);
  if ((count ?? 0) > 0) {
    throw new Error("This role is still assigned to users. Reassign them before deleting it.");
  }
  const { error } = await admin().from("roles").delete().eq("key", key);
  if (error) throw new Error(error.message);
}

export async function listRolePermissions(roleKey: string): Promise<PermissionKey[]> {
  if (roleKey === "admin") return computePermissions("admin", []);
  const { data, error } = await admin()
    .from("role_permissions")
    .select("permission_key")
    .eq("role_key", roleKey);
  if (error) throw new Error(error.message);
  return (data ?? []).map((entry: any) => entry.permission_key);
}

export async function listRolePermissionMap(): Promise<Record<string, PermissionKey[]>> {
  const { data, error } = await admin().from("role_permissions").select("role_key, permission_key");
  if (error) throw new Error(error.message);
  const map: Record<string, PermissionKey[]> = {};
  for (const entry of (data ?? []) as { role_key: string; permission_key: string }[]) {
    map[entry.role_key] ??= [];
    map[entry.role_key].push(entry.permission_key);
  }
  return map;
}

export async function setRolePermissions(
  roleKey: string,
  permissionKeys: PermissionKey[],
): Promise<void> {
  const role = await getRole(roleKey);
  if (!role) throw new Error("Role not found.");
  if (roleKey === "admin") throw new Error("Super Administrator always has every permission.");
  const client = admin();
  const { error: deleteError } = await client
    .from("role_permissions")
    .delete()
    .eq("role_key", roleKey);
  if (deleteError) throw new Error(deleteError.message);
  if (permissionKeys.length === 0) return;
  const { error } = await client
    .from("role_permissions")
    .insert(permissionKeys.map((permissionKey) => ({ role_key: roleKey, permission_key: permissionKey })));
  if (error) throw new Error(error.message);
}

export async function getUserPermissionOverrides(userId: string): Promise<UserPermissionOverride[]> {
  const { data, error } = await admin()
    .from("user_permissions")
    .select("permission_key, allowed")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((entry: any) => ({
    permission_key: entry.permission_key,
    allowed: Boolean(entry.allowed),
  }));
}

export async function setUserPermissionOverrides(
  userId: string,
  overrides: UserPermissionOverride[],
): Promise<void> {
  const target = await getProfileById(userId);
  if (!target) throw new Error("Staff member not found.");
  if (target.role_key === "admin") {
    throw new Error("Super Administrator always has every permission.");
  }
  const client = admin();
  const { error: deleteError } = await client
    .from("user_permissions")
    .delete()
    .eq("user_id", userId);
  if (deleteError) throw new Error(deleteError.message);
  if (overrides.length === 0) return;
  const { error } = await client.from("user_permissions").insert(
    overrides.map((override) => ({
      user_id: userId,
      permission_key: override.permission_key,
      allowed: override.allowed,
    })),
  );
  if (error) throw new Error(error.message);
}

export async function getEffectivePermissionsForProfile(profile: Profile): Promise<PermissionKey[]> {
  if (profile.role_key === "admin") return computePermissions("admin", []);
  const [rolePermissions, overrides] = await Promise.all([
    listRolePermissions(profile.role_key),
    getUserPermissionOverrides(profile.id),
  ]);
  return computePermissions(profile.role_key, rolePermissions, overrides);
}

export function defaultRolePermissions(roleKey: string): PermissionKey[] {
  return DEFAULT_ROLE_PERMISSIONS[roleKey] ?? [];
}

/* ------------------------------------------------------------------ */
/* Audit                                                               */
/* ------------------------------------------------------------------ */

export async function logAudit(
  actorId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  details: string,
  status: AuditStatus = "success",
): Promise<void> {
  await admin().from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details,
    status,
  });
}

export async function listAuditLogs(limit = 50): Promise<(AuditLog & { actor_name?: string | null })[]> {
  const { data, error } = await admin()
    .from("audit_logs")
    .select("*, actor:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((a: any) => ({
    ...a,
    status: a.status ?? "success",
    actor_name: a.actor?.full_name ?? null,
  }));
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export async function getReportRows(date: string): Promise<RegistrationRow[]> {
  return fetchAllForDate(date);
}

export async function getReportRowsByFilters(filters: ReportFilters): Promise<RegistrationRow[]> {
  let query = admin().from("registrations").select(SELECT);
  if (filters.dateFrom) query = query.gte("visit_days.visit_date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("visit_days.visit_date", filters.dateTo);
  if (filters.className) query = query.ilike("students.class_name", `%${filters.className}%`);
  if (filters.status) query = query.eq("status", filters.status);
  const { data, error } = await query.order("created_at", { ascending: false }).limit(5000);
  if (error) throw new Error(error.message);

  let rows = (data ?? []).map(normalizeRow);
  if (filters.student) {
    const term = filters.student.toLowerCase();
    rows = rows.filter(
      (row) =>
        row.student.full_name.toLowerCase().includes(term) ||
        row.student.registration_number.toLowerCase().includes(term),
    );
  }
  if (filters.visitor) {
    const term = filters.visitor.toLowerCase();
    rows = rows.filter(
      (row) => row.visitor.full_name.toLowerCase().includes(term) || row.visitor.phone.includes(term),
    );
  }
  if (filters.attendance) {
    rows = rows.filter((row) => (row.attendance?.status ?? "expected") === filters.attendance);
  }
  rows.sort((a, b) => {
    const byDate = b.visit_day.visit_date.localeCompare(a.visit_day.visit_date);
    return byDate !== 0 ? byDate : a.visitor.full_name.localeCompare(b.visitor.full_name);
  });
  return rows;
}

/* ------------------------------------------------------------------ */
/* Archive                                                             */
/* ------------------------------------------------------------------ */

export async function archiveRegistration(id: string, actorId: string): Promise<void> {
  const registration = await getRegistrationById(id);
  if (!registration) throw new Error("Registration not found.");
  const client = admin();
  const { error } = await client.from("archived_records").insert({
    registration_id: registration.id,
    reference_code: registration.reference_code,
    visitor_name: registration.visitor.full_name,
    student_name: registration.student.full_name,
    visit_date: registration.visit_day.visit_date,
    snapshot: registration,
    archived_by: actorId,
  });
  if (error) throw new Error(error.message);
  const { error: deleteError } = await client.from("registrations").delete().eq("id", id);
  if (deleteError) throw new Error(deleteError.message);
  await logAudit(
    actorId,
    "record.archived",
    "registration",
    id,
    `Archived ${registration.reference_code} (${registration.visitor.full_name})`,
  );
}

export async function bulkArchiveRegistrations(ids: string[], actorId: string): Promise<number> {
  let count = 0;
  for (const id of ids) {
    try {
      await archiveRegistration(id, actorId);
      count += 1;
    } catch {
      // Skip records that no longer exist.
    }
  }
  return count;
}

export async function listArchivedRecords(limit = 250): Promise<ArchivedRecord[]> {
  const { data, error } = await admin()
    .from("archived_records")
    .select("*, archived_by_profile:profiles(full_name)")
    .order("archived_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((raw: any) => ({
    id: String(raw.id),
    registration_id: String(raw.registration_id),
    reference_code: String(raw.reference_code),
    visitor_name: String(raw.visitor_name),
    student_name: String(raw.student_name),
    visit_date: String(raw.visit_date),
    archived_at: String(raw.archived_at),
    archived_by: raw.archived_by ?? null,
    archived_by_name: raw.archived_by_profile?.full_name ?? null,
    snapshot: typeof raw.snapshot === "string" ? raw.snapshot : JSON.stringify(raw.snapshot),
  }));
}

export async function restoreArchivedRecord(archiveId: string, actorId: string): Promise<void> {
  const client = admin();
  const { data: raw, error } = await client
    .from("archived_records")
    .select("*")
    .eq("id", archiveId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!raw) throw new Error("Archived record not found.");
  const snapshot = (
    typeof raw.snapshot === "string" ? JSON.parse(raw.snapshot) : raw.snapshot
  ) as RegistrationRow;

  const { error: insertError } = await client.from("registrations").insert({
    id: snapshot.id,
    reference_code: snapshot.reference_code,
    visitor_id: snapshot.visitor_id,
    student_id: snapshot.student_id,
    visit_day_id: snapshot.visit_day_id,
    purpose: snapshot.purpose,
    message: snapshot.message,
    status: snapshot.status,
    created_at: snapshot.created_at,
    updated_at: snapshot.updated_at,
  });
  if (insertError) throw new Error(insertError.message);

  if (snapshot.attendance) {
    await client.from("attendance").insert({
      id: snapshot.attendance.id,
      registration_id: snapshot.id,
      arrival_time: snapshot.attendance.arrival_time,
      departure_time: snapshot.attendance.departure_time,
      status: snapshot.attendance.status,
      recorded_by: snapshot.attendance.recorded_by,
      created_at: snapshot.attendance.created_at,
      updated_at: snapshot.attendance.updated_at,
    });
  } else {
    await client.from("attendance").insert({ registration_id: snapshot.id, status: "expected" });
  }

  await client.from("archived_records").delete().eq("id", archiveId);
  await logAudit(
    actorId,
    "record.restored",
    "registration",
    snapshot.id,
    `Restored ${snapshot.reference_code} (${snapshot.visitor.full_name})`,
  );
}

export async function deleteArchivedRecord(archiveId: string, actorId: string): Promise<void> {
  const client = admin();
  const { data: raw } = await client
    .from("archived_records")
    .select("registration_id, reference_code")
    .eq("id", archiveId)
    .maybeSingle();
  if (!raw) throw new Error("Archived record not found.");
  const { error } = await client.from("archived_records").delete().eq("id", archiveId);
  if (error) throw new Error(error.message);
  await logAudit(
    actorId,
    "record.purged",
    "registration",
    String(raw.registration_id),
    `Permanently deleted archived record ${String(raw.reference_code)}`,
  );
}

/* ------------------------------------------------------------------ */
/* Email & report history                                              */
/* ------------------------------------------------------------------ */

function defaultEmailSettings(): EmailSettings {
  return {
    id: "default",
    dean_name: "Dean of Discipline",
    dean_email: process.env.DEAN_EMAIL || "dean@mubiligi.rw",
    cc_email: "",
    email_enabled: false,
    default_format: "pdf",
    auto_enabled: false,
    auto_time: "17:00",
    auto_format: "pdf",
    last_sent_date: null,
    updated_at: nowIso(),
  };
}

export async function getEmailSettings(): Promise<EmailSettings> {
  const { data, error } = await admin()
    .from("email_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    const settings = defaultEmailSettings();
    await admin().from("email_settings").insert(settings);
    return settings;
  }
  return {
    ...data,
    email_enabled: Boolean(data.email_enabled),
    auto_enabled: Boolean(data.auto_enabled),
    default_format: data.default_format as EmailFormat,
    auto_format: data.auto_format as EmailFormat,
  } as EmailSettings;
}

export async function updateEmailSettings(
  input: Omit<EmailSettings, "id" | "last_sent_date" | "updated_at">,
): Promise<void> {
  const { error } = await admin()
    .from("email_settings")
    .upsert({
      id: "default",
      ...input,
      updated_at: nowIso(),
    });
  if (error) throw new Error(error.message);
}

export async function setEmailLastSent(date: string): Promise<void> {
  const { error } = await admin()
    .from("email_settings")
    .update({ last_sent_date: date, updated_at: nowIso() })
    .eq("id", "default");
  if (error) throw new Error(error.message);
}

export async function recordReportHistory(
  input: Omit<ReportHistory, "id" | "created_at" | "actor_name">,
): Promise<void> {
  const { error } = await admin().from("report_history").insert({
    sent_to: input.sent_to,
    cc: input.cc,
    format: input.format,
    date_from: input.date_from,
    date_to: input.date_to,
    row_count: input.row_count,
    status: input.status,
    error: input.error,
    triggered_by: input.triggered_by,
    actor_id: input.actor_id,
  });
  if (error) throw new Error(error.message);
}

export async function listReportHistory(limit = 50): Promise<ReportHistory[]> {
  const { data, error } = await admin()
    .from("report_history")
    .select("*, actor:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((raw: any) => ({
    ...raw,
    actor_name: raw.actor?.full_name ?? null,
  })) as ReportHistory[];
}

export async function getVisitDayByDate(date: string): Promise<VisitDay | null> {
  const { data, error } = await admin()
    .from("visit_days")
    .select("*")
    .eq("visit_date", date)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as VisitDay) ?? null;
}

export async function getRegistrationSummaryByStatus(): Promise<Record<string, number>> {
  const { data, error } = await admin().from("registrations").select("status");
  if (error) throw new Error(error.message);
  const result: Record<string, number> = {};
  for (const row of (data ?? []) as { status: string }[]) {
    result[row.status] = (result[row.status] ?? 0) + 1;
  }
  return result;
}

export type RemoteAttendanceStatus = AttendanceStatus;

export async function markLogin(id: string): Promise<void> {
  const now = nowIso();
  await admin().from("profiles").update({ last_login_at: now, updated_at: now }).eq("id", id);
}
