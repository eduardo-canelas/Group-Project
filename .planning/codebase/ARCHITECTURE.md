# Architecture

**Analysis Date:** 2026-04-16

## Pattern Overview

**Overall:** Three-tier MVC web application (React SPA → Express REST API → MongoDB)

**Key Characteristics:**
- Stateless REST API — no server-side sessions; identity travels in custom HTTP headers on every request
- Role-based access control at two levels: route middleware (all authenticated users) and controller logic (admin vs. driver scoping)
- Dual-storage fallback: MongoDB is the primary store; when Mongo is unreachable the backend falls back to a local JSON file (`backend/data/users.json`) for user records only
- AI briefings are served from the backend using either Google Gemini (if `GEMINI_API_KEY` is set) or a deterministic local engine built from live package data
- Frontend state is purely local React state — no Redux, Zustand, or query cache; data is re-fetched after every mutation

## Layers

**Frontend SPA:**
- Purpose: Render UI, collect user input, call the REST API
- Location: `frontend/src/`
- Contains: Pages, reusable UI components, lib helpers (api client, auth, field definitions, package analytics)
- Depends on: Backend REST API via `frontend/src/lib/api.js`
- Used by: End users via browser

**Express REST API:**
- Purpose: Validate identity, enforce access rules, orchestrate business logic, persist data
- Location: `backend/`
- Contains: Routes, controllers, middleware, models, utilities
- Depends on: MongoDB (primary) or local JSON file (fallback)
- Used by: Frontend SPA exclusively

**Data Layer:**
- Purpose: Persist all domain entities
- Location: MongoDB (configured via `MONGODB_URI` env var) with fallback at `backend/data/users.json`
- Contains: User, Package, Facility, Route, HandlingEvent collections
- Depends on: Mongoose ODM (`backend/models/`)
- Used by: Controllers via Mongoose model methods

## Data Flow

**Standard authenticated request (e.g., GET /api/packages):**

1. Frontend reads stored user from `localStorage` via `frontend/src/lib/auth.js:getStoredUser()`
2. Axios interceptor in `frontend/src/lib/api.js` attaches three headers to every request: `x-user-id`, `x-user-username`, `x-user-role`
3. Express receives the request and runs `backend/middleware/requireCurrentUser.js`
4. Middleware reads the three headers, calls `backend/utils/userDirectory.js:findUserById()` to verify the user exists in MongoDB (or local store), then cross-checks the returned username and role against the header values
5. On success, middleware sets `req.currentUser` and calls `next()`
6. Controller (`backend/controllers/packageController.js`) queries packages filtered by role: admins see all, drivers see only their own (`ownerUserId === currentUser.id`)
7. Response JSON is returned; frontend updates local React state

**Package create/update flow:**

1. Form submission calls `api.post('/packages', payload)` or `api.put('/packages/:id', payload)`
2. `packageController.buildPackagePayload()` strips to allowed fields (admins can set `ownerUsername`; drivers cannot)
3. `buildTrackingContext()` upserts Facility documents for pickup and dropoff locations (and a transit facility when `status === 'in_transit'`), then upserts a Route linking the two facilities
4. Package is saved with references to `route` and `currentFacility`
5. `recordHandlingEvent()` creates a HandlingEvent document recording the event type, facility, route, user, and a status snapshot
6. Package is saved again with `lastHandlingEvent` pointing to the new event

**AI briefing flow:**

1. User submits a prompt from `frontend/src/components/ai-assistant.jsx`
2. POST to `/api/ai/ops-briefing` with `{ prompt, perspective }`
3. `backend/controllers/aiController.js:generateOpsBriefing()` fetches all relevant packages (admin: all; driver: own), plus facility/route/event counts, in a single `Promise.all`
4. `summarizePackages()` runs a local risk-scoring algorithm (status weight + staleness + quantity) and builds route/facility/driver pressure breakdowns
5. `buildLocalBriefing()` assembles a complete structured briefing object from the local analysis
6. If `GEMINI_API_KEY` is present, the fallback briefing + raw backend context is sent to the Gemini REST API (`gemini-2.5-flash` by default); the response is parsed and merged over the local briefing
7. If Gemini is unavailable or returns invalid JSON, the local briefing is returned with `source: 'local-fallback'`
8. Response includes `{ briefing, source, model, warning, generatedAt }`

**State Management (frontend):**
- No global state manager. Each page (`AdminDashboard`, `DriverDashboard`) holds its own `useState` for packages, form data, error messages, and UI state (editingId, loadingId, search)
- `useMemo` is used for derived values: filtered package lists, driver summaries, status counts, priority queues, and leaderboard data — all computed from the `packages` array in memory
- `useDeferredValue` is used for the search input to keep the UI responsive during filtering
- Theme preference is stored in `localStorage` via `frontend/src/components/theme.jsx` and applied as a `data-theme` attribute on `document.documentElement`
- Authenticated user object (`{ id, username, role }`) is stored in `localStorage` and read synchronously at route guard evaluation time

## Key Abstractions

**requireCurrentUser middleware:**
- Purpose: Validate every protected request by re-verifying the user against the database on each call (stateless session replacement)
- File: `backend/middleware/requireCurrentUser.js`
- Pattern: Express middleware; populates `req.currentUser`

**userDirectory utility:**
- Purpose: Abstract user lookup across MongoDB and the local JSON fallback so controllers never branch on storage type
- File: `backend/utils/userDirectory.js`
- Pattern: Adapter / strategy — `isMongoConnected()` switches implementations at runtime

**localUserStore utility:**
- Purpose: Provide user persistence when MongoDB is unavailable using a flat JSON file
- File: `backend/utils/localUserStore.js`
- Storage: `backend/data/users.json`

**api.js Axios instance:**
- Purpose: Centralize base URL and automatically inject auth headers on every request
- File: `frontend/src/lib/api.js`
- Pattern: Axios instance with a request interceptor

**buildTrackingContext / ensureFacility / ensureRoute:**
- Purpose: Auto-create or upsert Facility and Route documents from free-text location strings whenever a package is created or updated
- File: `backend/controllers/packageController.js` (lines 108-190)
- Pattern: Upsert-on-write — facilities and routes are created lazily, not pre-seeded

**summarizePackages (AI engine):**
- Purpose: Compute risk scores, route/facility/driver pressure rankings from raw package data for use in both the local briefing and the Gemini prompt
- File: `backend/controllers/aiController.js` (lines 87-192)
- Pattern: Pure in-memory analytics function; no DB writes

## Entry Points

**Backend server:**
- Location: `backend/server.js`
- Triggers: `node server.js` (prod) or `nodemon server.js` (dev)
- Responsibilities: Connect to MongoDB with primary/fallback URI logic, mount route groups, start HTTP server on port 5000

**Frontend SPA:**
- Location: `frontend/src/main.jsx`
- Triggers: Vite dev server or built static files served by any HTTP host
- Responsibilities: Mount React tree into the DOM

**App router:**
- Location: `frontend/src/App.jsx`
- Responsibilities: Defines four routes (`/`, `/register`, `/admin`, `/driver`), enforces `PublicOnly` and `RequireRole` guards based on `localStorage` user object

## Authentication Flow

1. User submits credentials to `POST /api/auth/login`
2. `backend/controllers/authController.js:login()` looks up the user by username (Mongo or local store), runs `bcrypt.compare()` against the stored hash
3. On success, the server returns `{ id, username, role }` — no JWT or session token is issued
4. Frontend stores the object in `localStorage` via `Login.jsx:localStorage.setItem('user', JSON.stringify(response.data))`
5. Every subsequent API call attaches `x-user-id`, `x-user-username`, `x-user-role` headers via the Axios interceptor
6. `requireCurrentUser` middleware re-fetches the user by ID from the database on every request to ensure the account still exists and the headers have not been tampered with
7. Logout clears `localStorage` via `frontend/src/lib/auth.js:clearStoredUser()` and redirects to `/`

## Data Models

**User** (`backend/models/User.js`):
- `username` String (required, unique)
- `password` String (bcrypt-hashed via pre-save hook)
- `role` String enum: `admin` | `driver` (default: `driver`)

**Package** (`backend/models/Package.js`):
- `packageId` String
- `description` String (required)
- `amount` Number (min: 0)
- `weight` Number (min: 0)
- `deliveryType` String enum: `store` | `residential` | `return` | `transfer` (default: `store`)
- `truckId` String
- `pickupLocation` String
- `dropoffLocation` String
- `status` String enum: `pending` | `picked_up` | `in_transit` | `delivered` | `lost` | `returned` | `cancelled` (default: `in_transit`)
- `ownerUserId` String (indexed)
- `ownerUsername` String
- `createdByRole` String enum: `admin` | `driver`
- `route` ObjectId ref: Route
- `currentFacility` ObjectId ref: Facility
- `lastHandlingEvent` ObjectId ref: HandlingEvent

**Facility** (`backend/models/Facility.js`):
- `name` String (required)
- `normalizedName` String (unique, lowercase — used as upsert key)
- `location` String enum: `warehouse` | `distributionCenter` | `retailStore` | `customerAddress` | `inTransit`

**Route** (`backend/models/Route.js`):
- `startFacility` ObjectId ref: Facility (required)
- `endFacility` ObjectId ref: Facility (required)
- Unique compound index on `{ startFacility, endFacility }`

**HandlingEvent** (`backend/models/HandlingEvent.js`):
- `package` ObjectId ref: Package (required)
- `facility` ObjectId ref: Facility (required)
- `user` ObjectId ref: User (required)
- `route` ObjectId ref: Route (required)
- `eventType` String enum: `received` | `loaded` | `unloaded` | `assigned` | `inTransit`
- `statusSnapshot` String enum: same as Package.status
- Index on `{ package, timeStamp }`

HandlingEvent serves as the many-to-many join table between Package and Facility, recording every movement with the responsible user and route.

## Error Handling

**Strategy:** Errors surface to the user as inline Alert banners; the backend returns structured `{ message, error }` JSON bodies with appropriate HTTP status codes.

**Patterns:**
- Backend controllers wrap all async logic in try/catch and call a shared `handlePackageError(res, action, error)` helper that maps Mongoose error types (duplicate key code 11000, ValidationError) to 400; unknown errors to 500
- Auth and middleware errors return early with explicit status codes (400, 401, 403, 500)
- Frontend pages catch Axios errors and extract `requestError.response?.data?.message` for display; a fallback string is shown when no server message is available
- AI briefing errors in `aiController` are caught per-layer: Gemini network failures fall back to the local engine silently (with a `warning` field in the response); only total failures return a 500

## Cross-Cutting Concerns

**Logging:** `console.log` / `console.error` on the backend; no structured logger
**Validation:** Input normalization via `normalizeString()` / `normalizeNumber()` helpers in `backend/utils/userDirectory.js` and `backend/controllers/packageController.js`; Mongoose schema constraints; field whitelist via `pickAllowedFields()`
**Authentication:** Header-based stateless identity; `requireCurrentUser` middleware re-validates on every protected request; passwords hashed with bcryptjs (salt rounds: 10)
**Theme:** Dark/light preference persisted to `localStorage` under key `packet-tracker-theme`, applied via CSS custom properties scoped to `data-theme` on the HTML root element

---

*Architecture analysis: 2026-04-16*
