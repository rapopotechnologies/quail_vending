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
- `app/(auth)/login` — public admin sign-in (invite-only, no public signup). No nav link to it from the public site; reachable via a small "Staff login" link in the marketing footer or a direct URL
- `app/auth/callback` — exchanges Supabase invite/recovery `token_hash` links for a session, then redirects to `/set-password`
- `app/(protected)/admin/` — all authenticated admin pages; layout (`app/(protected)/admin/layout.tsx`) fetches the current profile and renders `<Navbar>`
- `app/page.tsx` — public marketing/landing page, top level (not a route group). Reads public data via the normal server Supabase client (an unauthenticated request naturally resolves as the `anon` Postgres role — no separate client needed), scoped to what RLS/the `public_location_impact` view expose (see Database section)

**Middleware** (`middleware.ts`) — validates the Supabase session on every request via `PROTECTED_PREFIXES` (`/admin`, `/set-password`, `/api/admin`) and redirects unauthenticated users to `/login`. Runs before any page or API route.

**Three Supabase clients exist for a reason:**
- `lib/supabase/client.ts` — browser client (anon key), used in Client Components (`createSupabaseBrowserClient`)
- `lib/supabase/server.ts` — anon key + user JWT from cookies, for Server Components/Route Handlers, user-scoped, RLS applies (`createSupabaseServerClient`)
- `lib/supabase/service.ts` — service role key, bypasses RLS. Use only for invite/admin-user-management operations where there is no user session. Never import into a Client Component.

**Auth/roles** — `profiles` table (`id -> auth.users`, `full_name`, `role`: `super_admin` | `staff`). A `handle_new_user` trigger auto-creates a profile (default role `staff`) on Supabase Auth user creation. No public signup — a super admin invites teammates via the Supabase Admin API; everyone else lands as `staff`. `lib/auth/current-user.ts` (`getCurrentProfile`) resolves the current user's profile server-side.

The RLS boundary is the real permission model, not the UI — every page's `canDelete={profile?.role === "super_admin"}` prop only hides buttons; the actual enforcement is in `supabase/migrations/002_rls_policies.sql` (delete + historical-edit policies) and `006_prevent_role_self_escalation.sql` (blocks self-promotion). When adding a new mutation, ask "what does RLS allow a `staff` JWT to do here" — not "does the UI show this button" — since anyone can call the REST API directly with valid credentials.

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
- **003_warehouse_stock** — adds `products.warehouse_qty` (bulk stock on hand, not yet loaded into a machine) and `warehouse_par_level` (reorder threshold). `warehouse_qty` is incremented by `recordPurchase` (`app/actions/products.ts`) and automatically decremented in `createRestockEvent` (`app/actions/restock.ts`) by the total qty used across all slots for each product in that restock event.
- **004_public_landing_data** — `partner_inquiries` table (anon + authenticated can INSERT; only authenticated can SELECT/UPDATE; `super_admin` can DELETE) for the landing page's "work with us" form. `public_location_impact` view (name, location, `charity_estimate` = 10% of all-time revenue for `status = 'active'` machines) grants `SELECT` to `anon` — see below.
- **005_restrict_handle_new_user_execute** — revokes direct RPC execute on the `handle_new_user` trigger function (Supabase security-advisor flag; it should only ever fire via the `on_auth_user_created` trigger).
- **006_prevent_role_self_escalation** — `profiles_update_self` (migration 002) only checked which *row* a user could update (`id = auth.uid()`), not which *columns* — any `staff` user could call the Supabase client directly to set their own `role` to `super_admin`. Closed with a `before update` trigger that blocks changing `role` unless the requester is already a `super_admin`. Guards on `auth.uid() is not null` so it doesn't block direct SQL/dashboard/service-role operations (no user JWT in that context) — only actual PostgREST requests made with a signed-in user's session. Verified live: a real staff JWT attempting `PATCH /rest/v1/profiles` with `{ role: 'super_admin' }` gets rejected (400, "Only a super admin can change roles"); the same request with `{ full_name: ... }` still succeeds.
- **007_auto_sync_product_status** — `products.status` used to be a purely manual field that drifted from reality. A `before insert or update` trigger now recomputes it automatically from `warehouse_qty` vs `warehouse_par_level` whenever either changes: `re-purchase needed` if at/under par, `active` otherwise. `discontinued` is the one status the trigger never touches (checked first, returns early) — it's a genuine manual override unrelated to stock level. Products with no `warehouse_par_level` set are left alone (no threshold to judge against). The product form's Status field still lets you pick any value, but Active/Re-purchase needed get silently recomputed on save if a par level is set — there's a caption under the field saying so. Verified live: insert with an explicit contradicting status gets overridden by the trigger; `discontinued` survives a subsequent stock change untouched.
- **008_units_per_case** — adds `products.units_per_case` (default 1). `warehouse_qty` always stays in individual units everywhere (restock drawdown, low-stock thresholds, machine par levels) — this column exists purely so `RecordPurchaseDialog` (`components/products/record-purchase-dialog.tsx`) can ask "how many cases did you buy" and multiply client-side before calling `recordPurchase`, rather than making staff do the math themselves. When `units_per_case > 1` the dialog's field relabels to "Cases bought" with a live "= N individual units" preview; at the default of 1 it behaves exactly as before ("Qty bought", 1:1).

**Bulk/warehouse stock vs. machine stock:** two separate "low stock" concepts exist and are easy to conflate. `machine_slots.par_level` / `stock_levels.current_qty` is per-machine-slot (is this specific machine running low right now). `products.warehouse_par_level` / `warehouse_qty` is the bulk supply bought in one purchase (e.g. a Costco run) before any of it is loaded into a machine — this is what tells you when to go buy more, independent of whether any single machine is currently low. A restock event draws from the latter to top up the former. The Products table's "Total on hand" column (`warehouse_qty` + the sum of `stock_levels.current_qty` across every machine slot referencing that product, computed in `app/(protected)/admin/products/page.tsx`) is the one place that shows the true combined figure — neither of the two per-bucket numbers alone answers "how many do we actually have, everywhere."

**`public_location_impact` is an intentional security-definer view** — Supabase's security advisor flags this (ERROR level: "Security Definer View") because it's usually accidental. Here it's the whole point: `machines` and `sales` are RLS-locked to `authenticated`, but the marketing page needs *some* public-safe signal for the "locations we operate" and "community impact leaderboard" sections. The view runs with its owner's privileges (default Postgres view behavior, bypassing the underlying RLS) and only ever `SELECT`s `id, name, location, charity_estimate` — never raw revenue, sales rows, or costs. If you add columns to this view, keep that constraint: nothing beyond what's safe for a fully public, unauthenticated visitor. `charity_estimate` is 10% of revenue as a stand-in for the company's "10% of profit to charity" pledge — true per-sale profit isn't tracked (no COGS ledger), so this is a labeled approximation, not exact accounting.

Apply new migrations via Supabase MCP (`apply_migration`) against project `tehoezokpoiszuvbfgma`, then regenerate `lib/supabase/types.ts` via `generate_typescript_types`.

**TypeScript note:** same pre-existing issue as resume_optimizer — the generated `Database` type (from `generate_typescript_types`) targets a newer `@supabase/postgrest-js` than the installed `@supabase/supabase-js@2.110.8`, which produces widespread `never` type inference on `.from(...)` query results (e.g. `machine.name` errors even though the row is a real object at runtime). `next.config.js` sets `typescript: { ignoreBuildErrors: true }` as the blanket fix. When actively touching a file with this problem, cast the query result with `as unknown as YourType` rather than leaving `never` in the file you touched (see the `RawSlot` cast in `app/(protected)/admin/machines/[id]/page.tsx` for the pattern).

## Dashboard & reports

`lib/reports/` holds shared, non-UI logic reused by both `/admin/dashboard` and `/admin/reports`:
- `queries.ts` — server-side Supabase fetches: `fetchSalesWithNames`, `fetchLowStockSlots` (machine-slot level, filtered client-side against `par_level` after fetch), `fetchLowBulkStockProducts` (warehouse level), `fetchRecentActivity` (merges sales + restock_events, sorted by timestamp)
- `aggregate.ts` — pure functions over `SaleRecord[]`: `totalRevenue`, `revenueSince`, `revenueByMachine`, `revenueByProduct`, `revenueByDay`

`components/dashboard/low-stock-list.tsx` is shared between the dashboard's "low stock" section and the reports page's "restock due" section — same underlying data (machine slots at/under par, products at/under warehouse par), same component.

Charts (`components/reports/revenue-bar-chart.tsx`) are Recharts, single-hue bars (`hsl(var(--primary))`) since each chart is one series by category — no legend needed. CSV export (`components/reports/export-csv-button.tsx`) builds the CSV client-side from already-fetched `SaleRecord[]` and triggers a download via `Blob` + an anchor `download` attribute — no server round-trip.

## Marketing / landing page (`app/page.tsx`)

Sections, top to bottom: `SiteHeader` (logo, anchor nav, deliberately no admin/login link), `Hero`, `ValuesSection` (icon-based — no real vending-machine photography yet, see Known gaps), `LocationsSection` (`#locations`, real active machines via `public_location_impact`), `GenerosityLeaderboard` (`#impact`, same view, ranked by `charity_estimate`, gold accent bars — `hsl(var(--gold))`, a separate token from the shadcn `accent` semantic color so it doesn't collide with admin-UI hover states), `InquiryForm` (`#partner`, client component, `submitInquiry` server action), `SiteFooter` (charity blurb + the one "Staff login" link in the whole public site, pointing at `/login`).

Brand colors (`app/globals.css` `--primary`/`--gold` tokens) are derived from `public/quail-logo.png`'s teal/gold palette — keep new UI in sync with these rather than introducing new brand colors ad hoc.

## Known gaps (tracked for later phases — see PLAN.md)

- No invite-user server action yet — invites must be sent from the Supabase Dashboard (Authentication → Users → Invite) until a `super_admin`-gated invite form is built
- Supabase Dashboard config still needed manually (no MCP/CLI tool covers this): Authentication → URL Configuration (Site URL + Redirect URLs → the deployed Vercel domain), and Authentication → Email Templates (Invite/Reset Password links → token-hash format pointing at `/auth/callback`)
- Dashboard/reports fetch full sales history on every load (no pagination/date-range filter) — fine at current scale (2 machines, small team), revisit only if it accelerates well past the 3-year projection noted in PLAN.md §7
- No real vending-machine/product photography — `ValuesSection` uses lucide icons as placeholders until real photos are ready to drop in
- No email/Slack notification when a `partner_inquiries` row is inserted — staff currently need to check `/admin/leads` manually
