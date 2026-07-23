# Quail Vending Co.

A single Next.js app serving both the public marketing site and the internal
admin tool for managing vending machine inventory.

- **`/`** — public marketing site
- **`/admin`** — invite-only admin app for managing machines, products, restocking, and sales, backed by Supabase. See `PLAN.md` for the build plan and phases.

## Stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS 3 · shadcn-style
primitives (vendored) · Supabase (`@supabase/ssr`) · react-hook-form + zod

## Development

```bash
npm install
npm run dev
```

Requires a `.env.local` (see `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Structure

```
app/
  (auth)/login/     admin sign-in (invite-only, no public signup, no public nav link to it)
  auth/callback/     invite/recovery token_hash exchange -> /set-password
  set-password/       one-time password set after accepting an invite
  (protected)/admin/  gated admin routes: dashboard, machines, products, restock, sales, reports, leads
  page.tsx             public marketing/landing page
components/
  marketing/          public site components (header, hero, locations, generosity leaderboard, inquiry form, footer)
  leads/               admin leads table (partner inquiries from the landing page form)
  layout/, auth/       chrome + auth forms
  ui/                   vendored shadcn-style primitives
lib/
  supabase/             client / server / service clients + generated types
  auth/                 current-user/profile lookup
  reports/               dashboard/reports queries + aggregation + public-safe landing-page queries
  validations/           zod schemas
supabase/migrations/     numbered SQL migrations
```

Auth guard lives in `middleware.ts`, using a `PROTECTED_PREFIXES` allowlist
scoped to `/admin`, `/set-password`, and `/api/admin`. The marketing page is
reachable without a session but does read a narrow, intentionally public
Supabase view (`public_location_impact`) for its locations and community-impact
sections — see `CLAUDE.md` for why that's safe (RLS still locks down the
underlying `machines`/`sales` tables for anonymous requests).
