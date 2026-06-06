# BulkSend — "How to Continue" Developer Guide
# Where the project stands and what order to build next

---

## CURRENT STATE (what's already done)

The monorepo has ~108 source files already written:

  - packages/shared      → all TypeScript types, Kafka topic names, payload shapes
  - packages/logger      → Pino structured logger (dev pretty-print, prod GCP JSON)
  - apps/api             → full Express REST API (auth, campaigns, contacts, segments,
                           tracking pixel, SendGrid webhooks, Kafka producer, Prisma ORM)
  - apps/worker          → 4 Kafka consumers (dispatcher, sender, event-worker, DLQ monitor)
                           + Redis rate limiter + suppression cache
  - apps/web             → React 18 + Vite app:
      · Full UI/styles done (tokens.css, app.css, site.css, all components)
      · Marketing landing page done (LandingPage.tsx)
      · Login + Signup pages done AND wired to real API
      · AuthGuard + route tree done
      · Dashboard, Campaigns, Contacts, CampaignDetail, Composer — UI done
        but ALL using hardcoded mock data (no real API calls yet)
  - infra/               → docker-compose (Postgres+Redis+Kafka), schema.sql, seed.ts
  - .github/workflows/   → CI (typecheck/lint/build) + deploy (Cloud Run)

THE BIG GAP: Every protected page after login shows fake data. The API clients
(campaignsApi, contactsApi, segmentsApi) are fully defined but never called.


---

## RECOMMENDED BUILD ORDER

Think in 3 layers: Infrastructure → Auth → Read flows → Write flows → Polish

---

### LAYER 0 — Get the local stack running (do this first, ~20 min)

  1. Install deps
       cd /path/to/bulksend
       pnpm install

  2. Start infrastructure
       cd infra/docker
       cp .env.example .env          # edit passwords if you want
       docker compose up -d          # starts Postgres, Redis, Kafka, Redpanda Console

  3. Run DB migrations + seed
       cd apps/api
       pnpm prisma migrate dev       # applies schema.prisma → creates all tables
       cd ../../infra/db
       pnpm ts-node seed.ts          # loads sample workspace, user, contacts, campaigns

  4. Create Kafka topics
       bash infra/scripts/create-topics.sh

  5. Copy + fill env files
       apps/api/.env         (DATABASE_URL, REDIS_URL, JWT_SECRET, SENDGRID_API_KEY, etc.)
       apps/worker/.env      (same DB/Redis/Kafka vars)

  6. Start all apps in dev mode
       pnpm dev              # turbo runs api + worker + web in parallel

  Why first: nothing else is testable without a running backend.


---

### LAYER 1 — Authentication (already 80% done, just finish it)

  What works NOW:
    - Login page POSTs to /api/v1/auth/login and saves tokens to Zustand
    - Signup page POSTs to /api/v1/auth/signup
    - AuthGuard redirects unauthenticated users to /login

  What's missing:
    a) Logout button — Sidebar has a "Sign out" chip but clicking it does nothing.
       Fix: call authApi.logout() then useAuthStore().clear() then navigate('/login')
       File: apps/web/src/components/layout/Sidebar.tsx

    b) Token expiry UX — if access token expires mid-session, the auto-refresh in
       client.ts fires, but on total failure it silently drops the request.
       Fix: on refresh failure call useAuthStore().clear() + navigate('/login')
       File: apps/web/src/lib/api/client.ts (around line 40)

    c) "Already logged in" redirect — if user visits /login while already logged in,
       they should land on /dashboard.
       Fix: in LoginPage/SignupPage, check isAuthenticated() and navigate away early.

  HOW TO TEST: Sign up → see dashboard → refresh page → still logged in → logout →
  redirected to /login → login again → dashboard. This is your auth smoke test.


---

### LAYER 2 — Read flows (replace mock data with real API calls)

  Wire these pages in this order (each takes ~30 min):

  ── 2a. Dashboard Page ──────────────────────────────────────────────────────
  File: apps/web/src/pages/app/DashboardPage.tsx

  Currently: all KPI values are hardcoded constants at top of file.
  Replace with: GET /api/v1/campaigns (to get recent campaigns + stats)
                Derive totals from the response (sum sent_count, open_count, etc.)

  Pattern to follow:
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    useEffect(() => { campaignsApi.list().then(r => setCampaigns(r.data)); }, []);

  Show a loading skeleton while fetching (add a simple opacity:0.5 pulse).
  The "Recent campaigns" table at the bottom should map over real campaigns.

  ── 2b. Campaigns List Page ─────────────────────────────────────────────────
  File: apps/web/src/pages/app/CampaignsPage.tsx

  Currently: 6 hardcoded campaigns array.
  Replace with: campaignsApi.list() → render real rows
  Also wire the status filter tabs to pass ?status=draft|sending|sent to the API.

  ── 2c. Campaign Detail Page ────────────────────────────────────────────────
  File: apps/web/src/pages/app/CampaignDetailPage.tsx

  Currently: hardcoded engagement data.
  Replace with: campaignsApi.getStats(id) (or campaignsApi.get(id) which returns
  open_count, click_count, bounce_count, sent_count from the campaigns table).

  ── 2d. Contacts Page ───────────────────────────────────────────────────────
  File: apps/web/src/pages/app/ContactsPage.tsx

  Currently: 12 procedurally-generated contacts, no API.
  Replace with: contactsApi.list(workspaceId, { page, search }) → render rows
  Add real pagination (the API returns PaginatedResponse<Contact>).

  WHY THIS ORDER: Read flows are safer — they can't corrupt data if something
  goes wrong. Get reads working and testable before tackling writes.


---

### LAYER 3 — Write flows (the hard part)

  ── 3a. Campaign Composer — Save & Send ────────────────────────────────────
  File: apps/web/src/pages/app/CampaignComposerPage.tsx

  Currently: 4-step form with a "Send" button that only sets local state.
  Replace with:
    Step 1-3: call campaignsApi.create(draft) or campaignsApi.patch(id, draft)
              so the campaign is saved as a draft as the user moves through steps.
    Final step Send button: call campaignsApi.send(id) → backend produces to
              campaign.dispatch Kafka topic → worker fans out.
    After send: navigate to /campaigns/:id to watch progress live.

  ── 3b. Contacts — CSV Import ───────────────────────────────────────────────
  File: apps/web/src/pages/app/ContactsPage.tsx

  The "Import CSV" button exists in the UI (#importBtn) but does nothing.
  Wire it to:
    <input type="file" accept=".csv"> (hidden, triggered by button click)
    Read the file → POST to /api/v1/contacts/import as multipart/form-data
    Show a progress/result toast: "Imported 1,240 contacts"

  ── 3c. Contacts — Unsubscribe & Status actions ─────────────────────────────
  The three-dot (⋯) menu on each contact row is rendered but has no handlers.
  Wire it to: contactsApi.update(id, { status: 'unsubscribed' }) etc.

  ── 3d. Campaign scheduling ─────────────────────────────────────────────────
  The Composer's Schedule step has a date/time picker (step index 2).
  Wire the "Schedule" button to campaignsApi.schedule(id, scheduledAt).


---

### LAYER 4 — Replace placeholder pages

  These 4 routes show "Coming soon" (PlaceholderPage):
    /segments   /analytics   /events   /settings

  Build them in this priority order:

  Priority 1 — Settings (needed early because it sets workspace config)
    - Workspace name, from-email, send rate — GET/PATCH /api/v1/workspaces/:id
    - Team members list (no invite API yet, can stay stub)
    - API keys display (placeholder for now)

  Priority 2 — Segments
    - List view: GET /api/v1/segments
    - Create form: POST /api/v1/segments with a filter builder
      (simplest filter builder: field dropdown + op dropdown + value input)

  Priority 3 — Analytics
    - Aggregate charts across all campaigns over time
    - This requires the most data; build it last

  Priority 4 — Event Stream
    - Live feed of opens/clicks/bounces
    - Ideal with Server-Sent Events or polling GET /api/v1/events


---

### LAYER 5 — Polish & Production readiness

  a) Error boundaries — wrap routes in a React ErrorBoundary so one broken page
     doesn't crash the whole app.

  b) Loading states — every API call needs a loading spinner or skeleton.
     Currently pages show nothing while fetching (useEffect fires after first render).

  c) Toast notifications — success/error feedback after mutations.
     Install react-hot-toast (1 pkg) and show toasts for create/save/send/import.

  d) Mobile responsiveness — the app.css has responsive breakpoints, but test on
     a real mobile viewport and fix any overflow issues.

  e) Empty states — when a new user signs up, all lists are empty.
     Add friendly empty-state components: "No campaigns yet. Create your first one."

  f) Prisma migrations — before shipping, run `prisma migrate deploy` instead of
     `prisma migrate dev`. The CI/CD workflow should do this automatically on deploy.


---

## WHICH APPROACH IS BETTER?

There are two common paths when you have a UI-complete but data-less frontend:

  OPTION A — "Mock-first": Keep mock data, add a toggle (e.g. USE_MOCK=true env var)
             so developers can work on UI without a backend running.
  OPTION B — "API-first":  Replace mock data with real API calls immediately.
             Block on backend being available.

  RECOMMENDATION: Go OPTION B (API-first).

  Reasons:
  - The backend is ALREADY written and testable via docker compose. No need for mocks.
  - The API clients (campaignsApi, contactsApi, etc.) are already defined and typed.
  - Mock data creates a false sense of "working" — edge cases (empty state, error state,
    pagination) only appear with real data.
  - Mocks double the code to maintain. Since you have a real backend, skip the overhead.

  The only exception: if you need to demo the UI without infrastructure, you can
  temporarily add a ?demo=true URL param that returns the hardcoded data — then
  remove it once the backend is wired.


---

## QUICK-START CHECKLIST (copy this as your TODO)

  [ ] pnpm install
  [ ] docker compose up -d  (from infra/docker/)
  [ ] pnpm prisma migrate dev  (from apps/api/)
  [ ] fill apps/api/.env and apps/worker/.env
  [ ] pnpm dev  (from repo root)
  [ ] Test login → redirects to /dashboard
  [ ] Wire Sidebar logout button
  [ ] Replace DashboardPage hardcoded data with campaignsApi.list()
  [ ] Replace CampaignsPage hardcoded data with campaignsApi.list()
  [ ] Replace ContactsPage hardcoded data with contactsApi.list()
  [ ] Replace CampaignDetailPage hardcoded stats with campaignsApi.get(id)
  [ ] Wire CampaignComposer Save → campaignsApi.create()
  [ ] Wire CampaignComposer Send → campaignsApi.send(id)
  [ ] Wire ContactsPage CSV import button
  [ ] Build Settings page (GET/PATCH workspace)
  [ ] Build Segments page
  [ ] Add loading states + empty states to all pages
  [ ] Add toast notifications for mutations


---

## KEY FILES TO KNOW

  API clients (already written, just call them):
    apps/web/src/lib/api/campaigns.ts     → campaignsApi.list / get / create / send
    apps/web/src/lib/api/contacts.ts      → contactsApi.list / create / import
    apps/web/src/lib/api/segments.ts      → segmentsApi.list / create
    apps/web/src/lib/api/auth.ts          → authApi.login / signup / logout

  Auth state:
    apps/web/src/stores/auth.store.ts     → useAuthStore() → workspaceId, accessToken

  Pages to modify:
    apps/web/src/pages/app/DashboardPage.tsx
    apps/web/src/pages/app/CampaignsPage.tsx
    apps/web/src/pages/app/CampaignDetailPage.tsx
    apps/web/src/pages/app/CampaignComposerPage.tsx
    apps/web/src/pages/app/ContactsPage.tsx
    apps/web/src/components/layout/Sidebar.tsx   (logout button)

  Backend routes (already implemented):
    GET  /api/v1/campaigns            → list campaigns for workspace
    POST /api/v1/campaigns            → create draft
    POST /api/v1/campaigns/:id/send   → trigger Kafka fan-out
    GET  /api/v1/contacts             → paginated contact list
    POST /api/v1/contacts/import      → CSV upload
    GET  /api/v1/segments             → list segments


---

## ESTIMATED TIME

  Layer 0 (infra setup):         ~30 min
  Layer 1 (auth finish):         ~1 hour
  Layer 2 (read flows):          ~2-3 hours
  Layer 3 (write flows):         ~3-4 hours
  Layer 4 (placeholder pages):   ~4-6 hours
  Layer 5 (polish):              ~2-3 hours
  ─────────────────────────────
  Total to "production-ready":   ~13-17 hours of coding

  If you tackle one layer per session, you'll have a fully working app in about
  5 focused work sessions.
