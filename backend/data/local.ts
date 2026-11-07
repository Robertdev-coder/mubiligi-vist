import "server-only";
import bcrypt from "bcryptjs";
import { format, subDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { KIGALI_TZ, generateReferenceCode, normalizePhone, nowIso, todayKigali } from "@/shared/utils";
import { newId, row, rows, run, getDb } from "@/backend/db/sqlite";
import type {
  ArchivedRecord,
  AuditLog,
  AuditStatus,
  Attendance,
  AttendanceStatus,
  DashboardData,
  DashboardStats,
  EmailFormat,
  EmailSettings,
  Notification,
  Paginated,
  PermissionKey,
  Profile,
  Registration,
  RegistrationFilters,
  RegistrationRow,
  RegistrationStatus,
  ReportFilters,
  ReportHistory,
  Role,
  RoleRecord,
  SessionUser,
  Student,
  TrendPoint,
  UserPermissionOverride,
  UserStatus,
  VisitDay,
  Visitor,
} from "@/shared/types";
import type { PrefectSignupInput, RegistrationInput, RegistrationUpdateInput, StaffInput, VisitDayInput } from "@/shared/validation/schemas";
import { DEFAULT_ROLE_PERMISSIONS, PURPOSE_LABEL, REGISTRATION_STATUS_LABEL } from "@/shared/constants";
import { computePermissions } from "@/backend/auth/permissions";
import { formatDateKigali } from "@/shared/utils";

type RawRow = Record<string, string | number | null>;

const BASE_SELECT = `
SELECT
  r.id, r.reference_code, r.visitor_id, r.student_id, r.visit_day_id,
  r.purpose, r.message, r.status, r.created_at, r.updated_at,
  v.id AS v_id, v.full_name AS v_full_name, v.phone AS v_phone, v.email AS v_email,
  v.national_id AS v_national_id, v.relationship AS v_relationship,
  v.created_at AS v_created_at, v.updated_at AS v_updated_at,
  s.id AS s_id, s.registration_number AS s_registration_number, s.full_name AS s_full_name,
  s.trade AS s_trade, s.level AS s_level, s.class_name AS s_class_name,
  s.created_at AS s_created_at, s.updated_at AS s_updated_at,
  d.id AS d_id, d.title AS d_title, d.visit_date AS d_visit_date,
  d.registration_open AS d_registration_open, d.registration_close AS d_registration_close,
  d.is_active AS d_is_active, d.instructions AS d_instructions,
  d.created_at AS d_created_at, d.updated_at AS d_updated_at,
  a.id AS a_id, a.arrival_time AS a_arrival_time, a.departure_time AS a_departure_time,
  a.arrival_device_timezone AS a_arrival_device_timezone, a.arrival_source AS a_arrival_source,
  a.departure_device_timezone AS a_departure_device_timezone, a.departure_source AS a_departure_source,
  a.sync_confirmed_at AS a_sync_confirmed_at,
  a.status AS a_status, a.recorded_by AS a_recorded_by,
  a.departure_recorded_by AS a_departure_recorded_by,
  a.created_at AS a_created_at, a.updated_at AS a_updated_at,
  p.full_name AS recorded_by_name, pd.full_name AS departure_recorded_by_name
FROM registrations r
JOIN visitors v ON v.id = r.visitor_id
JOIN students s ON s.id = r.student_id
JOIN visit_days d ON d.id = r.visit_day_id
LEFT JOIN attendance a ON a.registration_id = r.id
LEFT JOIN profiles p ON p.id = a.recorded_by
LEFT JOIN profiles pd ON pd.id = a.departure_recorded_by
`;

function mapRow(raw: RawRow): RegistrationRow {
  return {
    id: String(raw.id),
    reference_code: String(raw.reference_code),
    visitor_id: String(raw.visitor_id),
    student_id: String(raw.student_id),
    visit_day_id: String(raw.visit_day_id),
    purpose: raw.purpose as Registration["purpose"],
    message: (raw.message as string | null) ?? null,
    status: raw.status as RegistrationStatus,
    archived_at: (raw.archived_at as string | null) ?? null,
    archived_by: (raw.archived_by as string | null) ?? null,
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
    visitor: {
      id: String(raw.v_id),
      full_name: String(raw.v_full_name),
      phone: String(raw.v_phone),
      email: (raw.v_email as string | null) ?? null,
      national_id: (raw.v_national_id as string | null) ?? null,
      relationship: raw.v_relationship as Visitor["relationship"],
      created_at: String(raw.v_created_at),
      updated_at: String(raw.v_updated_at),
    },
    student: {
      id: String(raw.s_id),
      registration_number: String(raw.s_registration_number),
      full_name: String(raw.s_full_name),
      trade: raw.s_trade as Student["trade"],
      level: raw.s_level as Student["level"],
      class_name: String(raw.s_class_name),
      created_at: String(raw.s_created_at),
      updated_at: String(raw.s_updated_at),
    },
    visit_day: {
      id: String(raw.d_id),
      title: String(raw.d_title),
      visit_date: String(raw.d_visit_date),
      registration_open: String(raw.d_registration_open),
      registration_close: String(raw.d_registration_close),
      is_active: Number(raw.d_is_active) === 1,
      instructions: (raw.d_instructions as string | null) ?? null,
      created_at: String(raw.d_created_at),
      updated_at: String(raw.d_updated_at),
    },
    attendance: raw.a_id
      ? {
          id: String(raw.a_id),
          registration_id: String(raw.id),
          arrival_time: (raw.a_arrival_time as string | null) ?? null,
          arrival_device_timezone: (raw.a_arrival_device_timezone as string | null) ?? null,
          arrival_source: (raw.a_arrival_source as Attendance["arrival_source"]) ?? "server",
          departure_time: (raw.a_departure_time as string | null) ?? null,
          departure_device_timezone: (raw.a_departure_device_timezone as string | null) ?? null,
          departure_source: (raw.a_departure_source as Attendance["departure_source"]) ?? null,
          sync_confirmed_at: (raw.a_sync_confirmed_at as string | null) ?? null,
          status: raw.a_status as AttendanceStatus,
          recorded_by: (raw.a_recorded_by as string | null) ?? null,
          departure_recorded_by: (raw.a_departure_recorded_by as string | null) ?? null,
          created_at: String(raw.a_created_at),
          updated_at: String(raw.a_updated_at),
        }
      : null,
    recorded_by_name: (raw.recorded_by_name as string | null) ?? null,
    departure_recorded_by_name: (raw.departure_recorded_by_name as string | null) ?? null,
  };
}

function mapVisitDay(raw: RawRow): VisitDay {
  return {
    id: String(raw.id),
    title: String(raw.title),
    visit_date: String(raw.visit_date),
    registration_open: String(raw.registration_open),
    registration_close: String(raw.registration_close),
    is_active: Number(raw.is_active) === 1,
    instructions: (raw.instructions as string | null) ?? null,
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
  };
}

function mapProfile(raw: RawRow): Profile {
  const roleKey = (raw.role_key as Role | null) ?? (raw.role as Role);
  return {
    id: String(raw.id),
    full_name: String(raw.full_name),
    email: String(raw.email),
    phone_number: (raw.phone_number as string | null) ?? null,
    role: roleKey,
    role_key: roleKey,
    status: ((raw.status as UserStatus | null) ?? (Number(raw.is_active) === 1 ? "active" : "disabled")),
    is_active: Number(raw.is_active) === 1 && (raw.status ?? "active") === "active",
    last_login_at: (raw.last_login_at as string | null) ?? null,
    deleted_at: (raw.deleted_at as string | null) ?? null,
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
  };
}

function mapRole(raw: RawRow): RoleRecord {
  return {
    key: String(raw.key),
    name: String(raw.name),
    description: String(raw.description ?? ""),
    is_system: Number(raw.is_system) === 1,
    created_at: String(raw.created_at),
    updated_at: String(raw.updated_at),
  };
}

function mapEmailSettings(raw: RawRow): EmailSettings {
  return {
    id: String(raw.id),
    dean_name: String(raw.dean_name ?? ""),
    dean_email: String(raw.dean_email ?? ""),
    cc_email: String(raw.cc_email ?? ""),
    email_enabled: Number(raw.email_enabled) === 1,
    default_format: raw.default_format as EmailFormat,
    auto_enabled: Number(raw.auto_enabled) === 1,
    auto_time: String(raw.auto_time ?? "17:00"),
    auto_format: raw.auto_format as EmailFormat,
    last_sent_date: (raw.last_sent_date as string | null) ?? null,
    updated_at: String(raw.updated_at),
  };
}

/* ------------------------------------------------------------------ */
/* Visit days                                                          */
/* ------------------------------------------------------------------ */

export async function listVisitDays(): Promise<VisitDay[]> {
  return rows<RawRow>("SELECT * FROM visit_days ORDER BY visit_date DESC").map(mapVisitDay);
}

export async function getActiveVisitDays(): Promise<VisitDay[]> {
  const now = nowIso();
  return rows<RawRow>(
    `SELECT * FROM visit_days
     WHERE is_active = 1 AND registration_open <= ? AND registration_close >= ?
     ORDER BY visit_date ASC`,
    now,
    now,
  ).map(mapVisitDay);
}

export async function getVisitDay(id: string): Promise<VisitDay | null> {
  const raw = row<RawRow>("SELECT * FROM visit_days WHERE id = ?", id);
  return raw ? mapVisitDay(raw) : null;
}

export async function createVisitDay(input: VisitDayInput): Promise<VisitDay> {
  const id = newId();
  const now = nowIso();
  run(
    `INSERT INTO visit_days (id, title, visit_date, registration_open, registration_close, is_active, instructions, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.title,
    input.visit_date,
    fromZonedTime(input.registration_open, KIGALI_TZ).toISOString(),
    fromZonedTime(input.registration_close, KIGALI_TZ).toISOString(),
    input.is_active ? 1 : 0,
    input.instructions || null,
    now,
    now,
  );
  return (await getVisitDay(id)) as VisitDay;
}

export async function updateVisitDay(id: string, input: VisitDayInput): Promise<VisitDay> {
  run(
    `UPDATE visit_days SET title = ?, visit_date = ?, registration_open = ?, registration_close = ?,
     is_active = ?, instructions = ?, updated_at = ? WHERE id = ?`,
    input.title,
    input.visit_date,
    fromZonedTime(input.registration_open, KIGALI_TZ).toISOString(),
    fromZonedTime(input.registration_close, KIGALI_TZ).toISOString(),
    input.is_active ? 1 : 0,
    input.instructions || null,
    nowIso(),
    id,
  );
  return (await getVisitDay(id)) as VisitDay;
}

export async function toggleVisitDay(id: string, isActive: boolean): Promise<void> {
  run("UPDATE visit_days SET is_active = ?, updated_at = ? WHERE id = ?", isActive ? 1 : 0, nowIso(), id);
}

/* ------------------------------------------------------------------ */
/* Registrations                                                       */
/* ------------------------------------------------------------------ */

function upsertVisitor(input: RegistrationInput): string {
  const phone = normalizePhone(input.phone);
  const existing = row<RawRow>(
    "SELECT * FROM visitors WHERE phone = ? AND lower(full_name) = lower(?) ORDER BY created_at DESC LIMIT 1",
    phone,
    input.fullName,
  );
  const now = nowIso();
  if (existing) {
    run(
      `UPDATE visitors SET email = COALESCE(?, email), national_id = COALESCE(?, national_id),
       relationship = ?, updated_at = ? WHERE id = ?`,
      input.email || null,
      input.nationalId || null,
      input.relationship,
      now,
      String(existing.id),
    );
    return String(existing.id);
  }
  const id = newId();
  run(
    `INSERT INTO visitors (id, full_name, phone, email, national_id, relationship, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.fullName,
    phone,
    input.email || null,
    input.nationalId || null,
    input.relationship,
    now,
    now,
  );
  return id;
}

function upsertStudent(input: RegistrationInput): string {
  const existing = row<RawRow>(
    "SELECT * FROM students WHERE lower(registration_number) = lower(?)",
    input.studentRegistrationNumber,
  );
  const now = nowIso();
  if (existing) {
    run(
      `UPDATE students SET full_name = ?, trade = ?, level = ?, class_name = ?, updated_at = ? WHERE id = ?`,
      input.studentFullName,
      input.trade,
      input.level,
      input.className,
      now,
      String(existing.id),
    );
    return String(existing.id);
  }
  const id = newId();
  run(
    `INSERT INTO students (id, registration_number, full_name, trade, level, class_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.studentRegistrationNumber.toUpperCase(),
    input.studentFullName,
    input.trade,
    input.level,
    input.className,
    now,
    now,
  );
  return id;
}

function createUniqueReference(): string {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const reference = generateReferenceCode();
    const exists = row<{ id: string }>(
      "SELECT id FROM registrations WHERE reference_code = ?",
      reference,
    );
    if (!exists) return reference;
  }
  throw new Error("Could not generate a unique registration reference.");
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
  if (options.syncOperationId) {
    const existing = row<{ id: string; reference_code: string }>(
      "SELECT id, reference_code FROM registrations WHERE sync_operation_id = ?",
      options.syncOperationId,
    );
    if (existing) return { id: existing.id, reference: existing.reference_code };
  }
  const visitDayRaw = row<RawRow>("SELECT * FROM visit_days WHERE id = ?", input.visitDayId);
  if (!visitDayRaw) throw new Error("The selected visit day could not be found.");
  const visitDay = mapVisitDay(visitDayRaw);

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
  const duplicate = row<RawRow>(
    `SELECT r.id, r.reference_code FROM registrations r
     JOIN visitors v ON v.id = r.visitor_id
     JOIN students s ON s.id = r.student_id
     WHERE v.phone = ? AND lower(s.registration_number) = lower(?)
       AND r.visit_day_id = ? AND r.status != 'cancelled' AND r.created_at >= ?`,
    phone,
    input.studentRegistrationNumber,
    input.visitDayId,
    since,
  );
  if (duplicate) {
    throw new Error(
      `A registration for this student already exists for this visit day (ref ${String(
        duplicate.reference_code,
      )}). Use "Check My Registration" to view it.`,
    );
  }

  const visitorId = upsertVisitor(input);
  const studentId = upsertStudent(input);
  const id = newId();
  const reference = createUniqueReference();
  const now = nowIso();
  const status = options.departureAt ? "completed" : options.status ?? "pending";

  run(
    `INSERT INTO registrations (id, reference_code, visitor_id, student_id, visit_day_id, purpose, message, status, sync_operation_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    reference,
    visitorId,
    studentId,
    visitDay.id,
    input.purpose,
    input.message || null,
    status,
    options.syncOperationId ?? null,
    now,
    now,
  );

  const arrivalTime = options.markArrived ? options.arrivalAt ?? now : null;
  const departureTime = options.departureAt ?? null;
  run(
    `INSERT INTO attendance (id, registration_id, arrival_time, arrival_device_timezone, arrival_source, departure_time, departure_device_timezone, departure_source, sync_confirmed_at, status, recorded_by, departure_recorded_by, departure_operation_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    newId(),
    id,
    arrivalTime,
    options.arrivalTimezone ?? null,
    options.arrivalSource ?? "server",
    departureTime,
    departureTime ? options.departureTimezone ?? null : null,
    departureTime ? options.departureSource ?? "server" : null,
    options.syncedAt ?? null,
    departureTime ? "departed" : arrivalTime ? "on_campus" : "expected",
    arrivalTime ? options.actorId ?? null : null,
    departureTime ? options.actorId ?? null : null,
    departureTime ? options.departureOperationId ?? null : null,
    now,
    now,
  );

  notifyDeans(
    "New visit registration received",
    `${input.fullName} registered to visit ${input.studentFullName} (${input.studentRegistrationNumber}) on ${formatDateKigali(
      visitDay.visit_date,
      "dd MMM yyyy",
    )}. Reference: ${reference}. Submitted ${formatDateKigali(now, "dd MMM yyyy, HH:mm")}.`,
    id,
  );

  logAudit(
    options.actorId ?? null,
    options.actorId ? "registration.created_by_staff" : "registration.created",
    "registration",
    id,
    `${input.fullName} → ${input.studentFullName} (${reference})`,
  );
  if (arrivalTime && options.actorId) {
    logAudit(
      options.actorId,
      "attendance.arrival",
      "registration",
      id,
      `Arrival recorded for ${reference}`,
    );
  }
  if (departureTime && options.actorId) {
    logAudit(
      options.actorId,
      "attendance.departure",
      "registration",
      id,
      `Offline departure synchronized for ${reference}`,
    );
  }

  return { id, reference };
}

export async function getRegistrationById(id: string): Promise<RegistrationRow | null> {
  const raw = row<RawRow>(`${BASE_SELECT} WHERE r.id = ?`, id);
  return raw ? mapRow(raw) : null;
}

export async function getRegistrationByReference(reference: string): Promise<RegistrationRow | null> {
  const raw = row<RawRow>(`${BASE_SELECT} WHERE upper(r.reference_code) = ?`, reference.toUpperCase());
  return raw ? mapRow(raw) : null;
}

export async function getRegistrationBySyncOperationId(
  syncOperationId: string,
): Promise<{ id: string; reference: string } | null> {
  const found = row<{ id: string; reference_code: string }>(
    "SELECT id, reference_code FROM registrations WHERE sync_operation_id = ?",
    syncOperationId,
  );
  return found ? { id: found.id, reference: found.reference_code } : null;
}

export async function findRegistrationForLookup(
  reference: string,
  phone: string,
): Promise<RegistrationRow | null> {
  const raw = row<RawRow>(
    `${BASE_SELECT} WHERE upper(r.reference_code) = ? AND v.phone = ?`,
    reference.toUpperCase(),
    normalizePhone(phone),
  );
  return raw ? mapRow(raw) : null;
}

export async function listRegistrations(
  filters: RegistrationFilters = {},
): Promise<Paginated<RegistrationRow>> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(500, Math.max(5, filters.pageSize ?? 10));
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (filters.search) {
    const term = `%${filters.search.trim().toLowerCase()}%`;
    where.push(
      `(lower(v.full_name) LIKE ? OR lower(s.full_name) LIKE ? OR lower(s.registration_number) LIKE ? OR lower(r.reference_code) LIKE ? OR v.phone LIKE ?)`,
    );
    params.push(term, term, term, term, term);
  }
  if (filters.status) {
    where.push("r.status = ?");
    params.push(filters.status);
  }
  if (filters.trade) {
    where.push("s.trade = ?");
    params.push(filters.trade);
  }
  if (filters.level) {
    where.push("s.level = ?");
    params.push(filters.level);
  }
  if (filters.className) {
    where.push("lower(s.class_name) LIKE ?");
    params.push(`%${filters.className.toLowerCase()}%`);
  }
  if (filters.visitDate) {
    where.push("d.visit_date = ?");
    params.push(filters.visitDate);
  }
  if (filters.attendance) {
    where.push("COALESCE(a.status, 'expected') = ?");
    params.push(filters.attendance);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sortMap: Record<string, string> = {
    created_at: "r.created_at",
    visit_date: "d.visit_date",
    visitor: "v.full_name",
    student: "s.full_name",
    status: "r.status",
    reference: "r.reference_code",
    class: "s.class_name",
    trade: "s.trade",
    arrival: "a.arrival_time",
  };
  const sortColumn = sortMap[filters.sort ?? "created_at"] ?? "r.created_at";
  const direction = filters.direction === "asc" ? "ASC" : "DESC";

  const totalRow = row<{ count: number }>(
    `SELECT COUNT(*) AS count FROM registrations r
     JOIN visitors v ON v.id = r.visitor_id
     JOIN students s ON s.id = r.student_id
     JOIN visit_days d ON d.id = r.visit_day_id
     LEFT JOIN attendance a ON a.registration_id = r.id
     ${whereSql}`,
    ...params,
  );
  const total = Number(totalRow?.count ?? 0);
  const offset = (page - 1) * pageSize;

  const data = rows<RawRow>(
    `${BASE_SELECT} ${whereSql} ORDER BY ${sortColumn} ${direction}, r.created_at DESC LIMIT ? OFFSET ?`,
    ...params,
    pageSize,
    offset,
  ).map(mapRow);

  return {
    rows: data,
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
  const now = nowIso();
  run(
    `UPDATE visitors SET full_name = ?, phone = ?, email = ?, national_id = ?, relationship = ?, updated_at = ? WHERE id = ?`,
    input.full_name,
    normalizePhone(input.phone),
    input.email || null,
    input.national_id || null,
    input.relationship,
    now,
    current.visitor_id,
  );
  run(
    `UPDATE students SET full_name = ?, registration_number = ?, trade = ?, level = ?, class_name = ?, updated_at = ? WHERE id = ?`,
    input.student_full_name,
    input.registration_number.toUpperCase(),
    input.trade,
    input.level,
    input.class_name,
    now,
    current.student_id,
  );
  run(
    `UPDATE registrations SET purpose = ?, message = ?, status = ?, updated_at = ? WHERE id = ?`,
    input.purpose,
    input.message || null,
    input.status,
    now,
    id,
  );
  logAudit(actorId, "registration.updated", "registration", id, `Updated ${current.reference_code}`);
}

export async function updateRegistrationStatus(
  id: string,
  status: RegistrationStatus,
  actorId: string,
): Promise<void> {
  const current = await getRegistrationById(id);
  if (!current) throw new Error("Registration not found.");
  run("UPDATE registrations SET status = ?, updated_at = ? WHERE id = ?", status, nowIso(), id);
  if (status === "cancelled") {
    run(
      "UPDATE attendance SET status = 'no_show', updated_at = ? WHERE registration_id = ? AND arrival_time IS NULL",
      nowIso(),
      id,
    );
  }
  logAudit(
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
  run("DELETE FROM registrations WHERE id = ?", id);
  logAudit(actorId, "registration.deleted", "registration", id, `Deleted ${current.reference_code}`);
}

export async function listRecentRegistrations(limit = 6): Promise<RegistrationRow[]> {
  return rows<RawRow>(`${BASE_SELECT} ORDER BY r.created_at DESC LIMIT ?`, limit).map(mapRow);
}

export async function listUpcomingVisits(limit = 5): Promise<RegistrationRow[]> {
  return rows<RawRow>(
    `${BASE_SELECT} WHERE d.visit_date >= ? AND r.status IN ('pending','confirmed') ORDER BY d.visit_date ASC, r.created_at DESC LIMIT ?`,
    todayKigali(),
    limit,
  ).map(mapRow);
}

/* ------------------------------------------------------------------ */
/* Attendance                                                          */
/* ------------------------------------------------------------------ */

function ensureAttendance(registrationId: string): Attendance {
  const existing = row<RawRow>("SELECT * FROM attendance WHERE registration_id = ?", registrationId);
  if (existing) {
    return {
      id: String(existing.id),
      registration_id: String(existing.registration_id),
      arrival_time: (existing.arrival_time as string | null) ?? null,
      departure_time: (existing.departure_time as string | null) ?? null,
      status: existing.status as AttendanceStatus,
      recorded_by: (existing.recorded_by as string | null) ?? null,
      created_at: String(existing.created_at),
      updated_at: String(existing.updated_at),
    };
  }
  const now = nowIso();
  const id = newId();
  run(
    `INSERT INTO attendance (id, registration_id, status, created_at, updated_at) VALUES (?, ?, 'expected', ?, ?)`,
    id,
    registrationId,
    now,
    now,
  );
  return {
    id,
    registration_id: registrationId,
    arrival_time: null,
    departure_time: null,
    status: "expected",
    recorded_by: null,
    created_at: now,
    updated_at: now,
  };
}

export async function recordArrival(registrationId: string, actorId: string): Promise<void> {
  const registration = await getRegistrationById(registrationId);
  if (!registration) throw new Error("Registration not found.");
  if (registration.status === "cancelled") throw new Error("This registration has been cancelled.");
  const attendance = ensureAttendance(registrationId);
  if (attendance.arrival_time) throw new Error("Arrival has already been recorded for this visitor.");
  const now = nowIso();
  const updated = run(
    `UPDATE attendance SET arrival_time = ?, status = 'on_campus', recorded_by = ?, updated_at = ? WHERE registration_id = ? AND arrival_time IS NULL`,
    now,
    actorId,
    now,
    registrationId,
  );
  if (updated !== 1) throw new Error("Arrival was already recorded by another user.");
  if (registration.status === "pending") {
    run("UPDATE registrations SET status = 'confirmed', updated_at = ? WHERE id = ?", now, registrationId);
  }
  logAudit(actorId, "attendance.arrival", "registration", registrationId, `Arrival recorded for ${registration.reference_code}`);
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
  const attendance = ensureAttendance(registrationId);
  if (!attendance.arrival_time) throw new Error("Record the visitor's arrival before departure.");
  if (attendance.departure_time) {
    if (operationId && attendance.departure_operation_id === operationId) return;
    throw new Error("Departure has already been recorded for this visitor.");
  }
  const now = nowIso();
  const departureTime = departureAt ?? now;
  const updated = run(
    `UPDATE attendance SET departure_time = ?, departure_device_timezone = ?, departure_source = ?, sync_confirmed_at = ?, status = 'departed', departure_recorded_by = ?, departure_operation_id = ?, updated_at = ? WHERE registration_id = ? AND departure_time IS NULL`,
    departureTime,
    deviceTimezone ?? null,
    deviceTimezone ? "device" : "server",
    deviceTimezone ? now : null,
    actorId,
    operationId ?? null,
    now,
    registrationId,
  );
  if (updated !== 1) throw new Error("Departure was already recorded by another user.");
  run("UPDATE registrations SET status = 'completed', updated_at = ? WHERE id = ?", now, registrationId);
  logAudit(actorId, "attendance.departure", "registration", registrationId, `${departureAt ? "Offline " : ""}departure recorded for ${registration.reference_code}`);
}

export async function markNoShow(registrationId: string, actorId: string): Promise<void> {
  const registration = await getRegistrationById(registrationId);
  if (!registration) throw new Error("Registration not found.");
  const attendance = ensureAttendance(registrationId);
  if (attendance.arrival_time) throw new Error("This visitor already arrived; no-show cannot be recorded.");
  const now = nowIso();
  run(
    `UPDATE attendance SET status = 'no_show', recorded_by = ?, updated_at = ? WHERE registration_id = ?`,
    actorId,
    now,
    registrationId,
  );
  logAudit(actorId, "attendance.no_show", "registration", registrationId, `No-show for ${registration.reference_code}`);
}

export async function completeVisit(registrationId: string, actorId: string): Promise<void> {
  const registration = await getRegistrationById(registrationId);
  if (!registration) throw new Error("Registration not found.");
  const attendance = ensureAttendance(registrationId);
  const now = nowIso();
  if (attendance.arrival_time && !attendance.departure_time) {
    run(
      `UPDATE attendance SET departure_time = ?, status = 'departed', departure_recorded_by = ?, updated_at = ? WHERE registration_id = ? AND departure_time IS NULL`,
      now,
      actorId,
      now,
      registrationId,
    );
  }
  run("UPDATE registrations SET status = 'completed', updated_at = ? WHERE id = ?", now, registrationId);
  logAudit(actorId, "registration.completed", "registration", registrationId, `Completed ${registration.reference_code}`);
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

function notifyDeans(title: string, message: string, registrationId: string | null): void {
  const deans = rows<RawRow>(
    "SELECT id FROM profiles WHERE role_key = 'dean' AND is_active = 1 AND status = 'active' AND deleted_at IS NULL",
  );
  const now = nowIso();
  if (deans.length === 0) {
    run(
      `INSERT INTO notifications (id, title, message, registration_id, recipient_id, is_read, created_at)
       VALUES (?, ?, ?, ?, NULL, 0, ?)`,
      newId(),
      title,
      message,
      registrationId,
      now,
    );
    return;
  }
  for (const dean of deans) {
    run(
      `INSERT INTO notifications (id, title, message, registration_id, recipient_id, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      newId(),
      title,
      message,
      registrationId,
      String(dean.id),
      now,
    );
  }
}

export async function listNotifications(
  userId: string,
  includeAll = false,
  limit = 30,
): Promise<Notification[]> {
  const data = includeAll
    ? rows<RawRow>("SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?", limit)
    : rows<RawRow>(
        "SELECT * FROM notifications WHERE recipient_id = ? OR recipient_id IS NULL ORDER BY created_at DESC LIMIT ?",
        userId,
        limit,
      );
  return data.map((n) => ({
    id: String(n.id),
    title: String(n.title),
    message: String(n.message),
    registration_id: (n.registration_id as string | null) ?? null,
    recipient_id: (n.recipient_id as string | null) ?? null,
    is_read: Number(n.is_read) === 1,
    created_at: String(n.created_at),
  }));
}

export async function unreadNotificationCount(userId: string, includeAll = false): Promise<number> {
  const result = includeAll
    ? row<{ count: number }>("SELECT COUNT(*) AS count FROM notifications WHERE is_read = 0")
    : row<{ count: number }>(
        "SELECT COUNT(*) AS count FROM notifications WHERE is_read = 0 AND (recipient_id = ? OR recipient_id IS NULL)",
        userId,
      );
  return Number(result?.count ?? 0);
}

export async function markNotificationRead(
  id: string,
  userId: string,
  includeAll = false,
): Promise<void> {
  if (includeAll) {
    run("UPDATE notifications SET is_read = 1 WHERE id = ?", id);
  } else {
    run(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND (recipient_id = ? OR recipient_id IS NULL)",
      id,
      userId,
    );
  }
}

export async function markAllNotificationsRead(userId: string, includeAll = false): Promise<void> {
  if (includeAll) {
    run("UPDATE notifications SET is_read = 1 WHERE is_read = 0");
  } else {
    run(
      "UPDATE notifications SET is_read = 1 WHERE is_read = 0 AND (recipient_id = ? OR recipient_id IS NULL)",
      userId,
    );
  }
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export async function getDashboardData(
  date: string,
  user: SessionUser,
  includeAllNotifications = false,
): Promise<DashboardData> {
  const totalRegistrations = Number(
    row<{ count: number }>(
      "SELECT COUNT(*) AS count FROM registrations r JOIN visit_days d ON d.id = r.visit_day_id WHERE d.visit_date = ?",
      date,
    )?.count ?? 0,
  );
  const expectedVisitors = Number(
    row<{ count: number }>(
      "SELECT COUNT(*) AS count FROM registrations r JOIN visit_days d ON d.id = r.visit_day_id WHERE d.visit_date = ? AND r.status IN ('pending','confirmed')",
      date,
    )?.count ?? 0,
  );
  const arrived = Number(
    row<{ count: number }>(
      "SELECT COUNT(*) AS count FROM registrations r JOIN visit_days d ON d.id = r.visit_day_id JOIN attendance a ON a.registration_id = r.id WHERE d.visit_date = ? AND a.arrival_time IS NOT NULL",
      date,
    )?.count ?? 0,
  );
  const onCampus = Number(
    row<{ count: number }>(
      "SELECT COUNT(*) AS count FROM registrations r JOIN visit_days d ON d.id = r.visit_day_id JOIN attendance a ON a.registration_id = r.id WHERE d.visit_date = ? AND a.status = 'on_campus'",
      date,
    )?.count ?? 0,
  );
  const completed = Number(
    row<{ count: number }>(
      "SELECT COUNT(*) AS count FROM registrations r JOIN visit_days d ON d.id = r.visit_day_id JOIN attendance a ON a.registration_id = r.id WHERE d.visit_date = ? AND (r.status = 'completed' OR a.status = 'departed')",
      date,
    )?.count ?? 0,
  );
  const cancelled = Number(
    row<{ count: number }>(
      "SELECT COUNT(*) AS count FROM registrations r JOIN visit_days d ON d.id = r.visit_day_id WHERE d.visit_date = ? AND r.status = 'cancelled'",
      date,
    )?.count ?? 0,
  );
  const newRegistrations = Number(
    row<{ count: number }>(
      "SELECT COUNT(*) AS count FROM registrations r JOIN visit_days d ON d.id = r.visit_day_id WHERE d.visit_date = ? AND r.status = 'pending'",
      date,
    )?.count ?? 0,
  );
  const totalUpcoming = Number(
    row<{ count: number }>(
      "SELECT COUNT(*) AS count FROM registrations r JOIN visit_days d ON d.id = r.visit_day_id WHERE d.visit_date > ? AND r.status IN ('pending','confirmed')",
      date,
    )?.count ?? 0,
  );

  const notArrived = Math.max(0, expectedVisitors - arrived);

  const stats: DashboardStats = {
    date,
    totalRegistrations,
    expectedVisitors,
    arrived,
    notArrived,
    onCampus,
    completed,
    cancelled,
    newRegistrations,
    totalUpcoming,
  };

  const recent = rows<RawRow>(
    `${BASE_SELECT} WHERE d.visit_date = ? ORDER BY r.created_at DESC LIMIT 6`,
    date,
  ).map(mapRow);

  const upcoming = await listUpcomingVisits(5);

  const start = subDays(new Date(`${date}T12:00:00`), 6);
  const trendRows = rows<RawRow>(
    `SELECT d.visit_date AS date,
            COUNT(r.id) AS registrations,
            SUM(CASE WHEN a.arrival_time IS NOT NULL THEN 1 ELSE 0 END) AS arrivals
     FROM visit_days d
     LEFT JOIN registrations r ON r.visit_day_id = d.id
     LEFT JOIN attendance a ON a.registration_id = r.id
     WHERE d.visit_date BETWEEN ? AND ?
     GROUP BY d.visit_date
     ORDER BY d.visit_date ASC`,
    format(start, "yyyy-MM-dd"),
    date,
  );
  const trendMap = new Map(trendRows.map((t) => [String(t.date), t]));
  const trend: TrendPoint[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = subDays(new Date(`${date}T12:00:00`), i);
    const key = format(d, "yyyy-MM-dd");
    const found = trendMap.get(key);
    trend.push({
      date: key,
      label: format(d, "EEE"),
      registrations: Number(found?.registrations ?? 0),
      arrivals: Number(found?.arrivals ?? 0),
    });
  }

  const statusRows = rows<RawRow>(
    `SELECT r.status, COUNT(*) AS count FROM registrations r JOIN visit_days d ON d.id = r.visit_day_id WHERE d.visit_date = ? GROUP BY r.status`,
    date,
  );
  const statusBreakdown = (["pending", "confirmed", "cancelled", "completed"] as RegistrationStatus[]).map(
    (status) => ({
      status,
      count: Number(statusRows.find((s) => s.status === status)?.count ?? 0),
    }),
  );

  const notifications = await listNotifications(user.id, includeAllNotifications, 8);
  const unreadNotifications = await unreadNotificationCount(user.id, includeAllNotifications);

  return { stats, recent, upcoming, trend, statusBreakdown, notifications, unreadNotifications };
}

/* ------------------------------------------------------------------ */
/* Staff                                                               */
/* ------------------------------------------------------------------ */

export async function listStaff(): Promise<Profile[]> {
  return rows<RawRow>(
    "SELECT * FROM profiles WHERE deleted_at IS NULL ORDER BY role_key ASC, full_name ASC",
  ).map(mapProfile);
}

export async function getProfileById(id: string): Promise<Profile | null> {
  const raw = row<RawRow>("SELECT * FROM profiles WHERE id = ?", id);
  return raw ? mapProfile(raw) : null;
}

export async function getProfileByEmail(email: string): Promise<Profile | null> {
  const raw = row<RawRow>("SELECT * FROM profiles WHERE lower(email) = lower(?)", email);
  return raw ? mapProfile(raw) : null;
}

function baseRoleFor(roleKey: string): Role {
  return roleKey === "dean" ? "dean" : "admin";
}

function activeAdminCount(): number {
  const result = row<{ count: number }>(
    "SELECT COUNT(*) AS count FROM profiles WHERE role_key = 'admin' AND is_active = 1 AND status = 'active' AND deleted_at IS NULL",
  );
  return Number(result?.count ?? 0);
}

export async function verifyLocalCredentials(
  email: string,
  password: string,
): Promise<SessionUser | null> {
  const raw = row<RawRow>("SELECT * FROM profiles WHERE lower(email) = lower(?)", email);
  if (!raw || Number(raw.is_active) !== 1 || raw.deleted_at || raw.status !== "active") return null;
  const hash = raw.password_hash ? String(raw.password_hash) : null;
  if (!hash || !bcrypt.compareSync(password, hash)) return null;
  const now = nowIso();
  run("UPDATE profiles SET last_login_at = ?, updated_at = ? WHERE id = ?", now, now, String(raw.id));
  const profile = mapProfile(raw);
  const [permissions, roleName] = await Promise.all([
    getEffectivePermissionsForProfile(profile),
    roleNameFor(profile.role_key),
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

export async function createStaff(input: StaffInput): Promise<Profile> {
  const existing = await getProfileByEmail(input.email);
  if (existing) throw new Error("A staff member with this email already exists.");
  const roleKey = input.role;
  const role = await getRole(roleKey);
  if (!role) throw new Error("The selected role does not exist.");
  const id = newId();
  const now = nowIso();
  run(
    `INSERT INTO profiles (id, full_name, email, role, role_key, status, is_active, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'active', 1, ?, ?, ?)`,
    id,
    input.full_name,
    input.email.toLowerCase(),
    baseRoleFor(roleKey),
    roleKey,
    bcrypt.hashSync(input.password, 10),
    now,
    now,
  );
  return (await getProfileById(id)) as Profile;
}

export async function signupPrefect(input: PrefectSignupInput): Promise<void> {
  const existing = await getProfileByEmail(input.email);
  if (existing) throw new Error("An account already exists for this email address.");
  const now = nowIso();
  run(
    `INSERT INTO profiles (id, full_name, email, phone_number, role, role_key, status, is_active, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'admin', 'prefect', 'suspended', 0, ?, ?, ?)`,
    newId(),
    input.full_name,
    input.email.toLowerCase(),
    input.phone_number,
    bcrypt.hashSync(input.password, 10),
    now,
    now,
  );
}

export async function updateStaffProfile(
  id: string,
  input: { full_name: string; email: string },
): Promise<void> {
  const target = await getProfileById(id);
  if (!target) throw new Error("Staff member not found.");
  const email = input.email.toLowerCase();
  const clash = row<{ id: string }>(
    "SELECT id FROM profiles WHERE lower(email) = lower(?) AND id != ?",
    email,
    id,
  );
  if (clash) throw new Error("Another staff member already uses this email address.");
  run(
    "UPDATE profiles SET full_name = ?, email = ?, updated_at = ? WHERE id = ?",
    input.full_name,
    email,
    nowIso(),
    id,
  );
}

export async function updateStaffRole(id: string, roleKey: Role): Promise<void> {
  const target = await getProfileById(id);
  if (!target) throw new Error("Staff member not found.");
  const role = await getRole(roleKey);
  if (!role) throw new Error("The selected role does not exist.");
  if (target.role_key === "admin" && roleKey !== "admin" && activeAdminCount() <= 1) {
    throw new Error("At least one active Super Administrator is required.");
  }
  run(
    "UPDATE profiles SET role_key = ?, role = ?, updated_at = ? WHERE id = ?",
    roleKey,
    baseRoleFor(roleKey),
    nowIso(),
    id,
  );
}

export async function setStaffStatus(id: string, status: UserStatus): Promise<void> {
  const target = await getProfileById(id);
  if (!target) throw new Error("Staff member not found.");
  if (target.role_key === "admin" && status !== "active" && activeAdminCount() <= 1) {
    throw new Error("At least one active Super Administrator is required.");
  }
  run(
    "UPDATE profiles SET status = ?, is_active = ?, updated_at = ? WHERE id = ?",
    status,
    status === "active" ? 1 : 0,
    nowIso(),
    id,
  );
}

export async function setStaffActive(id: string, active: boolean): Promise<void> {
  await setStaffStatus(id, active ? "active" : "suspended");
}

export async function deleteStaff(id: string, actorId: string): Promise<void> {
  const target = await getProfileById(id);
  if (!target) throw new Error("Staff member not found.");
  if (target.role_key === "admin" && activeAdminCount() <= 1) {
    throw new Error("The last active Super Administrator cannot be deleted.");
  }
  const now = nowIso();
  run(
    "UPDATE profiles SET deleted_at = ?, status = 'disabled', is_active = 0, updated_at = ? WHERE id = ?",
    now,
    now,
    id,
  );
  await logAudit(actorId, "user.deleted", "profile", id, `Deleted ${target.full_name} (${target.email})`);
}

export async function resetStaffPassword(id: string, password: string): Promise<void> {
  const target = await getProfileById(id);
  if (!target) throw new Error("Staff member not found.");
  run(
    "UPDATE profiles SET password_hash = ?, updated_at = ? WHERE id = ?",
    bcrypt.hashSync(password, 10),
    nowIso(),
    id,
  );
}

/* ------------------------------------------------------------------ */
/* Roles & permissions                                                 */
/* ------------------------------------------------------------------ */

export async function listRoles(): Promise<RoleRecord[]> {
  return rows<RawRow>("SELECT * FROM roles ORDER BY is_system DESC, name ASC").map(mapRole);
}

export async function getRole(key: string): Promise<RoleRecord | null> {
  const raw = row<RawRow>("SELECT * FROM roles WHERE key = ?", key);
  return raw ? mapRole(raw) : null;
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
  const now = nowIso();
  run(
    "INSERT INTO roles (key, name, description, is_system, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)",
    input.key,
    input.name,
    input.description,
    now,
    now,
  );
  return (await getRole(input.key)) as RoleRecord;
}

export async function updateRole(
  key: string,
  input: { name: string; description: string },
): Promise<void> {
  const role = await getRole(key);
  if (!role) throw new Error("Role not found.");
  run(
    "UPDATE roles SET name = ?, description = ?, updated_at = ? WHERE key = ?",
    input.name,
    input.description,
    nowIso(),
    key,
  );
}

export async function deleteRole(key: string): Promise<void> {
  const role = await getRole(key);
  if (!role) throw new Error("Role not found.");
  if (role.is_system) throw new Error("System roles cannot be deleted.");
  const users = row<{ count: number }>(
    "SELECT COUNT(*) AS count FROM profiles WHERE role_key = ? AND deleted_at IS NULL",
    key,
  );
  if (Number(users?.count ?? 0) > 0) {
    throw new Error("This role is still assigned to users. Reassign them before deleting it.");
  }
  run("DELETE FROM roles WHERE key = ?", key);
}

export async function listRolePermissions(roleKey: string): Promise<PermissionKey[]> {
  if (roleKey === "admin") return computePermissions("admin", []);
  return rows<{ permission_key: string }>(
    "SELECT permission_key FROM role_permissions WHERE role_key = ?",
    roleKey,
  ).map((entry) => entry.permission_key);
}

export async function listRolePermissionMap(): Promise<Record<string, PermissionKey[]>> {
  const data = rows<{ role_key: string; permission_key: string }>(
    "SELECT role_key, permission_key FROM role_permissions",
  );
  const map: Record<string, PermissionKey[]> = {};
  for (const entry of data) {
    map[entry.role_key] ??= [];
    map[entry.role_key].push(entry.permission_key);
  }
  return map;
}

export async function setRolePermissions(roleKey: string, permissionKeys: PermissionKey[]): Promise<void> {
  const role = await getRole(roleKey);
  if (!role) throw new Error("Role not found.");
  if (roleKey === "admin") throw new Error("Super Administrator always has every permission.");
  run("DELETE FROM role_permissions WHERE role_key = ?", roleKey);
  for (const key of permissionKeys) {
    run(
      "INSERT OR IGNORE INTO role_permissions (role_key, permission_key) VALUES (?, ?)",
      roleKey,
      key,
    );
  }
}

export async function getUserPermissionOverrides(userId: string): Promise<UserPermissionOverride[]> {
  return rows<{ permission_key: string; allowed: number }>(
    "SELECT permission_key, allowed FROM user_permissions WHERE user_id = ?",
    userId,
  ).map((entry) => ({ permission_key: entry.permission_key, allowed: Number(entry.allowed) === 1 }));
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
  run("DELETE FROM user_permissions WHERE user_id = ?", userId);
  for (const override of overrides) {
    run(
      "INSERT OR REPLACE INTO user_permissions (user_id, permission_key, allowed) VALUES (?, ?, ?)",
      userId,
      override.permission_key,
      override.allowed ? 1 : 0,
    );
  }
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
  run(
    `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, details, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    newId(),
    actorId,
    action,
    entityType,
    entityId,
    details,
    status,
    nowIso(),
  );
}

export async function listAuditLogs(limit = 50): Promise<AuditLog[]> {
  const data = rows<RawRow>(
    `SELECT al.*, p.full_name AS actor_name FROM audit_logs al
     LEFT JOIN profiles p ON p.id = al.actor_id
     ORDER BY al.created_at DESC LIMIT ?`,
    limit,
  );
  return data.map((a) => ({
    id: String(a.id),
    actor_id: (a.actor_id as string | null) ?? null,
    action: String(a.action),
    entity_type: String(a.entity_type),
    entity_id: (a.entity_id as string | null) ?? null,
    details: (a.details as string | null) ?? null,
    status: (a.status as AuditStatus) ?? "success",
    created_at: String(a.created_at),
    actor_name: (a.actor_name as string | null) ?? null,
  }));
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

export async function getReportRows(date: string): Promise<RegistrationRow[]> {
  return getReportRowsByFilters({ dateFrom: date, dateTo: date });
}

export async function getReportRowsByFilters(filters: ReportFilters): Promise<RegistrationRow[]> {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filters.dateFrom) {
    where.push("d.visit_date >= ?");
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    where.push("d.visit_date <= ?");
    params.push(filters.dateTo);
  }
  if (filters.className) {
    where.push("lower(s.class_name) LIKE ?");
    params.push(`%${filters.className.toLowerCase()}%`);
  }
  if (filters.student) {
    const term = `%${filters.student.toLowerCase()}%`;
    where.push("(lower(s.full_name) LIKE ? OR lower(s.registration_number) LIKE ?)");
    params.push(term, term);
  }
  if (filters.visitor) {
    const term = `%${filters.visitor.toLowerCase()}%`;
    where.push("(lower(v.full_name) LIKE ? OR v.phone LIKE ?)");
    params.push(term, term);
  }
  if (filters.status) {
    where.push("r.status = ?");
    params.push(filters.status);
  }
  if (filters.attendance) {
    where.push("COALESCE(a.status, 'expected') = ?");
    params.push(filters.attendance);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return rows<RawRow>(
    `${BASE_SELECT} ${whereSql} ORDER BY d.visit_date DESC, v.full_name ASC LIMIT 5000`,
    ...params,
  ).map(mapRow);
}

/* ------------------------------------------------------------------ */
/* Archive                                                             */
/* ------------------------------------------------------------------ */

export async function archiveRegistration(id: string, actorId: string): Promise<void> {
  const registration = await getRegistrationById(id);
  if (!registration) throw new Error("Registration not found.");
  const now = nowIso();
  const snapshot = JSON.stringify(registration);
  run(
    `INSERT INTO archived_records (id, registration_id, reference_code, visitor_name, student_name, visit_date, snapshot, archived_by, archived_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    newId(),
    registration.id,
    registration.reference_code,
    registration.visitor.full_name,
    registration.student.full_name,
    registration.visit_day.visit_date,
    snapshot,
    actorId,
    now,
  );
  run("DELETE FROM registrations WHERE id = ?", id);
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
  return rows<RawRow>(
    `SELECT ar.*, p.full_name AS archived_by_name FROM archived_records ar
     LEFT JOIN profiles p ON p.id = ar.archived_by
     ORDER BY ar.archived_at DESC LIMIT ?`,
    limit,
  ).map((raw) => ({
    id: String(raw.id),
    registration_id: String(raw.registration_id),
    reference_code: String(raw.reference_code),
    visitor_name: String(raw.visitor_name),
    student_name: String(raw.student_name),
    visit_date: String(raw.visit_date),
    archived_at: String(raw.archived_at),
    archived_by: (raw.archived_by as string | null) ?? null,
    archived_by_name: (raw.archived_by_name as string | null) ?? null,
    snapshot: String(raw.snapshot),
  }));
}

export async function restoreArchivedRecord(archiveId: string, actorId: string): Promise<void> {
  const raw = row<RawRow>("SELECT * FROM archived_records WHERE id = ?", archiveId);
  if (!raw) throw new Error("Archived record not found.");
  const snapshot = JSON.parse(String(raw.snapshot)) as RegistrationRow;
  const registration = snapshot;
  const clash = row<{ id: string }>(
    "SELECT id FROM registrations WHERE reference_code = ? OR id = ?",
    registration.reference_code,
    registration.id,
  );
  if (clash) throw new Error("A registration with this reference already exists.");

  run(
    `INSERT INTO registrations (id, reference_code, visitor_id, student_id, visit_day_id, purpose, message, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    registration.id,
    registration.reference_code,
    registration.visitor_id,
    registration.student_id,
    registration.visit_day_id,
    registration.purpose,
    registration.message,
    registration.status,
    registration.created_at,
    registration.updated_at,
  );

  if (registration.attendance) {
    run(
      `INSERT OR IGNORE INTO attendance (id, registration_id, arrival_time, departure_time, status, recorded_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      registration.attendance.id,
      registration.id,
      registration.attendance.arrival_time,
      registration.attendance.departure_time,
      registration.attendance.status,
      registration.attendance.recorded_by,
      registration.attendance.created_at,
      registration.attendance.updated_at,
    );
  } else {
    run(
      `INSERT OR IGNORE INTO attendance (id, registration_id, status, created_at, updated_at)
       VALUES (?, ?, 'expected', ?, ?)`,
      newId(),
      registration.id,
      nowIso(),
      nowIso(),
    );
  }

  run("DELETE FROM archived_records WHERE id = ?", archiveId);
  await logAudit(
    actorId,
    "record.restored",
    "registration",
    registration.id,
    `Restored ${registration.reference_code} (${registration.visitor.full_name})`,
  );
}

export async function deleteArchivedRecord(archiveId: string, actorId: string): Promise<void> {
  const raw = row<RawRow>("SELECT * FROM archived_records WHERE id = ?", archiveId);
  if (!raw) throw new Error("Archived record not found.");
  run("DELETE FROM archived_records WHERE id = ?", archiveId);
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

export async function getEmailSettings(): Promise<EmailSettings> {
  const raw = row<RawRow>("SELECT * FROM email_settings WHERE id = 'default'");
  if (raw) return mapEmailSettings(raw);
  const now = nowIso();
  run(
    `INSERT INTO email_settings (id, dean_name, dean_email, cc_email, email_enabled, default_format, auto_enabled, auto_time, auto_format, last_sent_date, updated_at)
     VALUES ('default', 'Dean of Discipline', ?, '', 0, 'pdf', 0, '17:00', 'pdf', NULL, ?)`,
    process.env.DEAN_EMAIL || "dean@mubiligi.rw",
    now,
  );
  return (await getEmailSettings()) as EmailSettings;
}

export async function updateEmailSettings(
  input: Omit<EmailSettings, "id" | "last_sent_date" | "updated_at">,
): Promise<void> {
  await getEmailSettings();
  run(
    `UPDATE email_settings SET dean_name = ?, dean_email = ?, cc_email = ?, email_enabled = ?,
     default_format = ?, auto_enabled = ?, auto_time = ?, auto_format = ?, updated_at = ?
     WHERE id = 'default'`,
    input.dean_name,
    input.dean_email,
    input.cc_email,
    input.email_enabled ? 1 : 0,
    input.default_format,
    input.auto_enabled ? 1 : 0,
    input.auto_time,
    input.auto_format,
    nowIso(),
  );
}

export async function setEmailLastSent(date: string): Promise<void> {
  await getEmailSettings();
  run("UPDATE email_settings SET last_sent_date = ?, updated_at = ? WHERE id = 'default'", date, nowIso());
}

export async function recordReportHistory(
  input: Omit<ReportHistory, "id" | "created_at" | "actor_name">,
): Promise<void> {
  run(
    `INSERT INTO report_history (id, sent_to, cc, format, date_from, date_to, row_count, status, error, triggered_by, actor_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    newId(),
    input.sent_to,
    input.cc || null,
    input.format,
    input.date_from,
    input.date_to,
    input.row_count,
    input.status,
    input.error,
    input.triggered_by,
    input.actor_id,
    nowIso(),
  );
}

export async function listReportHistory(limit = 50): Promise<ReportHistory[]> {
  return rows<RawRow>(
    `SELECT rh.*, p.full_name AS actor_name FROM report_history rh
     LEFT JOIN profiles p ON p.id = rh.actor_id
     ORDER BY rh.created_at DESC LIMIT ?`,
    limit,
  ).map((raw) => ({
    id: String(raw.id),
    sent_to: String(raw.sent_to),
    cc: (raw.cc as string | null) ?? null,
    format: raw.format as EmailFormat,
    date_from: (raw.date_from as string | null) ?? null,
    date_to: (raw.date_to as string | null) ?? null,
    row_count: Number(raw.row_count ?? 0),
    status: raw.status as ReportHistory["status"],
    error: (raw.error as string | null) ?? null,
    triggered_by: raw.triggered_by as ReportHistory["triggered_by"],
    actor_id: (raw.actor_id as string | null) ?? null,
    actor_name: (raw.actor_name as string | null) ?? null,
    created_at: String(raw.created_at),
  }));
}

export async function getVisitDayByDate(date: string): Promise<VisitDay | null> {
  const raw = row<RawRow>("SELECT * FROM visit_days WHERE visit_date = ? ORDER BY created_at DESC LIMIT 1", date);
  return raw ? mapVisitDay(raw) : null;
}

export async function getRegistrationSummaryByStatus(): Promise<Record<string, number>> {
  const data = rows<RawRow>("SELECT status, COUNT(*) AS count FROM registrations GROUP BY status");
  return Object.fromEntries(data.map((d) => [String(d.status), Number(d.count)]));
}

export function localStatusLabel(status: string): string {
  return REGISTRATION_STATUS_LABEL[status as RegistrationStatus] ?? status;
}

export function localPurposeLabel(purpose: string): string {
  return PURPOSE_LABEL[purpose as keyof typeof PURPOSE_LABEL] ?? purpose;
}

export const localDbPath = () => {
  const db = getDb();
  return db;
};

export async function markLogin(id: string): Promise<void> {
  const now = nowIso();
  run("UPDATE profiles SET last_login_at = ?, updated_at = ? WHERE id = ?", now, now, id);
}
