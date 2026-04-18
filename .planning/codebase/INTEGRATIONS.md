# External Integrations

**Analysis Date:** 2026-04-16

## APIs & External Services

**Google Gemini AI:**
- Service: Google Generative Language API (`generativelanguage.googleapis.com`)
- Used for: AI-powered logistics operations briefing ("Pulse AI") that analyzes package, route, facility, and driver data
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- SDK/Client: Raw `fetch()` — no official Google SDK; direct REST calls
- Auth: `x-goog-api-key` header populated from `GEMINI_API_KEY` env var
- Implementation: `backend/controllers/aiController.js` (`requestGeminiBriefing` function)
- Model: Configurable via `GEMINI_MODEL` env var; defaults to `gemini-2.5-flash`
- Degradation: Full local fallback (`buildLocalBriefing`) when `GEMINI_API_KEY` is absent or the API call fails — the endpoint never errors out, it returns `source: "local-fallback"`

## Data Storage

**Databases:**
- MongoDB (primary)
  - Connection env var: `MONGODB_URI` (remote, e.g. Atlas)
  - Local fallback: `MONGODB_LOCAL_URI` defaults to `mongodb://127.0.0.1:27017/packet-tracker`
  - Client: Mongoose `^9.2.3`
  - Connection strategy: Server tries primary URI first; falls back to local URI on failure (`backend/server.js` `connectDatabase()`)
  - Collections (via Mongoose models): `users`, `packages`, `facilities`, `routes`, `handlingevents`

- JSON flat file (local auth fallback)
  - Path: `backend/data/users.json` (auto-created on first run)
  - Used only when MongoDB is unavailable
  - Implementation: `backend/utils/localUserStore.js`

**File Storage:**
- Local filesystem only (for `backend/data/users.json` fallback store)

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- Custom — no third-party auth service (no JWT library, no OAuth)
- Mechanism: Username + bcrypt-hashed password stored in MongoDB (or flat file fallback)
- Session: Stateless; after login the server returns `{ id, username, role }` which the frontend stores in `localStorage` (`frontend/src/lib/auth.js`)
- Request auth: Custom HTTP headers on every API call — `x-user-id`, `x-user-username`, `x-user-role` (set by axios interceptor in `frontend/src/lib/api.js`, validated by `backend/middleware/requireCurrentUser.js`)
- No JWT tokens, no session cookies, no refresh tokens
- Password hashing: bcryptjs with salt rounds = 10 (`backend/models/User.js`, `backend/utils/localUserStore.js`)

**Roles:**
- `admin` - Full access to all packages, facilities, routes, handling events
- `driver` - Scoped to own packages (`ownerUserId` filter)

## Monitoring & Observability

**Error Tracking:**
- None — no Sentry, Datadog, or similar

**Logs:**
- `console.log` / `console.error` only; no structured logging library

## CI/CD & Deployment

**Hosting:**
- No deployment configuration detected (no Dockerfile, Heroku Procfile, Vercel config, or GitHub Actions workflows)

**CI Pipeline:**
- None detected

## Environment Configuration

**Backend required env vars (`backend/.env.example`):**
- `MONGODB_URI` - Remote MongoDB connection string (optional; falls back to local)
- `MONGODB_LOCAL_URI` - Local MongoDB URI (defaults to `mongodb://127.0.0.1:27017/packet-tracker`)
- `GEMINI_API_KEY` - Google Gemini API key (optional; AI feature gracefully disabled without it)
- `GEMINI_MODEL` - Gemini model name (defaults to `gemini-2.5-flash`)

**Frontend required env vars (`frontend/.env.example`):**
- `VITE_API_BASE_URL` - Backend API base URL (defaults to `http://localhost:5000/api`)

**Secrets location:**
- `.env` and `.env.local` in `backend/` (gitignored via `backend/.gitignore`)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None — the only outbound HTTP call is to the Gemini REST API from `backend/controllers/aiController.js`

---

*Integration audit: 2026-04-16*
