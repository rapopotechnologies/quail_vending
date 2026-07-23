# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build         # Production build
npm run lint           # ESLint
```

## Architecture

**Next.js 14 App Router**, three route groups:
- `app/(auth)/login` — public admin sign-in (invite-only, no public signup)
- `app/auth/callback` — exchanges Supabase invite/recovery `token_hash` links for a session, then redirects to `/set-password`
- `app/(protected)/admin/` — all authenticated admin pages; layout (`app/(protected)/admin/layout.tsx`) fetches the current profile and renders `<Navbar>`
- `app/page.tsx` — public landing page, top level (not a route group), never touches Supabase

**Middleware** (`middleware.ts`) — validates the Supabase session on every request via `PROTECTED_PREFIXES` (`/admin`, `/set-password`, `/api/admin`) and redirects unauthenticated users to `/login`. Runs before any page or API route.

**Three Supabase clients exist for a reason:**
- `lib/supabase/client.ts` — browser client (anon key), used in Client Components (`createSupabaseBrowserClient`)
- `lib/supabase/server.ts` — anon key + user JWT from cookies, for Server Components/Route Handlers, user-scoped, RLS applies (`createSupabaseServerClient`)
- `lib/supabase/service.ts` — service role key, bypasses RLS. Use only for invite/admin-user-management operations where there is no user session. Never import into a Client Component.

**Auth/roles** — `profiles` table (`id -> auth.users`, `full_name`, `role`: `super_admin` | `staff`). A `handle_new_user` trigger auto-creates a profile (default role `staff`) on Supabase Auth user creation. No public signup — a super admin invites teammates via the Supabase Admin API; everyone else lands as `staff`. `lib/auth/current-user.ts` (`getCurrentProfile`) resolves the current user's profile server-side.

**Invite/password-reset flow** — Supabase's invite email confirms the account and creates a session on click but doesn't set a password. `app/auth/callback/route.ts` exchanges the `token_hash`, then redirects to `/set-password`, where `supabase.auth.updateUser({ password })` completes onboarding. `PUBLIC_PATHS`/matcher must keep `/auth/callback` reachable without a session.

**Component placement rules:**
- `components/ui/` — vendored shadcn-style primitives, never modified directly
- `components/layout/` — chrome wrapping every protected page (navbar)
- `components/[feature]/` — self-contained building blocks reusable across pages (e.g. `components/auth/`)
- `components/shared/` — generic helpers, no feature affiliation
- `app/(protected)/admin/[page]/_components/` — sub-components decomposed from one large page file, tightly coupled to that page's state (Next.js ignores `_`-prefixed dirs as routes)

## Database

Migrations are in `supabase/migrations/`, applied in order:
- **001_initial_schema** — `profiles`, `machines`, `products`, `machine_slots`, `stock_levels`, `restock_events` (+ `restock_event_items`), `sales`; `on_auth_user_created` trigger auto-creates a `profiles` row
- **002_rls_policies** — RLS on all tables; `is_super_admin()` helper function; authenticated users get full CRUD on operational tables, `super_admin` required for deletes and editing historical `restock_events`/`sales`

Apply new migrations via Supabase MCP (`apply_migration`) against project `tehoezokpoiszuvbfgma`, then regenerate `lib/supabase/types.ts` via `generate_typescript_types`.

**TypeScript note:** same pre-existing issue as resume_optimizer — the generated `Database` type (from `generate_typescript_types`) targets a newer `@supabase/postgrest-js` than the installed `@supabase/supabase-js@2.110.8`, which produces widespread `never` type inference on `.from(...)` query results (e.g. `machine.name` errors even though the row is a real object at runtime). `next.config.js` sets `typescript: { ignoreBuildErrors: true }` as the blanket fix. When actively touching a file with this problem, cast the query result with `as unknown as YourType` rather than leaving `never` in the file you touched (see the `RawSlot` cast in `app/(protected)/admin/machines/[id]/page.tsx` for the pattern).

## Known gaps (tracked for later phases — see PLAN.md)

- No restock/sales CRUD yet — `(protected)/admin/restock`, `/sales`, `/dashboard`, `/reports` pages are still placeholders (`<PagePlaceholder>`)
- No invite-user server action yet — invites must be sent from the Supabase Dashboard (Authentication → Users → Invite) until a `super_admin`-gated invite form is built
- Supabase Dashboard config still needed manually (no MCP/CLI tool covers this): Authentication → URL Configuration (Site URL + Redirect URLs → the deployed Vercel domain), and Authentication → Email Templates (Invite/Reset Password links → token-hash format pointing at `/auth/callback`)
