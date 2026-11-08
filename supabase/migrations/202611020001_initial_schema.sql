CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone_number text,
  role text NOT NULL DEFAULT 'dean' CHECK (role IN ('admin', 'dean')),
  role_key text NOT NULL DEFAULT 'dean',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'disabled')),
  is_active boolean NOT NULL DEFAULT true,
  password_hash text,
  last_login_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number text NOT NULL UNIQUE,
  full_name text NOT NULL,
  trade text NOT NULL CHECK (trade IN ('SOD', 'MMP', 'CSA', 'NIT')),
  level text NOT NULL CHECK (level IN ('L3', 'L4', 'L5')),
  class_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visit_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  visit_date date NOT NULL,
  registration_open timestamptz NOT NULL,
  registration_close timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  national_id text,
  relationship text NOT NULL CHECK (relationship IN ('parent', 'guardian', 'relative', 'other')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code text NOT NULL UNIQUE,
  visitor_id uuid NOT NULL REFERENCES public.visitors(id) ON DELETE RESTRICT,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  visit_day_id uuid NOT NULL REFERENCES public.visit_days(id) ON DELETE RESTRICT,
  purpose text NOT NULL DEFAULT 'consultation'
    CHECK (purpose IN ('academic', 'discipline', 'financial', 'welfare', 'consultation', 'other')),
  message text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  sync_operation_id uuid UNIQUE,
  archived_at timestamptz,
  archived_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
  arrival_time timestamptz,
  arrival_device_timezone text,
  arrival_source text NOT NULL DEFAULT 'server' CHECK (arrival_source IN ('server', 'device')),
  departure_time timestamptz,
  departure_device_timezone text,
  departure_source text CHECK (departure_source IN ('server', 'device')),
  sync_confirmed_at timestamptz,
  status text NOT NULL DEFAULT 'expected'
    CHECK (status IN ('expected', 'arrived', 'on_campus', 'departed', 'no_show')),
  recorded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  departure_recorded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  departure_operation_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  registration_id uuid REFERENCES public.registrations(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details text,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.roles (
  key text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  key text PRIMARY KEY,
  label text NOT NULL,
  group_name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_key text NOT NULL REFERENCES public.roles(key) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  PRIMARY KEY (role_key, permission_key)
);

CREATE TABLE IF NOT EXISTS public.user_permissions (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  allowed boolean NOT NULL DEFAULT true,
  PRIMARY KEY (user_id, permission_key)
);

CREATE TABLE IF NOT EXISTS public.archived_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL,
  reference_code text NOT NULL,
  visitor_name text NOT NULL,
  student_name text NOT NULL,
  visit_date date NOT NULL,
  snapshot jsonb NOT NULL,
  archived_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  archived_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.report_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_to text NOT NULL,
  cc text,
  format text NOT NULL,
  date_from date,
  date_to date,
  row_count integer NOT NULL DEFAULT 0,
  status text NOT NULL,
  error text,
  triggered_by text NOT NULL DEFAULT 'manual',
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_settings (
  id text PRIMARY KEY DEFAULT 'default',
  dean_name text NOT NULL DEFAULT 'Dean of Discipline',
  dean_email text NOT NULL DEFAULT '',
  cc_email text NOT NULL DEFAULT '',
  email_enabled boolean NOT NULL DEFAULT false,
  default_format text NOT NULL DEFAULT 'pdf',
  auto_enabled boolean NOT NULL DEFAULT false,
  auto_time text NOT NULL DEFAULT '17:00',
  auto_format text NOT NULL DEFAULT 'pdf',
  last_sent_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS registrations_visit_day_idx ON public.registrations(visit_day_id);
CREATE INDEX IF NOT EXISTS registrations_status_idx ON public.registrations(status);
CREATE INDEX IF NOT EXISTS registrations_created_idx ON public.registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS attendance_status_idx ON public.attendance(status);
CREATE INDEX IF NOT EXISTS attendance_arrival_idx ON public.attendance(arrival_time);
CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON public.notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS visit_days_date_idx ON public.visit_days(visit_date);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON public.audit_logs(created_at DESC);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archived_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO public.roles (key, name, description, is_system)
VALUES
  ('admin', 'Super Administrator', 'Full system access.', true),
  ('dean', 'Dean of Discipline', 'Reviews visitors, attendance and reports.', true),
  ('prefect', 'Prefect', 'Registers arriving parents and records departures.', true),
  ('registration_staff', 'Registration Staff', 'Registers visitors and records attendance.', true),
  ('readonly_staff', 'Read-only Staff', 'Can view records and reports but cannot change them.', true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.permissions (key, label, group_name, description)
VALUES
  ('dashboard.view', 'View dashboard', 'General', 'Access the dashboard and summary statistics.'),
  ('registrations.view', 'View registrations', 'Registrations', 'Browse registration records and visitor details.'),
  ('registrations.create', 'Create registrations', 'Registrations', 'Register visitors for a visit day.'),
  ('registrations.edit', 'Edit registrations', 'Registrations', 'Update registration status and details.'),
  ('registrations.delete', 'Delete registrations', 'Registrations', 'Permanently delete registration records.'),
  ('attendance.view', 'View attendance', 'Attendance', 'View arrivals, departures and attendance status.'),
  ('attendance.create', 'Record arrivals', 'Attendance', 'Mark visitors as arrived.'),
  ('attendance.edit', 'Edit attendance', 'Attendance', 'Correct or update attendance records.'),
  ('attendance.delete', 'Delete attendance', 'Attendance', 'Remove attendance records.'),
  ('reports.view', 'View reports', 'Reports', 'Open attendance reports and summaries.'),
  ('reports.generate', 'Generate reports', 'Reports', 'Build custom reports using date and record filters.'),
  ('reports.export', 'Export reports', 'Reports', 'Download reports as Word or PDF files.'),
  ('reports.print', 'Print reports', 'Reports', 'Use the printable report register.'),
  ('reports.email', 'Email reports', 'Reports', 'Send full attendance reports to an email address.'),
  ('users.view', 'View users', 'Users & Roles', 'Browse user accounts and their access.'),
  ('users.create', 'Create users', 'Users & Roles', 'Add new staff accounts.'),
  ('users.edit', 'Edit users', 'Users & Roles', 'Update user details, roles and account status.'),
  ('users.delete', 'Delete users', 'Users & Roles', 'Remove staff accounts.'),
  ('roles.manage', 'Manage roles', 'Users & Roles', 'Create roles and edit their permissions.'),
  ('permissions.assign', 'Assign permissions', 'Users & Roles', 'Grant or revoke permissions for individual users.'),
  ('settings.manage', 'Manage settings', 'Administration', 'Configure visit days and reporting settings.'),
  ('audit.view', 'View audit logs', 'Administration', 'Review important administrative actions.'),
  ('records.archive', 'Archive records', 'Record management', 'Move outdated records to the archive.'),
  ('records.restore', 'Restore records', 'Record management', 'Restore archived records.'),
  ('records.delete', 'Permanently delete records', 'Record management', 'Permanently erase archived records.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role_key, permission_key)
VALUES
  ('dean', 'dashboard.view'),
  ('dean', 'registrations.view'),
  ('dean', 'registrations.create'),
  ('dean', 'registrations.edit'),
  ('dean', 'registrations.delete'),
  ('dean', 'attendance.view'),
  ('dean', 'attendance.create'),
  ('dean', 'attendance.edit'),
  ('dean', 'reports.view'),
  ('dean', 'reports.generate'),
  ('dean', 'reports.export'),
  ('dean', 'reports.print'),
  ('dean', 'reports.email'),
  ('dean', 'audit.view'),
  ('prefect', 'dashboard.view'),
  ('prefect', 'registrations.view'),
  ('prefect', 'registrations.create'),
  ('prefect', 'attendance.view'),
  ('prefect', 'attendance.create'),
  ('prefect', 'attendance.edit'),
  ('prefect', 'reports.view'),
  ('prefect', 'reports.export'),
  ('prefect', 'reports.print'),
  ('prefect', 'reports.email'),
  ('registration_staff', 'dashboard.view'),
  ('registration_staff', 'registrations.view'),
  ('registration_staff', 'registrations.create'),
  ('registration_staff', 'registrations.edit'),
  ('registration_staff', 'attendance.view'),
  ('registration_staff', 'attendance.create'),
  ('registration_staff', 'attendance.edit'),
  ('registration_staff', 'reports.view'),
  ('registration_staff', 'reports.print'),
  ('readonly_staff', 'dashboard.view'),
  ('readonly_staff', 'registrations.view'),
  ('readonly_staff', 'attendance.view'),
  ('readonly_staff', 'reports.view')
ON CONFLICT DO NOTHING;
