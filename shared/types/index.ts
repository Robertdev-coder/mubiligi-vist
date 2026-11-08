/* ------------------------------------------------------------------ */
/* MUBILIGI VISIT DAY — domain types                                   */
/* Mirrors the SQLite schema in backend/db/sqlite.ts and the           */
/* Supabase migrations in supabase/migrations/.                        */
/* ------------------------------------------------------------------ */

export type Role =
  | "admin"
  | "dean"
  | "prefect"
  | "registration_staff"
  | "readonly_staff";

export type UserStatus = "active" | "suspended" | "disabled";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type AttendanceStatus =
  | "expected"
  | "arrived"
  | "on_campus"
  | "departed"
  | "no_show";

export type Relationship = "parent" | "guardian" | "relative" | "other";

export type RegistrationStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type Purpose =
  | "academic"
  | "discipline"
  | "financial"
  | "welfare"
  | "consultation"
  | "other";

export type Trade = "SOD" | "MMP" | "CSA" | "NIT";

export type Level = "L3" | "L4" | "L5";

export type EmailFormat = "pdf" | "docx";

export type AuditStatus = "success" | "failure";

export type TimestampSource = "server" | "device";

export type PermissionKey =
  | "dashboard.view"
  | "registrations.view"
  | "registrations.create"
  | "registrations.edit"
  | "registrations.delete"
  | "attendance.view"
  | "attendance.create"
  | "attendance.edit"
  | "attendance.delete"
  | "reports.view"
  | "reports.generate"
  | "reports.export"
  | "reports.print"
  | "reports.email"
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.delete"
  | "roles.manage"
  | "permissions.assign"
  | "settings.manage"
  | "audit.view"
  | "records.archive"
  | "records.restore"
  | "records.delete";

export interface PermissionDef {
  key: PermissionKey;
  label: string;
  group: string;
  description: string;
}

export interface RoleRecord {
  key: string;
  name: string;
  description: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/* Accounts                                                            */
/* ------------------------------------------------------------------ */

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  /** Coarse workspace role (admin | dean). Derived from role_key. */
  role: Role;
  /** Exact role key from the roles table (admin, dean, prefect, …). */
  role_key: string;
  status: UserStatus;
  is_active: boolean;
  last_login_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionUser {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  role_name: string;
  permissions: PermissionKey[];
  status: UserStatus;
}

export interface UserPermissionOverride {
  permission_key: PermissionKey;
  allowed: boolean;
}

/* ------------------------------------------------------------------ */
/* Visit days                                                          */
/* ------------------------------------------------------------------ */

export interface VisitDay {
  id: string;
  title: string;
  visit_date: string;
  registration_open: string;
  registration_close: string;
  is_active: boolean;
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/* Visitors & students                                                 */
/* ------------------------------------------------------------------ */

export interface Visitor {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  national_id: string | null;
  relationship: Relationship;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  registration_number: string;
  full_name: string;
  trade: Trade;
  level: Level;
  class_name: string;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/* Registrations                                                       */
/* ------------------------------------------------------------------ */

export interface Registration {
  id: string;
  reference_code: string;
  visitor_id: string;
  student_id: string;
  visit_day_id: string;
  purpose: Purpose;
  message: string | null;
  status: RegistrationStatus;
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  registration_id: string;
  arrival_time: string | null;
  arrival_device_timezone: string | null;
  arrival_source: TimestampSource;
  departure_time: string | null;
  departure_device_timezone: string | null;
  departure_source: TimestampSource | null;
  sync_confirmed_at: string | null;
  status: AttendanceStatus;
  recorded_by: string | null;
  departure_recorded_by: string | null;
  departure_operation_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegistrationRow extends Registration {
  visitor: Visitor;
  student: Student;
  visit_day: VisitDay;
  attendance: Attendance | null;
  recorded_by_name: string | null;
  departure_recorded_by_name: string | null;
}

export interface RegistrationFilters {
  search?: string;
  status?: string;
  trade?: string;
  level?: string;
  className?: string;
  visitDate?: string;
  attendance?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  direction?: "asc" | "desc";
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export interface DashboardStats {
  date: string;
  totalRegistrations: number;
  expectedVisitors: number;
  arrived: number;
  notArrived: number;
  onCampus: number;
  completed: number;
  cancelled: number;
  newRegistrations: number;
  totalUpcoming: number;
}

export interface TrendPoint {
  date: string;
  label: string;
  registrations: number;
  arrivals: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  registration_id: string | null;
  recipient_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recent: RegistrationRow[];
  upcoming: RegistrationRow[];
  trend: TrendPoint[];
  statusBreakdown: { status: RegistrationStatus; count: number }[];
  notifications: Notification[];
  unreadNotifications: number;
}

/* ------------------------------------------------------------------ */
/* Reports & archive                                                   */
/* ------------------------------------------------------------------ */

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  className?: string;
  student?: string;
  visitor?: string;
  status?: string;
  attendance?: string;
}

export interface ReportMeta {
  title: string;
  period_label: string;
  generated_at: string;
  generated_by: string;
  filters_label: string;
  row_count: number;
}

export interface ReportHistory {
  id: string;
  sent_to: string;
  cc: string | null;
  format: EmailFormat;
  date_from: string | null;
  date_to: string | null;
  row_count: number;
  status: "success" | "failed";
  error: string | null;
  triggered_by: "manual" | "auto";
  actor_id: string | null;
  actor_name: string | null;
  created_at: string;
}

export interface EmailSettings {
  id: string;
  dean_name: string;
  dean_email: string;
  cc_email: string;
  email_enabled: boolean;
  default_format: EmailFormat;
  auto_enabled: boolean;
  auto_time: string;
  auto_format: EmailFormat;
  last_sent_date: string | null;
  updated_at: string;
}

export interface ArchivedRecord {
  id: string;
  registration_id: string;
  reference_code: string;
  visitor_name: string;
  student_name: string;
  visit_date: string;
  archived_at: string;
  archived_by: string | null;
  archived_by_name: string | null;
  snapshot: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  status: AuditStatus;
  created_at: string;
  actor_name: string | null;
}
