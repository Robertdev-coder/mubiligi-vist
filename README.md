# Mubiligi Visit Day

Next.js 15 app for managing visit-day registrations, attendance, and reports.

## Project structure

```
app/          Next.js routes (pages + API handlers) — the app entry point
frontend/     React components, UI primitives, clientside offline helpers
backend/      Server actions, auth, data access, SQLite/Supabase, reports
shared/       Types, constants, validation schemas, and utilities
public/       Static assets and PWA files
supabase/     SQL migrations
data/         Local SQLite database (gitignored)
```

Next.js requires the route directory (`app/`) to live at the project root, so it
stays there while all UI components live in `frontend/` and all server logic
lives in `backend/`. Imports use the `@/*` alias mapped to the project root, e.g.
`@/frontend/components/ui/button`, `@/backend/data`, `@/shared/types`.

## Environment

Copy the example and adjust values:

```bash
cp .env.example .env
```

Key variables:

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | JWT signing secret, minimum 32 characters |
| `LOCAL_DB_PATH` | SQLite file path (default `./data/mubiligi.db`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (optional) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (optional) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (optional) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Seeded admin account |
| `SEED_DEAN_EMAIL` / `SEED_DEAN_PASSWORD` | Seeded dean account |
| `DEAN_EMAIL` | Dean notification address |
| `REPORT_SMTP_HOST` / `REPORT_SMTP_PORT` | SMTP server for emailing attendance reports |
| `REPORT_SMTP_USER` / `REPORT_SMTP_PASSWORD` | SMTP login |
| `REPORT_FROM_EMAIL` | Sender address for attendance report emails |

If the three Supabase variables are set, the app uses Supabase; otherwise it
falls back to the local SQLite database.

## Host on Netlify

The repository includes Netlify build settings and targets Node.js 22. Connect
the Git repository in Netlify and let Netlify detect the Next.js framework;
use `npm run build` as the build command and leave the publish directory unset.

Configure these values in Netlify's environment settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET` (at least 32 random characters)
- `REPORT_SMTP_HOST`, `REPORT_SMTP_PORT`, `REPORT_SMTP_USER`,
  `REPORT_SMTP_PASSWORD`, and `REPORT_FROM_EMAIL` to enable emailing.

Apply the SQL files in `supabase/migrations/` to the Supabase project. The
service-role key must remain server-only; never use it as a `NEXT_PUBLIC_*`
variable. Do not use the local SQLite backend for a serverless deployment,
because its filesystem is not persistent.

For a new Supabase project, apply the migrations in timestamp order, then create
the first staff user in Supabase Authentication. Insert that Auth user's UUID,
name, and email into `public.profiles` with `role = 'admin'`,
`role_key = 'admin'`, `status = 'active'`, and `is_active = true`. After signing
in, create other staff accounts from the administration workspace.

The default Visit Day is 8 November 2027. Report email sending remains disabled
until the SMTP environment variables above are configured.

## Offline registration

Open the public registration form or staff check-in page while online so the
page and its visit-day choices are available on the device. If the connection
drops, submissions are stored in that browser's local IndexedDB queue and
synchronized when it reconnects. A public registration is not confirmed until
it synchronizes and receives a reference. Staff report and print pages are
available to staff whose role has the corresponding permissions. Reports can
be downloaded in full for the selected date, printed, or sent as a CSV
attachment to an email address entered by the staff user.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the development server
- `npm run build` — production build
- `npm start` — run the production build
- `npm run lint` — lint the project
