import "server-only";
import type {
  Announcement,
  AnnouncementCategory,
  AnnouncementPriority,
  AttendanceRecord,
  AttendanceRow,
  AttendanceStatus,
  AuditLog,
  Conversation,
  ConversationType,
  Profile,
  Relationship,
  Role,
  SessionStatus,
  SyncState,
  TimestampSource,
  VisitDaySession,
} from "@/shared/types";

export type RawRow = Record<string, string | number | bigint | null>;

const str = (value: RawRow[string]): string =>
  value === null || value === undefined ? "" : String(value);
const nullableStr = (value: RawRow[string]): string | null =>
  value === null || value === undefined ? null : String(value);
const bool = (value: RawRow[string]): boolean => Number(value ?? 0) === 1;

export function mapProfile(raw: RawRow): Profile {
  return {
    id: str(raw.id),
    full_name: str(raw.full_name),
    email: str(raw.email),
    phone_number: nullableStr(raw.phone_number),
    role: str(raw.role) as Role,
    status: str(raw.status) as Profile["status"],
    approval_status: str(raw.approval_status) as Profile["approval_status"],
    is_active: bool(raw.is_active),
    last_login_at: nullableStr(raw.last_login_at),
    created_at: str(raw.created_at),
    updated_at: str(raw.updated_at),
  };
}

export function mapSession(raw: RawRow): VisitDaySession {
  return {
    id: str(raw.id),
    title: str(raw.title),
    visit_date: str(raw.visit_date),
    status: str(raw.status) as SessionStatus,
    notes: nullableStr(raw.notes),
    created_by: nullableStr(raw.created_by),
    closed_by: nullableStr(raw.closed_by),
    closed_at: nullableStr(raw.closed_at),
    created_at: str(raw.created_at),
    updated_at: str(raw.updated_at),
  };
}

export function mapAttendance(raw: RawRow): AttendanceRow {
  const arrivalSource = (str(raw.arrival_source) || "server") as TimestampSource;
  const departureSource = (nullableStr(raw.departure_source) as TimestampSource | null) ?? null;

  const record: AttendanceRecord = {
    id: str(raw.id),
    visit_day_session_id: str(raw.visit_day_session_id),
    parent_name: str(raw.parent_name),
    phone_number: str(raw.phone_number),
    student_name: str(raw.student_name),
    student_class: str(raw.student_class),
    relationship: str(raw.relationship) as Relationship,
    arrival_at: str(raw.arrival_at),
    departure_at: nullableStr(raw.departure_at),
    status: str(raw.status) as AttendanceStatus,
    registered_by: nullableStr(raw.registered_by),
    departure_recorded_by: nullableStr(raw.departure_recorded_by),
    arrival_source: arrivalSource,
    departure_source: departureSource,
    device_timezone: nullableStr(raw.device_timezone),
    client_created_at: nullableStr(raw.client_created_at),
    synced_at: nullableStr(raw.synced_at),
    sync_operation_id: nullableStr(raw.sync_operation_id),
    sync_state: str(raw.sync_state) as SyncState,
    created_at: str(raw.created_at),
    updated_at: str(raw.updated_at),
  };

  return {
    ...record,
    registered_by_name: nullableStr(raw.registered_by_name),
    departure_recorded_by_name: nullableStr(raw.departure_recorded_by_name),
    session_title: str(raw.session_title),
    visit_date: str(raw.visit_date),
    is_offline_origin: arrivalSource === "device" || departureSource === "device",
  };
}

export function mapAnnouncement(raw: RawRow, roles: Role[], _isRead: boolean): Announcement {
  return {
    id: str(raw.id),
    title: str(raw.title),
    content: str(raw.content),
    category: str(raw.category) as AnnouncementCategory,
    priority: str(raw.priority) as AnnouncementPriority,
    published_by: nullableStr(raw.published_by),
    published_at: nullableStr(raw.published_at),
    expires_at: nullableStr(raw.expires_at),
    is_pinned: bool(raw.is_pinned),
    is_published: bool(raw.is_published),
    recipient_roles: roles,
    created_at: str(raw.created_at),
    updated_at: str(raw.updated_at),
  };
}

export function mapConversation(raw: RawRow): Conversation {
  return {
    id: str(raw.id),
    conversation_type: str(raw.conversation_type) as ConversationType,
    title: nullableStr(raw.title),
    created_by: nullableStr(raw.created_by),
    created_at: str(raw.created_at),
    updated_at: str(raw.updated_at),
  };
}

export function mapAuditLog(raw: RawRow): AuditLog {
  return {
    id: str(raw.id),
    user_id: nullableStr(raw.user_id),
    action: str(raw.action),
    entity_type: str(raw.entity_type),
    entity_id: nullableStr(raw.entity_id),
    details: nullableStr(raw.details),
    created_at: str(raw.created_at),
    actor_name: nullableStr(raw.actor_name),
  };
}
