# Tarterie Sophie

Handgemaakte taarten en tartelettes — public site, admin dashboard, and the
backend services that support them.

## Structure

```
frontend/   The Vite + React app (public site + /admin dashboard).
            This is the ONLY folder your web host needs — hand it this
            folder (or its built dist/) to publish the site.

backend/    Everything that is NOT part of the published site.
  supabase/   DB migrations + Edge Functions. Deployed to Supabase itself
              (via the Supabase CLI), not to your web server.
  invoicing/  Trigger.dev v4 project that emails PDF invoices when an
              order is accepted. Deployed to trigger.dev, not to your
              web server.
  scripts/    One-off admin/migration scripts, run locally by hand.
              Never deployed anywhere.
```

Nothing in `backend/` is required to build or serve the site — it only
talks to Supabase and trigger.dev directly, on its own deploy path.

## Where each piece deploys, and how

| Folder | Deploys to | How |
| --- | --- | --- |
| `frontend/` | Your web host | `cd frontend && npm install && npm run build`, then upload/serve `frontend/dist/` |
| `backend/supabase/` | Supabase | `supabase db push` (migrations), `supabase functions deploy <name>` (Edge Functions) — run from inside `backend/supabase/` |
| `backend/invoicing/` | trigger.dev | `cd backend/invoicing && npm install && npx trigger.dev@latest deploy` |
| `backend/scripts/` | Nowhere — local only | `cd backend/scripts && npm install && npm run migrate:products` |

## Env files

Every piece that talks to Supabase has its own `.env.example` — copy it to
`.env.local` and fill in real values. Never commit `.env.local`.

| File | Contains | Sensitivity |
| --- | --- | --- |
| `frontend/.env.example` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Public — the anon key is safe in the browser bundle, protected by Row Level Security |
| `backend/scripts/.env.example` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Secret — service role key bypasses RLS, local use only |
| `backend/invoicing/.env.example` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `COMPOSIO_API_KEY`, `COMPOSIO_OUTLOOK_CONNECTED_ACCOUNT_ID` | Secret — for local `trigger.dev dev` runs only; production values live in the trigger.dev dashboard (Project Settings → Environment Variables) |

Two more secrets exist but aren't files — they're set directly against the
services that use them:
- **Supabase Edge Function secrets** (`TRIGGER_SECRET_KEY`, plus
  `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` for the functions that need
  them) — set via `supabase secrets set`, visible in the Supabase
  dashboard under Edge Functions → Secrets.
- **trigger.dev prod env vars** — set in the trigger.dev dashboard under
  Project Settings → Environment Variables → `prod`.

See `backend/invoicing/README.md` for the full wiring diagram between
Supabase, the Edge Function, and trigger.dev.
