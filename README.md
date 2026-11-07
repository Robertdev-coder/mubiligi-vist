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

If the three Supabase variables are set, the app uses Supabase; otherwise it
falls back to the local SQLite database.

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
