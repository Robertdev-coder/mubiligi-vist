INSERT INTO public.visit_days (
  id,
  title,
  visit_date,
  registration_open,
  registration_close,
  is_active,
  instructions,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'MUBILIGI Visit Day',
  '2027-11-08',
  '2027-09-24 00:00:00+02',
  '2027-11-08 23:59:59+02',
  true,
  'Visit Day is scheduled for 8 November 2027.',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.visit_days WHERE visit_date = '2027-11-08'
);

INSERT INTO public.role_permissions (role_key, permission_key)
SELECT 'prefect', key
FROM public.permissions
WHERE key IN ('reports.view', 'reports.export', 'reports.print', 'reports.email')
ON CONFLICT DO NOTHING;
