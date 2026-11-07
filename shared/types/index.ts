/* ------------------------------------------------------------------ */
/* MUBILIGI VISIT DAY — domain types                                   */
/* ------------------------------------------------------------------ */

export type Role = "prefect" | "dean" | "admin";

export type UserStatus = "active" | "inactive";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type AttendanceStatus = "present" | "departed";

export type Relationship = "parent" | "guardian" | "other";

export type SyncState = "synced" | "pending" | "conflict" | "error";

export type SessionStatus = "active" | "closed";

export type TimestampSource = "server" | "device";

export type AnnouncementCategory =
  | "general"
  | "visit_day"
  | "attendance"
  | "instructions"
  | "system"
  | "dean";

export type AnnouncementPriority = "normal" | "high" | "urgent";

export type ConversationType = "direct" | "group";

export type PermissionKey =
  | "dashboard.view"
  | "attendance.view"
  | "attendance.create"
  | "attendance.depart"
  | "attendance.edit"
  | "attendance.delete"
  | "sessions.view"
  | "sessions.manage"
  | "reports.view"
  | "reports.export"
  | "reports.print"
  | "reports.email"
  | "announcements.view"
  | "announcements.manage"
  | "messages.view"
  | "users.manage"
  | "settings.manage"
  | "audit.view"
  | "sync.resolve"
  | "records.archive"
  | "records.restore"
  | "records.delete";

/* ------------------------------------------------------------------ */
/* Accounts                                                            */
/* ------------------------------------------------------------------ */

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: Role;
  status: UserStatus;
  approval_status: ApprovalStatus;
  is_active: boolean;
  last_login_at: string | null;
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
  phone_number: string | null;
}

export interface ProfileUpdateInput {
  full_name: string;
  phone_number: string;
}

/* ------------------------------------------------------------------ */
/* Visit Day sessions                                                  */
/* ------------------------------------------------------------------ */

export interface VisitDaySession {
  id: string;
  title: string;
  visit_date: string;
  status: SessionStatus;
  notes: string | null;
  created_by: string | null;
  closed_by: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionWithCounts extends VisitDaySession {
  total_records: number;
  present_count: number;
  departed_count: number;
  created_by_name?: string | null;
  closed_by_name?: string | null;
}

export interface SessionInput {
  title: string;
  visit_date: string;
  notes?: string;
  status?: SessionStatus;
}

/* ------------------------------------------------------------------ */
/* Attendance                                                          */
/* ------------------------------------------------------------------ */

export interface AttendanceRecord {
  id: string;
  visit_day_session_id: string;
  parent_name: string;
  phone_number: string;
  student_name: string;
  student_class: string;
  relationship: Relationship;
  arrival_at: string;
  departure_at: string | null;
  status: AttendanceStatus;
  registered_by: string | null;
  departure_recorded_by: string | null;
  arrival_source: TimestampSource;
  departure_source: TimestampSource | null;
  device_timezone: string | null;
  client_created_at: string | null;
  synced_at: string | null;
  sync_operation_id: string | null;
  sync_state: SyncState;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRow extends AttendanceRecord {
  registered_by_name: string | null;
  departure_recorded_by_name: string | null;
  session_title: string;
  visit_date: string;
  /** True when both timestamps were captured on a device and later synchronised. */
  is_offline_origin: boolean;
}

export interface AttendanceInput {
  parent_name: string;
  phone_number: string;
  student_name: string;
  student_class: string;
  relationship: Relationship;
}

export interface AttendanceCorrectionInput {
  parent_name: string;
  phone_number: string;
  student_name: string;
  student_class: string;
  relationship: Relationship;
  arrival_at: string;
  departure_at: string | null;
  status: AttendanceStatus;
}

export interface AttendanceFilters {
  search?: string;
  studentClass?: string;
  status?: AttendanceStatus | "all";
  relationship?: Relationship | "all";
  sessionId?: string;
  visitDate?: string;
  page?: number;
  pageSize?: number;
  sort?: "arrival" | "parent" | "student" | "class" | "status";
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
/* Offline synchronisation                                             */
/* ------------------------------------------------------------------ */

export type SyncOperationType = "create" | "depart" | "edit";

export interface SyncOperationResult {
  operation_id: string;
  local_id: string;
  status: "applied" | "duplicate" | "conflict" | "rejected";
  record?: AttendanceRow;
  message?: string;
}

export interface SyncBatchResponse {
  results: SyncOperationResult[];
  synced_at: string;
}

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  published_by: string | null;
  published_at: string | null;
  expires_at: string | null;
  is_pinned: boolean;
  is_published: boolean;
  recipient_roles: Role[];
  created_at: string;
  updated_at: string;
}

export interface AnnouncementRow extends Announcement {
  author_name: string | null;
  is_read: boolean;
}

export interface AnnouncementInput {
  title: string;
  content: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  is_pinned: boolean;
  is_published: boolean;
  recipient_roles: Role[];
  expires_at?: string | null;
}

/* ------------------------------------------------------------------ */
/* Messaging                                                           */
/* ------------------------------------------------------------------ */

export interface Conversation {
  id: string;
  conversation_type: ConversationType;
  title: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberSummary {
  user_id: string;
  full_name: string;
  role: Role;
}

export interface ConversationSummary extends Conversation {
  display_title: string;
  members: MemberSummary[];
  last_message: string | null;
  last_message_at: string | null;
  last_sender_name: string | null;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface MessageRow extends Message {
  sender_name: string;
  sender_role: Role;
}

/* ------------------------------------------------------------------ */
/* Audit                                                               */
/* ------------------------------------------------------------------ */

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  created_at: string;
  actor_name: string | null;
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export interface SchoolSettings {
  id: string;
  school_name: string;
  logo_url: string | null;
  address: string;
  contact_information: string;
  timezone: string;
  report_settings: string;
  email_settings: string;
  updated_at: string;
}

export interface ReportSettings {
  report_title: string;
  footer_note: string;
  default_format: "pdf" | "docx";
}

export interface ReportEmailSettings {
  provider: "smtp";
  sender_name: string;
  sender_email: string;
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export interface DashboardSummary {
  session: VisitDaySession | null;
  total_registered: number;
  present: number;
  departed: number;
  students_visited: number;
  pending_sync: number;
  recent_arrivals: AttendanceRow[];
  recent_departures: AttendanceRow[];
}

export interface LiveCounts {
  total_registered: number;
  present: number;
  departed: number;
  unread_announcements: number;
  unread_messages: number;
  session_status: SessionStatus | "none";
  session_id: string | null;
  server_time: string;
}

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

export interface ReportSummary {
  total_registered: number;
  present: number;
  departed: number;
  students_visited: number;
}

export interface ReportData {
  title: string;
  school_name: string;
  school_address: string;
  visit_date: string;
  session_title: string;
  generated_at: string;
  generated_by: string;
  rows: AttendanceRow[];
  summary: ReportSummary;
  footer_note: string;
}

export interface ReportRequest {
  sessionId: string;
  status?: AttendanceStatus | "all";
  studentClass?: string;
}
