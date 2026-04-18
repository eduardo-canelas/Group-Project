# Codebase Structure

**Analysis Date:** 2026-04-16

## Directory Layout

```
Group-Project/
├── backend/                  # Express REST API (Node.js / CommonJS)
│   ├── controllers/          # Business logic handlers
│   ├── data/                 # Runtime JSON fallback store (users.json)
│   ├── middleware/           # Express middleware
│   ├── models/               # Mongoose schemas
│   ├── routes/               # Express router definitions
│   ├── utils/                # Shared utilities (user lookup, local store)
│   └── server.js             # Entry point — DB connect + server start
├── frontend/                 # React SPA (Vite / ES modules)
│   ├── dist/                 # Built output (generated, not committed)
│   ├── public/               # Static assets served at root
│   └── src/
│       ├── assets/           # Images / static imports
│       ├── components/       # Reusable UI primitives and feature components
│       ├── lib/              # Non-UI helpers (API client, auth, field config, analytics)
│       ├── pages/            # Full-page route components
│       ├── App.jsx           # Router + route guards
│       ├── index.css         # Global CSS / Tailwind base + custom tokens
│       └── main.jsx          # React DOM mount point
├── .planning/codebase/       # GSD codebase analysis documents
├── slides/                   # Presentation slide assets
└── package.json              # Root (minimal, not a monorepo workspace)
```

## Directory Purposes

**`backend/controllers/`:**
- Purpose: Handle HTTP requests, apply business rules, call models
- Key files:
  - `authController.js` — register and login, dual MongoDB/local path
  - `packageController.js` — full CRUD for packages plus tracking context (facility/route upserts, handling events)
  - `aiController.js` — risk scoring, local briefing generation, Gemini API integration

**`backend/models/`:**
- Purpose: Mongoose schemas defining all database collections
- Key files:
  - `User.js` — username, bcrypt password, role
  - `Package.js` — core domain entity with refs to Route, Facility, HandlingEvent
  - `Facility.js` — named location nodes (warehouse, distributionCenter, retailStore, customerAddress, inTransit)
  - `Route.js` — directed link between two Facility documents
  - `HandlingEvent.js` — audit log joining Package + Facility + User + Route per status change

**`backend/routes/`:**
- Purpose: Map HTTP verbs and paths to controller functions; apply middleware
- Key files:
  - `authRoutes.js` — public routes: `POST /api/auth/register`, `POST /api/auth/login`
  - `packageRoutes.js` — protected routes (all behind `requireCurrentUser`): CRUD on `/api/packages`
  - `aiRoutes.js` — protected route: `POST /api/ai/ops-briefing`

**`backend/middleware/`:**
- Purpose: Cross-cutting request processing
- Key files:
  - `requireCurrentUser.js` — reads `x-user-id/username/role` headers, verifies against DB, sets `req.currentUser`

**`backend/utils/`:**
- Purpose: Shared logic not tied to a single controller
- Key files:
  - `userDirectory.js` — unified `findUserById` / `findUserByUsername` that routes to Mongo or localUserStore
  - `localUserStore.js` — reads/writes `backend/data/users.json`; used when MongoDB is offline

**`backend/data/`:**
- Purpose: Runtime-created JSON file store for users when MongoDB is unavailable
- Contains: `users.json` (auto-created; not committed to git)
- Generated: Yes. Committed: No.

**`frontend/src/pages/`:**
- Purpose: Full-screen views rendered by the router
- Key files:
  - `Login.jsx` — login form; stores user in localStorage on success; redirects by role
  - `Register.jsx` — account creation form
  - `AdminDashboard.jsx` — admin-only view: package CRUD, driver summaries, analytics, AI assistant
  - `DriverDashboard.jsx` — driver-only view: own packages, status updates, AI assistant

**`frontend/src/components/`:**
- Purpose: Reusable UI building blocks; no routing logic
- Key files:
  - `ui.jsx` — full design system: `AppShell`, `GlassCard`, `SurfacePanel`, `MetricCard`, `PageTitle`, `SectionHeading`, `PrimaryButton`, `SecondaryButton`, `TextInput`, `SelectInput`, `TextArea`, `Field`, `Alert`, `StatusBadge`, `GhostChip`, `EmptyState`, `PageFrame`
  - `ai-assistant.jsx` — self-contained AI briefing panel with GSAP animations; calls `POST /api/ai/ops-briefing`
  - `theme.jsx` — `ThemeProvider` context, `useTheme` hook, `ThemeToggle` button
  - `motion.jsx` — `usePageMotion` hook wrapping GSAP page-entry animations

**`frontend/src/lib/`:**
- Purpose: Framework-agnostic helper modules
- Key files:
  - `api.js` — Axios instance with base URL and auth header interceptor; import this everywhere instead of bare `axios`
  - `auth.js` — `getStoredUser()` and `clearStoredUser()` operating on `localStorage`
  - `packageFields.js` — `createPackageForm()` (blank form state), `mapPackageToForm()` (populate form from API response), `statusOptions`, `deliveryTypeOptions`
  - `packageInsights.js` — pure functions for client-side analytics: `getStatusCounts()`, `getDeliveryMix()`, `getPriorityPackages()`, `getDriverLeaderboard()`

## Key File Locations

**Entry Points:**
- `backend/server.js` — starts Express on port 5000
- `frontend/src/main.jsx` — mounts React app
- `frontend/src/App.jsx` — defines all client-side routes and guards

**Configuration:**
- `backend/.env.example` — documents required backend env vars
- `frontend/.env.example` — documents required frontend env vars (`VITE_API_BASE_URL`)
- `frontend/src/index.css` — all CSS custom properties (design tokens for colors, spacing, theme variants)

**Core Logic:**
- `backend/controllers/packageController.js` — the heaviest file; handles package CRUD plus automatic Facility/Route/HandlingEvent creation
- `backend/controllers/aiController.js` — risk scoring engine and Gemini integration
- `backend/middleware/requireCurrentUser.js` — authentication gate for all protected routes
- `backend/utils/userDirectory.js` — storage-agnostic user lookup

**UI System:**
- `frontend/src/components/ui.jsx` — single file exports the entire component library

## How Routes Are Organized

**Backend routes — three groups mounted in `backend/server.js`:**
```
/api/auth     → backend/routes/authRoutes.js    (public)
/api/packages → backend/routes/packageRoutes.js  (requireCurrentUser)
/api/ai       → backend/routes/aiRoutes.js       (requireCurrentUser)
```

Each route file uses `express.Router()` and imports its corresponding controller file by name (1:1 mapping).

**Frontend routes — defined in `frontend/src/App.jsx` using React Router v7:**
```
/           → Login.jsx         (PublicOnly guard)
/register   → Register.jsx      (PublicOnly guard)
/admin      → AdminDashboard.jsx (RequireRole: admin)
/driver     → DriverDashboard.jsx (RequireRole: driver)
```

Route guards are inline components (`PublicOnly`, `RequireRole`) that read `localStorage` synchronously and redirect with `<Navigate replace>` before rendering the protected page.

## How Components Are Organized

All reusable UI is exported from a single file: `frontend/src/components/ui.jsx`. There are no subdirectories under `components/`. Feature-specific components are also individual files at the same level:

- Layout/shell: `AppShell`, `PageFrame`, `PageTitle`
- Content containers: `GlassCard`, `SurfacePanel`, `MetricCard`
- Form controls: `TextInput`, `SelectInput`, `TextArea`, `Field`
- Feedback: `Alert`, `StatusBadge`, `EmptyState`, `GhostChip`
- Feature panels: `ai-assistant.jsx` (AI briefing), `theme.jsx` (theme context + toggle), `motion.jsx` (page animations)

## Backend Route / Controller / Model Organization

The pattern is a strict 1:1:N mapping:

```
Route file            Controller file             Models used
authRoutes.js     →   authController.js       →   User
packageRoutes.js  →   packageController.js    →   Package, Facility, Route, HandlingEvent, User
aiRoutes.js       →   aiController.js         →   Package, Facility, Route, HandlingEvent
```

Each route file mounts `requireCurrentUser` for the entire router before any route handler (except auth routes, which are public).

## Naming Conventions

**Files:**
- Backend: camelCase for all files (`packageController.js`, `localUserStore.js`)
- Frontend components: PascalCase (`AdminDashboard.jsx`, `Login.jsx`)
- Frontend lib: camelCase (`api.js`, `packageFields.js`)

**Directories:**
- All lowercase, singular nouns (`controllers/`, `models/`, `routes/`, `pages/`, `components/`, `lib/`)

## Where to Add New Code

**New API resource (e.g., trucks):**
- Model: `backend/models/Truck.js`
- Controller: `backend/controllers/truckController.js`
- Route: `backend/routes/truckRoutes.js` (add `router.use(requireCurrentUser)` at top)
- Mount: `backend/server.js` → `app.use('/api/trucks', truckRoutes)`

**New page/route:**
- Page component: `frontend/src/pages/NewPage.jsx`
- Register in: `frontend/src/App.jsx` — add a `<Route>` with appropriate guard

**New reusable UI component:**
- Add export to: `frontend/src/components/ui.jsx`
- Import from pages/components via named import: `import { MyComponent } from '../components/ui'`

**New client-side utility:**
- Add to: `frontend/src/lib/` as a new file or export from an existing lib file

**New analytics function (client-side, pure):**
- Add to: `frontend/src/lib/packageInsights.js`

## Special Directories

**`frontend/dist/`:**
- Purpose: Vite build output
- Generated: Yes. Committed: No (in `.gitignore`).

**`backend/data/`:**
- Purpose: Runtime fallback user store
- Generated: Yes (auto-created by `localUserStore.js`). Committed: No.

**`.planning/codebase/`:**
- Purpose: GSD map-codebase analysis documents consumed by plan-phase and execute-phase
- Generated: By GSD agents. Committed: At developer discretion.

---

*Structure analysis: 2026-04-16*
