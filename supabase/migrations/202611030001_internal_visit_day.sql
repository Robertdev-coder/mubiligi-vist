ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number text;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS sync_operation_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS registrations_sync_operation_id_key
  ON public.registrations (sync_operation_id)
  WHERE sync_operation_id IS NOT NULL;

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS departure_recorded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS departure_operation_id uuid,
  ADD COLUMN IF NOT EXISTS arrival_device_timezone text,
  ADD COLUMN IF NOT EXISTS arrival_source text NOT NULL DEFAULT 'server',
  ADD COLUMN IF NOT EXISTS departure_device_timezone text,
  ADD COLUMN IF NOT EXISTS departure_source text,
  ADD COLUMN IF NOT EXISTS sync_confirmed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS attendance_departure_operation_id_key
  ON public.attendance (departure_operation_id)
  WHERE departure_operation_id IS NOT NULL;

INSERT INTO public.roles (key, name, description, is_system, created_at, updated_at)
VALUES (
  'prefect',
  'Prefect',
  'Registers arriving parents and records departures.',
  true,
  now(),
  now()
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role_key, permission_key)
SELECT 'prefect', key
FROM public.permissions
WHERE key IN (
  'dashboard.view',
  'registrations.view',
  'registrations.create',
  'attendance.view',
  'attendance.create',
  'attendance.edit'
)
ON CONFLICT DO NOTHING;
