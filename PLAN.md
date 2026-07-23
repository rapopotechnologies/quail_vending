# Quail Vending — Build Plan

**Status:** Draft for review — no code written yet
**Repo:** `rapopotechnologies/quail_vending` (fresh, currently empty except `.git`, remote already linked)
**Relationship to `../quail_vending_co`:** this repo **replaces** it. Rebuilt from scratch (not copied), reusing the admin domain design (data model, feature set) validated there — but the tech stack/config now mirrors `../resume_optimizer` instead (per explicit direction: that stack is proven to work well on Vercel). `quail_vending_co` stays around only as historical reference until this repo is deployed and verified, then gets retired.

---

## 1. Goal

Two things in one Next.js app:

1. **Public landing page** (`/`) — marketing site for Quail Vending Co.
2. **Admin app** (`/admin`, invite-only) — replaces the current manual, in-person process for tracking vending machine inventory. Lets invited admins:
   - Manage machines and their catalog of products/slots
   - Log restock events (who stocked what, when, how much)
   - Record sales via manual entry (no machine telemetry/POS integration)
   - See dashboards: revenue per machine, low-stock alerts, restock-due list, best/worst sellers
   - Export any report/table as CSV (reporting only — never an import path)

No public signup. A super admin invites teammates; everyone else lands as `staff`. Small user count.

---

## 2. Tech stack

Mirrors `../resume_optimizer` — that repo's stack/config is the reference here, not quail_vending_co's:

| Layer | Choice |
|---|---|
| Framework | Next.js 14.2.x (App Router) |
| UI runtime | React 18.3.x |
| Language | TypeScript 5.7.x |
| Styling | Tailwind CSS 3.4.x + `tailwindcss-animate`, CSS-variable-based theme (`hsl(var(--...))` tokens) |
| Components | shadcn-style primitives, **manually vendored** into `components/ui/` via individual `@radix-ui/react-*` packages (no `components.json`/shadcn CLI config in resume_optimizer) |
| Forms | react-hook-form + zod + `@hookform/resolvers` |
| Data/Auth | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) — **new Supabase project**, separate from quail_vending_co's and resume_optimizer's |
| Charts | Recharts |
| Icons | lucide-react |
| Toasts | sonner |
| Analytics | `@vercel/analytics` |
| Hosting | Vercel, org `rapopotechnologies` |

Deliberately **not** pulled in from resume_optimizer's `package.json`, since this app has no need for them: `@anthropic-ai/sdk` (no AI features here), `stripe`/`@stripe/*` (no billing), `resend` (no transactional email yet — revisit for low-stock alert emails in a later phase), `@upstash/ratelimit`/`@upstash/redis` (no public API surface to rate-limit), `docx`/`jspdf`/`jszip`/`mammoth`/`pdf-parse` (no document generation), `@dnd-kit/*` (no drag-and-drop yet — reconsider only if shelf-slot reordering becomes a real need).

---

## 3. Config files to recreate (mirroring resume_optimizer's patterns, adjusted for this repo)

- `package.json` — `name: quail-vending`, trimmed dependency set per §2 above
- `tsconfig.json` — identical (`@/*` path alias, `next` plugin, `jsx: preserve`)
- `.eslintrc.json` — identical (`{"extends": "next/core-web-vitals"}`)
- `tailwind.config.ts` — identical structure (CSS variable color tokens, `tailwindcss-animate` plugin, container/radius/keyframes setup); swap the `--font-*` custom font var and any brand-specific colors (resume_optimizer's `terra` token) for this project's own
- `postcss.config.js` — identical (`tailwindcss` + `autoprefixer`)
- `next.config.js` — same security-headers block (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS, `X-DNS-Prefetch-Control`); drop the `pdf-parse`/`ignoreBuildErrors` lines since they're specific to resume_optimizer's known issues — only add back if this repo hits its own type-generation mismatch
- `middleware.ts` — same `PROTECTED_PREFIXES`/`PUBLIC_PATHS` array pattern + Supabase `getUser()`-before-anything-else session refresh, adapted to this app's routes (protect `/admin` and its API routes; public: `/`, `/admin/login`, `/admin/auth/callback`)
- `.gitignore` — same conventions (env files, `.next`, `.vercel`, tsbuildinfo, etc.)
- `CLAUDE.md` — architecture doc for this repo, same style as resume_optimizer's (commands, route groups, middleware behavior, Supabase client split, component placement rules, core flows, migration log) — written once real structure exists, not upfront boilerplate
- `.env.local` (gitignored) + `.env.local.example` (committed) — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` for the **new** Supabase project
- `vercel.json` — omitted initially (no crons needed yet); add if a scheduled low-stock digest job gets built later

---

## 4. Data model (Supabase / Postgres)

Reuse the same schema design validated in quail_vending_co's `ADMIN_APP_PLAN.md`, written as fresh migrations in this repo's `supabase/migrations/`:

```
machines            -- name, location, profit_share_pct, status
products            -- item_id (SKU), name, category, size, costs by channel,
                        sell_price, projected_sell_price, status, source_vendor,
                        pricing_basis, product_url, notes,
                        warehouse_qty, warehouse_par_level (bulk/on-hand stock
                        bought in a Costco run etc., before it's loaded into
                        any machine — separate from each machine's par_level)
machine_slots       -- machine_id, slot_label, product_id, capacity, par_level
stock_levels        -- machine_slot_id, current_qty, last_counted_at
restock_events (+ restock_event_items)  -- who/when/what/how much
sales               -- machine_id, product_id, qty, unit_price snapshot, sold_at, entered_by
profiles            -- id -> auth.users, full_name, role (super_admin | staff)
```

Row Level Security: authenticated users only; `super_admin` required for destructive actions and inviting/managing users; `staff` for day-to-day CRUD.

Bulk/warehouse stock (`products.warehouse_qty` / `warehouse_par_level`): a simple running total per product rather than purchase lots, added via a "Record purchase" quick action and automatically drawn down when a restock event fills a machine slot (filling a machine always comes from stock already on hand). Products view has a "Low bulk stock" filter alongside the existing "Needs reordering" one, so a bulk-buy run can be planned proactively instead of discovering it's out when a machine runs dry.

Migrations follow resume_optimizer's numbered convention (`001_initial_schema.sql`, `002_rls_policies.sql`, ...) rather than timestamp-prefixed filenames, each documented in `CLAUDE.md`'s migration log as it's added.

✅ Real inventory imported: `scripts/seed-products.ts` (mirrors resume_optimizer's `scripts/seed-*.ts` pattern; `npm run seed:products -- /path/to/export.csv`) parses the "Inventory Items Master List" CSV export and loaded 98 real products (41 Snacks, 37 Drinks - Healthy, 20 Drinks - Less Healthy), including real starting `warehouse_qty` for the 8 items already on hand. Re-runnable for future exports.

---

## 5. App structure

Follows resume_optimizer's route-group + component-placement conventions:

```
app/
  (auth)/
    login/                -- admin sign-in (invite-only, no public signup)
  auth/callback/route.ts  -- invite/recovery token_hash exchange, set-password redirect
  (protected)/
    admin/
      dashboard/
      machines/, machines/[id]/
      products/
      restock/
      sales/
      reports/
  api/
    admin/                -- route handlers backing the above (mutations, CSV export)
  page.tsx                 -- public landing page (top-level, not a route group — mirrors
                              resume_optimizer's app/about, app/pricing, etc. living at top level)
  robots.ts, sitemap.ts
components/
  landing/                 -- public landing page components
  layout/                  -- chrome for protected pages (navbar, sidebar nav)
  machines/, products/, restock/, sales/, dashboard/   -- feature components
  shared/                  -- generic helpers, no feature affiliation
  ui/                       -- shadcn-style primitives, vendored, never modified directly
lib/
  supabase/
    client.ts               -- anon key + user JWT, for Server Components/user-scoped ops
    server.ts                -- server client wrapper
    service.ts                -- service role key, bypasses RLS; webhook/cron/admin-only use
    types.ts                  -- generated Database types
  core/                       -- domain logic (e.g. reorder-threshold calc, restock math)
  validations/                 -- zod schemas
scripts/                       -- one-off seed/import scripts
supabase/
  migrations/                  -- numbered .sql files
  config.toml
```

Component placement rules (from resume_optimizer's `CLAUDE.md`, adopted as-is):
- `components/ui/` — vendored primitives only, never modified directly
- `components/layout/` — chrome wrapping every protected page
- `components/[feature]/` — self-contained building blocks reusable across pages
- `components/shared/` — generic, no feature affiliation
- `app/(protected)/admin/[page]/_components/` — sub-components decomposed from one large page file, tightly coupled to that page's state (Next.js ignores `_`-prefixed dirs as routes)

---

## 6. Build phases

Each phase independently deployable to a Vercel preview — verify it live before moving on.

1. ✅ **Scaffold** — `create-next-app` (Next 14/React 18 template), Tailwind v3 setup + hand-vendor the needed shadcn-style primitives into `components/ui/` (button, card, dialog, input, label, select, table, tabs, etc. — install individual `@radix-ui/react-*` packages as needed, no shadcn CLI), new Supabase project + local CLI link, base layout/nav, auth (login + `middleware.ts` with `PROTECTED_PREFIXES`/`PUBLIC_PATHS`), landing page skeleton.
2. ✅ **Core CRUD** — machines, products, machine_slots tables/forms. Includes a "needs reordering" view on products, plus bulk/warehouse stock tracking (`warehouse_qty`/`warehouse_par_level`, "Record purchase" quick action, "Low bulk stock" filter) added mid-Phase-2 based on real usage — see §4.
3. ✅ **Restocking flow** — log a restock event against a machine; updates `stock_levels`; shows fill % per slot; also auto-draws down bulk warehouse stock for the product(s) used.
4. ✅ **Sales tracking** — manual entry form: machine → product → qty → done; unit price auto-fills from the product's `sell_price`.
5. ✅ **Dashboard & reports** — revenue summary cards (today/7d/30d/all-time), low-stock alerts (both per-machine and bulk warehouse), recent activity feed on `/admin/dashboard`; revenue-by-machine and top-sellers bar charts (Recharts), restock-due list, CSV export of all sales on `/admin/reports`.
6. ✅ **Polish** — landing page rebuilt with real branding (logo + teal/gold theme from `quail-logo.png`), real active-machine locations and a "community impact" generosity leaderboard (10% of revenue per location, via a narrow public-safe `public_location_impact` view — see CLAUDE.md), a "request to host a machine" partner inquiry form (public insert-only, `/admin/leads` for staff to manage), and no admin-login link on the public site (moved to a small footer link). Roles/permissions audit caught and fixed a real privilege-escalation gap (`staff` could self-promote to `super_admin` via a direct API call — RLS only checked row ownership, not which columns; closed with a trigger, verified via a live escalation attempt). Mobile pass: responsive admin nav (scrolls instead of overflowing) and fixed several dialogs that had unresponsive multi-column grids. Still deferred: real vending-machine/product photography (icon placeholders in `ValuesSection` for now) and a genuine on-device mobile visual check (the dev environment's browser automation couldn't produce a true narrow-viewport render — code-level responsive-class review only).
7. ✅ **Admin UI/UX pass** — bulk stock/machine images and addresses (see CLAUDE.md migration 010) surfaced a broader ask: optimize the day-to-day staff/admin experience before adding more features.
   1. ✅ **Themed delete-confirmation dialog** — `DeleteConfirmButton` no longer calls `window.confirm()`; replaced with a vendored Radix `AlertDialog` (`components/ui/alert-dialog.tsx`) styled to match `dialog.tsx`, used everywhere the button already was (Products, Machines, Slots, Sales, Leads).
   2. ✅ **Staff invite flow in-app** — `super_admin`-gated `/admin/team` page (`app/actions/team.ts`): lists `profiles` + email (joined server-side via the service client's `auth.admin.listUsers`), invites by email via `auth.admin.inviteUserByEmail`, and lets a super admin change any other member's role in place. Reuses the invite → `/auth/callback` → `/set-password` flow already built in Phase 1. Nav only shows the "Team" link to super admins; direct URL access is also gated server-side.
   3. ✅ **Machines table search** — `components/machines/machines-view.tsx` brings `/admin/machines` to parity with Products (search by name/location/address).
   4. ✅ **Sortable table columns** — shared `SortableHeader` component (`components/shared/sortable-header.tsx`); wired into Products (name/sell price/bulk stock/total on hand/status), Machines (name/status), and Sales (when/machine/product/qty/total). Reports has no raw row table (just aggregate charts + CSV export), so sorting didn't apply there.
   5. ✅ **Reports date-range scoping** — `/admin/reports` now defaults to a 90-day window instead of always pulling full sales history, with a `?range=` query-param-driven selector (7d/30d/90d/all — `lib/reports/date-range.ts`). Charts, the sales count, and CSV export all scope to the selected range. Dashboard still fetches full history for its "All time" summary card, which is inherent to that card existing — not addressed further.
   6. ✅ **Loading states** — `loading.tsx` skeletons added for `/admin/reports` and `/admin/dashboard` (`components/ui/skeleton.tsx`) so navigation shows a themed placeholder instead of a blank page during the server fetch.
   7. ✅ **Mobile review** — code-level pass caught and fixed a real overflow bug: the Products category-select + search-input row didn't wrap and would overflow on a ~375px viewport (fixed with `flex-wrap` + `w-full sm:w-*`, matching the Machines search pattern). Still not verified on an actual device — the dev environment's browser automation cannot produce a true narrow viewport, so this remains a code-level review only, same caveat as Phase 6.

### 6.1 Known gotcha to build in from the start (learned from quail_vending_co)

Supabase's invite email confirms the account and creates a session on click but doesn't set a password. Build the callback route (`app/auth/callback/route.ts`, following resume_optimizer's existing `app/auth/callback/` pattern) and a `/set-password` page in Phase 1, not as an afterthought — otherwise invited admins hit a dead redirect. `PUBLIC_PATHS` in `middleware.ts` must include `/auth/callback` or the proxy bounces the request before the route handler runs.

Also requires manual Supabase Dashboard config (no MCP/CLI tool covers this): Authentication → URL Configuration (Site URL + Redirect URLs → this repo's Vercel domain), and Authentication → Email Templates (Invite/Reset Password links → token-hash format pointing at `/auth/callback`).

---

## 7. Open items to confirm before/during Phase 1

- Real landing page copy/branding — reuse quail_vending_co's marketing copy as a starting draft, or write new?
- Any current inventory spreadsheet/CSV to seed `products` from?
- Vercel project: create fresh under the `rapopotechnologies` team, linked to this GitHub repo — confirm before running `vercel link`/deploy.
- Who is the first `super_admin` (for the initial invite)?
