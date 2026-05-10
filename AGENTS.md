# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

PappoShop is an online marketplace for handmade products by Roma entrepreneurs. The primary service is the **Next.js frontend** (`frontend/`), which talks directly to a hosted Supabase backend. The **Django backend** (`backend/`) is a Phase 2 stub with only the default admin URL.

### Services

| Service | Directory | Port | Command |
|---|---|---|---|
| Next.js frontend | `frontend/` | 3000 | `npm run dev` |
| Django backend (Phase 2 stub) | `backend/` | 8000 | `source .venv/bin/activate && python manage.py runserver 8000` |

### Running the frontend

```bash
cd frontend
npm run dev
```

The frontend requires Supabase credentials in `frontend/.env.local`. Copy from `frontend/.env.local.example`. Without valid Supabase credentials, the app starts and renders but product/service data fetches will fail at runtime. The UI shell (navigation, categories, forms) still loads.

### Running the backend

The Django backend defaults to SQLite (no external DB needed for local dev):

```bash
cd backend
source .venv/bin/activate
python manage.py migrate --run-syncdb
python manage.py runserver 8000
```

### Lint and build

- **Lint:** `cd frontend && npm run lint` (ESLint; note: the codebase has pre-existing lint warnings about `react-hooks/set-state-in-effect`)
- **Build:** `cd frontend && npm run build`
- **TypeScript check:** TypeScript is checked as part of `next build`

### Environment variables

- Required for full functionality: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Optional: Stripe, Resend, PostHog, Sentry, Turnstile, Google Analytics keys (see `frontend/.env.local.example`)

### Gotchas

- The package manager is **npm** (lockfile: `frontend/package-lock.json`). Do not use pnpm or yarn.
- Node.js >= 22 is required (Next.js 16).
- `python3.12-venv` system package is needed to create the backend virtualenv.
- The Django backend uses SQLite by default; no Docker/PostgreSQL is needed for local development.
- The `@next/font` package is deprecated; Next.js warns about it at startup but it does not block development.
