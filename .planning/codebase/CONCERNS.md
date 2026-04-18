# Codebase Concerns

**Analysis Date:** 2026-04-16

---

## Security Concerns

**[HIGH] Authentication via Spoofable HTTP Headers**
- Issue: Identity is passed entirely through client-controlled request headers (`x-user-id`, `x-user-username`, `x-user-role`). Any client that knows a valid user ID can impersonate that user or claim admin role by setting `x-user-role: admin`.
- Files: `frontend/src/lib/api.js` (lines 8–16), `backend/middleware/requireCurrentUser.js` (lines 5–7)
- Impact: Any driver can escalate to admin by manually crafting a request. No JWT or session token prevents header forgery.
- Fix approach: Replace custom headers with a signed JWT issued at login. Verify the signature in `backend/middleware/requireCurrentUser.js` so the role and identity cannot be tampered with client-side.

**[HIGH] User Session Stored Entirely in localStorage**
- Issue: The full user object (id, username, role) is stored in `localStorage` as plain JSON with no expiry, no signature, and no integrity check.
- Files: `frontend/src/pages/Login.jsx` (line 26), `frontend/src/lib/auth.js`
- Impact: XSS can trivially steal the session. A persisted attacker can set `role: "admin"` and submit requests directly to the API.
- Fix approach: Store a signed JWT in an `httpOnly` cookie so JavaScript cannot access it. Remove the raw user object from localStorage.

**[HIGH] No Rate Limiting on Auth Endpoints**
- Issue: `POST /api/auth/login` and `POST /api/auth/register` have no request throttling.
- Files: `backend/routes/authRoutes.js`, `backend/server.js`
- Impact: Brute-force and credential-stuffing attacks are unrestricted.
- Fix approach: Add `express-rate-limit` middleware, applied specifically to `/api/auth/*` routes.

**[MEDIUM] CORS Wildcard — All Origins Accepted**
- Issue: `app.use(cors())` uses the default configuration, which allows all origins.
- Files: `backend/server.js` (line 14)
- Impact: Any website can make authenticated cross-origin requests against the API.
- Fix approach: Pass an explicit `origin` allowlist to `cors()`, e.g. `{ origin: process.env.ALLOWED_ORIGIN }`.

**[MEDIUM] Error Messages Expose Internal Detail**
- Issue: Several catch blocks return `error.message` directly in API responses.
- Files: `backend/controllers/authController.js` (line 79), `backend/controllers/packageController.js` (lines 285–293)
- Impact: Stack traces, MongoDB query details, and internal paths can leak to the client.
- Fix approach: Log full errors server-side; return a generic message to the client for 500-class errors.

**[MEDIUM] No Input Length Validation**
- Issue: String fields (`username`, `password`, `packageId`, `description`, `truckId`, locations) have no maximum length enforced in either controller validation or Mongoose schema.
- Files: `backend/controllers/authController.js`, `backend/models/Package.js`, `backend/models/User.js`
- Impact: Malformed oversized payloads can degrade database performance or cause unexpected behaviour.
- Fix approach: Add `maxlength` constraints to Mongoose schemas and reject payloads exceeding limits in the controllers.

**[MEDIUM] Gemini Error Response Body Forwarded to Client**
- Issue: `requestGeminiBriefing` calls `response.text()` on a failed Gemini response and passes it into a thrown `Error`. That error message — which may contain auth-failure detail from Google — then appears in the JSON response body as `warning`.
- Files: `backend/controllers/aiController.js` (lines 406–408, 511)
- Impact: If Google embeds key-related details in error responses, they propagate to the browser.
- Fix approach: Log the raw error server-side only; return a sanitized string in the `warning` field.

---

## Reliability Concerns

**[HIGH] Server Starts Even When Database Connection Fails**
- Issue: In `backend/server.js`, if `connectDatabase()` returns `false` (all connection attempts failed), the server still starts and begins accepting requests. Package routes that require MongoDB will throw unhandled errors at runtime.
- Files: `backend/server.js` (lines 37–57)
- Impact: Silent data loss; requests that mutate packages will fail with 500 errors after the server appears healthy.
- Fix approach: Exit the process (or skip mounting package/AI routes) when `dbConnected` is `false`, and add a health-check endpoint that reflects DB state.

**[HIGH] Dual Storage Mode Creates Inconsistent State**
- Issue: The app switches between MongoDB and a local JSON file (`backend/data/users.json`) based on DB connectivity. Package data only ever goes to MongoDB, but users can land in the flat file. If MongoDB reconnects after a local-mode session, local users cannot be resolved by the package controller.
- Files: `backend/utils/localUserStore.js`, `backend/utils/userDirectory.js`, `backend/controllers/authController.js`
- Impact: Orphaned packages, broken driver lookups, and silent ownership failures in production.
- Fix approach: Remove the local-file fallback from production paths; gate it behind an explicit `DEMO_MODE=true` env var.

**[HIGH] No Error Handling Differentiation on Dashboard Data Loads**
- Issue: `loadDashboardData` fires both fetches but only surfaces errors through a single shared `error` state. A failure in one fetch silently drops the other fetch's data.
- Files: `frontend/src/pages/AdminDashboard.jsx` (lines 93–113), `frontend/src/pages/DriverDashboard.jsx` (lines 53–64)
- Impact: Partial dashboard renders with no indication of what failed.
- Fix approach: Handle each fetch independently with its own error state, or surface which data source failed.

**[MEDIUM] `recordHandlingEvent` Throws on Local-Store Users, Blocking All Package Writes**
- Issue: `recordHandlingEvent` throws a 400 error if `currentUser.id` is not a valid MongoDB ObjectId. Local-store users have IDs prefixed with `local_`, so every package create/update by a local user fails.
- Files: `backend/controllers/packageController.js` (lines 193–196), `backend/utils/localUserStore.js` (line 79)
- Impact: Drivers authenticated via the local fallback cannot create or update any packages.
- Fix approach: Skip handling-event creation gracefully for non-ObjectId user IDs, or ensure local IDs are valid MongoDB ObjectIds.

**[MEDIUM] Double `.save()` on Package Create and Update**
- Issue: `createPackage` and `updatePackage` both call `pkg.save()` twice — once to persist the package, then again after recording the handling event to store `lastHandlingEvent`. If the second save fails, `lastHandlingEvent` is stale.
- Files: `backend/controllers/packageController.js` (lines 339–344, 469–474)
- Impact: Inconsistent `lastHandlingEvent` references with no atomicity guarantee.
- Fix approach: Use a Mongoose session/transaction for the create+handling-event+update sequence.

**[LOW] No Retry Logic on Gemini API Calls**
- Issue: `requestGeminiBriefing` makes a single `fetch` call with no retry on transient network failures or 429 rate-limit responses.
- Files: `backend/controllers/aiController.js` (lines 357–404)
- Impact: AI briefings fall back to the local engine on any transient error, with no attempt to recover.
- Fix approach: Add 1–2 exponential-backoff retries before falling through to local fallback.

---

## Performance Concerns

**[HIGH] No Pagination on Package Listing**
- Issue: `getAllPackages` fetches the entire matching package set with no limit or cursor.
- Files: `backend/controllers/packageController.js` (lines 351–361)
- Impact: Response time and memory usage grow linearly with package count; no upper bound exists.
- Fix approach: Add `limit` and `skip` (or cursor-based) query parameters; default to page size of 50.

**[HIGH] AI Briefing Loads All Packages Unbounded**
- Issue: `generateOpsBriefing` fetches the full package set with nested `.populate()` calls, then aggregates in-memory via `summarizePackages`.
- Files: `backend/controllers/aiController.js` (lines 449–471)
- Impact: With a large dataset, this is a slow, memory-heavy operation on every AI request.
- Fix approach: Use MongoDB `$group` aggregation pipelines for status/delivery breakdowns instead of in-memory JavaScript reduction.

**[MEDIUM] `getDataModelSummary` Runs 7 Concurrent DB Queries on Every Dashboard Load**
- Issue: `Promise.all` fires `countDocuments` x4, a driver directory `find`, and a `HandlingEvent.find` with 3 `populate` calls simultaneously on every admin dashboard mount.
- Files: `backend/controllers/packageController.js` (lines 363–420), `frontend/src/pages/AdminDashboard.jsx` (line 116)
- Impact: Cold-start dashboard loads hammer the database; no caching layer exists.
- Fix approach: Cache summary results server-side with a short TTL (30 seconds) using a simple in-memory map or Redis.

**[MEDIUM] Frontend Filtering Is Entirely Client-Side**
- Issue: Search filtering in both dashboards loads the full package list and filters it in the browser via `useMemo`.
- Files: `frontend/src/pages/AdminDashboard.jsx` (lines 180–215), `frontend/src/pages/DriverDashboard.jsx`
- Impact: All data must be transferred even when the user only needs a subset; becomes worse as package count grows.
- Fix approach: Pass search/filter params as query parameters to `GET /api/packages` and filter server-side once pagination is added.

---

## Maintainability Issues

**[MEDIUM] `buildPayload` Duplicated Between Admin and Driver Dashboards**
- Issue: `buildPayload(formData)` is defined nearly identically in both dashboard pages.
- Files: `frontend/src/pages/AdminDashboard.jsx` (lines 28–40), `frontend/src/pages/DriverDashboard.jsx` (lines 28–39)
- Impact: Bug fixes or field additions must be applied in two places.
- Fix approach: Move to `frontend/src/lib/packageFields.js` alongside the existing form helpers.

**[MEDIUM] Full CRUD Flow Duplicated Across Both Dashboards**
- Issue: The full pattern of fetch-on-mount, form state, `handleSubmit`, `handleEdit`, `handleDelete`, and `resetForm` is implemented separately in both dashboard pages with ~90% overlap.
- Files: `frontend/src/pages/AdminDashboard.jsx`, `frontend/src/pages/DriverDashboard.jsx`
- Impact: Any change to the CRUD flow requires updates in two files.
- Fix approach: Extract a `usePackageCRUD(userRole)` custom hook in `frontend/src/lib/` that encapsulates shared state and API calls.

**[MEDIUM] `packageController.js` Is a 504-Line Monolith**
- Issue: The file mixes domain logic (facility/route resolution, payload building) with HTTP request handling and database operations, with no separation.
- Files: `backend/controllers/packageController.js`
- Impact: Hard to test individual concerns; adding features requires navigating a large file.
- Fix approach: Extract `buildTrackingContext`, `recordHandlingEvent`, and `buildPackagePayload` into a `backend/services/packageService.js` module.

**[MEDIUM] `aiController.js` Is a 516-Line Monolith**
- Issue: Summarization logic, prompt construction, Gemini HTTP call, fallback briefing assembly, and route handler are all in one file.
- Files: `backend/controllers/aiController.js`
- Impact: Cannot test the summarization math independently of the HTTP layer.
- Fix approach: Split into `backend/services/packageAnalytics.js` (summarize, risk scoring) and `backend/services/geminiBriefing.js` (API call, JSON parse), keeping only the route handler in the controller.

**[LOW] Commented-Out Code Left in Production File**
- Issue: Line 409 contains `/*notes: event.notes || "",*/` — a commented-out field with no explanation.
- Files: `backend/controllers/packageController.js` (line 409)
- Fix approach: Remove the comment or implement the `notes` field with a tracked decision.

**[LOW] `nodemon` Listed as a Production Dependency**
- Issue: `nodemon` appears under `dependencies` (not `devDependencies`) in `backend/package.json`.
- Files: `backend/package.json`
- Impact: `nodemon` is installed in production environments unnecessarily.
- Fix approach: Move to `devDependencies`.

---

## Missing Infrastructure

**[HIGH] No Tests — Zero Coverage**
- Issue: No test files exist anywhere in the project. Neither `backend/package.json` nor `frontend/package.json` configure a test runner. The `test` npm script is absent from both.
- Files: `backend/package.json`, `frontend/package.json`
- Impact: Any refactor or feature addition carries zero regression safety. Critical paths (auth flow, package ownership check, facility resolution) are entirely untested.
- Fix approach: Add Vitest to the frontend; add Jest + Supertest to the backend. Prioritise unit tests for `requireCurrentUser.js` middleware and `packageController.js` helper functions.

**[HIGH] No Structured Logging**
- Issue: All backend logging is `console.log`/`console.error` in `backend/server.js` only. Controllers emit nothing on server-side errors beyond what they return in HTTP responses.
- Files: `backend/server.js` (lines 27, 30, 51, 54), `backend/controllers/`
- Impact: No log trail for debugging production failures or alerting on error spikes.
- Fix approach: Introduce `pino` (or `winston`) and log at minimum every 5xx response with method, path, user ID, and sanitized error message.

**[HIGH] No Health Check Endpoint**
- Issue: `GET /` returns `"API Running"` regardless of database connectivity state.
- Files: `backend/server.js` (lines 46–48)
- Impact: Load balancers, uptime monitors, and CI smoke tests cannot determine actual service health.
- Fix approach: Add `GET /api/health` returning `{ status: "ok", db: isMongoConnected() }` with HTTP 503 when the DB is disconnected.

**[MEDIUM] No Schema-Based Request Validation**
- Issue: Input validation is scattered inline across controllers with custom helper functions (`requireField`, manual `if` checks). No validation middleware or schema library is used.
- Files: `backend/controllers/authController.js`, `backend/controllers/packageController.js`
- Impact: Validation logic is inconsistent, hard to audit, and must be re-implemented for each new endpoint.
- Fix approach: Add `zod` schema validation as middleware applied per route in `backend/routes/`.

**[MEDIUM] No Environment Variable Validation on Startup**
- Issue: Missing `MONGODB_URI` silently falls back to local storage; missing `GEMINI_API_KEY` silently skips AI. No startup check warns operators of misconfiguration.
- Files: `backend/server.js`
- Impact: Misconfigured deployments degrade silently rather than failing fast.
- Fix approach: Enumerate expected env vars at startup and log a clear `[WARN]` or throw for each that is absent.

**[MEDIUM] No Frontend Error Boundary**
- Issue: The React app has no `ErrorBoundary` component. An unhandled render error in any page crashes the entire UI to a blank screen.
- Files: `frontend/src/main.jsx`, `frontend/src/App.jsx`
- Impact: Any JS render error shows a blank page with no user feedback.
- Fix approach: Wrap the router in a React `ErrorBoundary` that renders a user-friendly fallback with a reload prompt.

**[LOW] No CI/CD Pipeline**
- Issue: No `.github/workflows/`, `Makefile`, or pre-commit hooks exist.
- Impact: Code merges without automated lint, build, or test checks.
- Fix approach: Add a GitHub Actions workflow that runs `eslint`, `vite build`, and the test suite on every pull request.

---

## Scalability Concerns

**[HIGH] Flat-File User Store Is Not Concurrent-Safe**
- Issue: `localUserStore.js` uses `fs.readFile` / `fs.writeFile` without file locking. Concurrent registrations cause a read-modify-write race that will corrupt `backend/data/users.json`.
- Files: `backend/utils/localUserStore.js` (lines 18–34)
- Impact: Data corruption and lost users under any concurrent load.
- Fix approach: Gate this store behind `NODE_ENV === 'development'` and throw an error if used in production. Long-term, remove it in favour of always requiring MongoDB.

**[MEDIUM] Facility Upsert on Every Package Write**
- Issue: `ensureFacility` issues a `findOneAndUpdate` upsert on every package create and update, called up to 3 times per operation via `buildTrackingContext`.
- Files: `backend/controllers/packageController.js` (lines 108–127, 167–190)
- Impact: Write-heavy workloads generate disproportionate DB load and upsert lock contention on frequently-seen facility names.
- Fix approach: Cache facility lookups in a short-lived in-memory map (keyed by normalized name) per request cycle to avoid redundant round-trips.

**[MEDIUM] Port Hardcoded to 5000**
- Issue: `app.listen(5000, ...)` ignores any `PORT` environment variable.
- Files: `backend/server.js` (line 50)
- Impact: Cannot deploy to platforms (Render, Railway, Heroku) that inject a dynamic `PORT`.
- Fix approach: Change to `app.listen(process.env.PORT || 5000, ...)`.

---

*Concerns audit: 2026-04-16*
