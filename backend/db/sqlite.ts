import "server-only";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { addDays, format } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { KIGALI_TZ, todayKigali } from "@/shared/utils";
import { DEFAULT_ROLE_PERMISSIONS, DEFAULT_ROLES, PERMISSIONS } from "@/shared/constants";

const globalForDb = globalThis as unknown as { __mubiligiDb?: DatabaseSync };

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  role TEXT NOT NULL DEFAULT 'dean' CHECK (role IN ('admin','dean')),
  role_key TEXT NOT NULL DEFAULT 'dean',
  status TEXT NOT NULL DEFAULT 'active',
  is_active INTEGER NOT NULL DEFAULT 1,
  password_hash TEXT,
  last_login_at TEXT,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  registration_number TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  trade TEXT NOT NULL CHECK (trade IN ('SOD','MMP','CSA','NIT')),
  level TEXT NOT NULL CHECK (level IN ('L3','L4','L5')),
  class_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS visit_days (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  registration_open TEXT NOT NULL,
  registration_close TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  instructions TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  national_id TEXT,
  relationship TEXT NOT NULL CHECK (relationship IN ('parent','guardian','relative','other')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY,
  reference_code TEXT NOT NULL UNIQUE,
  visitor_id TEXT NOT NULL REFERENCES visitors(id) ON DELETE RESTRICT,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  visit_day_id TEXT NOT NULL REFERENCES visit_days(id) ON DELETE RESTRICT,
  purpose TEXT NOT NULL CHECK (purpose IN ('academic','discipline','financial','welfare','consultation','other')),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  sync_operation_id TEXT UNIQUE,
  archived_at TEXT,
  archived_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  registration_id TEXT NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
  arrival_time TEXT,
  arrival_device_timezone TEXT,
  arrival_source TEXT NOT NULL DEFAULT 'server',
  departure_time TEXT,
  departure_device_timezone TEXT,
  departure_source TEXT,
  sync_confirmed_at TEXT,
  status TEXT NOT NULL DEFAULT 'expected' CHECK (status IN ('expected','arrived','on_campus','departed','no_show')),
  recorded_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  departure_recorded_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  departure_operation_id TEXT UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  registration_id TEXT REFERENCES registrations(id) ON DELETE CASCADE,
  recipient_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'success',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  group_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_key TEXT NOT NULL REFERENCES roles(key) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
  PRIMARY KEY (role_key, permission_key)
);

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
  allowed INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, permission_key)
);

CREATE TABLE IF NOT EXISTS archived_records (
  id TEXT PRIMARY KEY,
  registration_id TEXT NOT NULL,
  reference_code TEXT NOT NULL,
  visitor_name TEXT NOT NULL,
  student_name TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  snapshot TEXT NOT NULL,
  archived_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  archived_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS report_history (
  id TEXT PRIMARY KEY,
  sent_to TEXT NOT NULL,
  cc TEXT,
  format TEXT NOT NULL,
  date_from TEXT,
  date_to TEXT,
  row_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  error TEXT,
  triggered_by TEXT NOT NULL DEFAULT 'manual',
  actor_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_settings (
  id TEXT PRIMARY KEY,
  dean_name TEXT NOT NULL DEFAULT 'Dean of Discipline',
  dean_email TEXT NOT NULL DEFAULT '',
  cc_email TEXT NOT NULL DEFAULT '',
  email_enabled INTEGER NOT NULL DEFAULT 0,
  default_format TEXT NOT NULL DEFAULT 'pdf',
  auto_enabled INTEGER NOT NULL DEFAULT 0,
  auto_time TEXT NOT NULL DEFAULT '17:00',
  auto_format TEXT NOT NULL DEFAULT 'pdf',
  last_sent_date TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_registrations_visit_day ON registrations(visit_day_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_created ON registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_visitor ON registrations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_registrations_student ON registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_arrival ON attendance(arrival_time);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_visit_days_date ON visit_days(visit_date);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_registration ON archived_records(registration_id);
CREATE INDEX IF NOT EXISTS idx_report_history_created ON report_history(created_at DESC);
`;

function addColumn(db: DatabaseSync, table: string, definition: string) {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  } catch {
    // column already exists
  }
}

function migrate(db: DatabaseSync) {
  db.exec(SCHEMA);
  addColumn(db, "profiles", "role_key TEXT NOT NULL DEFAULT 'dean'");
  addColumn(db, "profiles", "phone_number TEXT");
  addColumn(db, "profiles", "status TEXT NOT NULL DEFAULT 'active'");
  addColumn(db, "profiles", "last_login_at TEXT");
  addColumn(db, "profiles", "deleted_at TEXT");
  addColumn(db, "registrations", "archived_at TEXT");
  addColumn(db, "registrations", "archived_by TEXT");
  addColumn(db, "registrations", "sync_operation_id TEXT");
  addColumn(db, "audit_logs", "status TEXT NOT NULL DEFAULT 'success'");
  addColumn(db, "attendance", "departure_recorded_by TEXT REFERENCES profiles(id) ON DELETE SET NULL");
  addColumn(db, "attendance", "departure_operation_id TEXT");
  addColumn(db, "attendance", "arrival_device_timezone TEXT");
  addColumn(db, "attendance", "arrival_source TEXT NOT NULL DEFAULT 'server'");
  addColumn(db, "attendance", "departure_device_timezone TEXT");
  addColumn(db, "attendance", "departure_source TEXT");
  addColumn(db, "attendance", "sync_confirmed_at TEXT");
  db.exec("UPDATE profiles SET role_key = role WHERE role_key IS NULL OR role_key = ''");
  db.exec("UPDATE profiles SET role_key = 'admin' WHERE role_key = 'dean' AND role = 'admin'");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_sync_operation ON registrations(sync_operation_id) WHERE sync_operation_id IS NOT NULL");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_departure_operation ON attendance(departure_operation_id) WHERE departure_operation_id IS NOT NULL");
}

function seed(db: DatabaseSync) {
  const now = new Date().toISOString();
  const staffCount = db.prepare("SELECT COUNT(*) AS count FROM profiles").get() as {
    count: number;
  };

  if (Number(staffCount.count) === 0) {
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";
    const deanPassword = process.env.SEED_DEAN_PASSWORD || "Dean@12345";
    const insert = db.prepare(
      `INSERT INTO profiles (id, full_name, email, role, role_key, status, is_active, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', 1, ?, ?, ?)`,
    );
    insert.run(
      randomUUID(),
      "School Administrator",
      process.env.SEED_ADMIN_EMAIL || "admin@mubiligi.rw",
      "admin",
      "admin",
      bcrypt.hashSync(adminPassword, 10),
      now,
      now,
    );
    insert.run(
      randomUUID(),
      "Dean of Discipline",
      process.env.SEED_DEAN_EMAIL || "dean@mubiligi.rw",
      "dean",
      "dean",
      bcrypt.hashSync(deanPassword, 10),
      now,
      now,
    );
  }

  const visitCount = db.prepare("SELECT COUNT(*) AS count FROM visit_days").get() as {
    count: number;
  };
  if (Number(visitCount.count) === 0) {
    const today = todayKigali();
    const insert = db.prepare(
      `INSERT INTO visit_days (id, title, visit_date, registration_open, registration_close, is_active, instructions, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const open = fromZonedTime(`${format(addDays(new Date(`${today}T12:00:00`), -45), "yyyy-MM-dd")}T00:00:00`, KIGALI_TZ).toISOString();
    const close = fromZonedTime(`${today}T23:59:59`, KIGALI_TZ).toISOString();
    insert.run(
      randomUUID(),
      "Parents & Guardians Visit Day",
      today,
      open,
      close,
      1,
      "Please arrive at the main gate with your national ID or a valid identification document. Registration closes at 23:59 on the visit day.",
      now,
      now,
    );

    const nextDate = format(addDays(new Date(`${today}T12:00:00`), 30), "yyyy-MM-dd");
    insert.run(
      randomUUID(),
      "End of Term Visit Day",
      nextDate,
      fromZonedTime(`${format(addDays(new Date(`${today}T12:00:00`), -14), "yyyy-MM-dd")}T00:00:00`, KIGALI_TZ).toISOString(),
      fromZonedTime(`${nextDate}T23:59:59`, KIGALI_TZ).toISOString(),
      1,
      "End of term parent-teacher meeting. Report to the reception desk for guidance.",
      now,
      now,
    );
  }

  const studentCount = db.prepare("SELECT COUNT(*) AS count FROM students").get() as {
    count: number;
  };
  if (Number(studentCount.count) === 0) {
    const insert = db.prepare(
      `INSERT OR IGNORE INTO students (id, registration_number, full_name, trade, level, class_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const students = [
      ["SOD/L3/001", "Aline Uwase", "SOD", "L3", "SOD L3 A"],
      ["SOD/L4/014", "Eric Nshimiyimana", "SOD", "L4", "SOD L4 B"],
      ["MMP/L3/007", "Diane Ingabire", "MMP", "L3", "MMP L3 A"],
      ["CSA/L4/021", "Patrick Habimana", "CSA", "L4", "CSA L4 A"],
      ["NIT/L5/003", "Claudine Mukamana", "NIT", "L5", "NIT L5 A"],
      ["MMP/L5/011", "Jean Bosco Ndayisaba", "MMP", "L5", "MMP L5 B"],
    ];
    for (const [reg, name, trade, level, className] of students) {
      insert.run(randomUUID(), reg, name, trade, level, className, now, now);
    }
  }

  seedRbac(db, now);
}

function seedRbac(db: DatabaseSync, now: string) {
  const insertRole = db.prepare(
    `INSERT OR IGNORE INTO roles (key, name, description, is_system, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  for (const role of DEFAULT_ROLES) {
    insertRole.run(role.key, role.name, role.description, role.is_system ? 1 : 0, now, now);
  }

  const insertPermission = db.prepare(
    `INSERT OR IGNORE INTO permissions (key, label, group_name, description, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  );
  for (const permission of PERMISSIONS) {
    insertPermission.run(
      permission.key,
      permission.label,
      permission.group,
      permission.description,
      now,
    );
  }

  const countPermissions = db.prepare(
    "SELECT COUNT(*) AS count FROM role_permissions WHERE role_key = ?",
  );
  const insertRolePermission = db.prepare(
    "INSERT OR IGNORE INTO role_permissions (role_key, permission_key) VALUES (?, ?)",
  );
  for (const [roleKey, permissionKeys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const existing = countPermissions.get(roleKey) as { count: number };
    if (Number(existing.count) > 0) continue;
    for (const permissionKey of permissionKeys) {
      insertRolePermission.run(roleKey, permissionKey);
    }
  }

  const settings = db.prepare("SELECT COUNT(*) AS count FROM email_settings").get() as {
    count: number;
  };
  if (Number(settings.count) === 0) {
    db.prepare(
      `INSERT INTO email_settings (id, dean_name, dean_email, cc_email, email_enabled, default_format, auto_enabled, auto_time, auto_format, last_sent_date, updated_at)
       VALUES ('default', ?, ?, '', 0, 'pdf', 0, '17:00', 'pdf', NULL, ?)`,
    ).run("Dean of Discipline", process.env.DEAN_EMAIL || "dean@mubiligi.rw", now);
  }
}

export function getDb(): DatabaseSync {
  if (globalForDb.__mubiligiDb) return globalForDb.__mubiligiDb;

  const dbPath =
    process.env.LOCAL_DB_PATH || path.join(process.cwd(), "data", "mubiligi.db");
  const dir = path.dirname(dbPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const db = new DatabaseSync(dbPath, { timeout: 5000 });
  migrate(db);
  seed(db);
  globalForDb.__mubiligiDb = db;
  return db;
}

export function rows<T>(sql: string, ...params: (string | number | null)[]): T[] {
  const db = getDb();
  return db.prepare(sql).all(...params) as T[];
}

export function row<T>(sql: string, ...params: (string | number | null)[]): T | undefined {
  const db = getDb();
  return db.prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, ...params: (string | number | null)[]): number {
  const db = getDb();
  return Number(db.prepare(sql).run(...params).changes);
}

export function newId(): string {
  return randomUUID();
}
