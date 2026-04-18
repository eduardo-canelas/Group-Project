# Technology Stack

**Analysis Date:** 2026-04-16

## Languages

**Primary:**
- JavaScript (ES2020+) - Used throughout both frontend and backend
- JSX - React component markup in frontend

**Secondary:**
- None detected

## Runtime

**Environment:**
- Node.js - Backend runtime (version not pinned; no `.nvmrc` present)

**Package Manager:**
- npm - Used for both frontend and backend
- Lockfile: `frontend/package-lock.json` present; backend lockfile not detected in repo root

## Frameworks

**Core (Frontend):**
- React `^19.2.4` - UI rendering (`frontend/src/main.jsx`, `frontend/src/App.jsx`)
- React Router DOM `^7.13.2` - Client-side routing (`frontend/src/App.jsx`)
- Tailwind CSS `^4.2.2` - Utility-first styling (integrated via Vite plugin)
- GSAP `^3.15.0` + `@gsap/react ^2.1.2` - Animation library (`frontend/src/components/motion.jsx`)

**Core (Backend):**
- Express `^5.2.1` - HTTP server and routing (`backend/server.js`)
- Mongoose `^9.2.3` - MongoDB ODM (`backend/models/`)

**Build/Dev:**
- Vite `^8.0.1` - Frontend bundler and dev server (`frontend/vite.config.js`)
- `@vitejs/plugin-react ^6.0.1` - React fast-refresh support
- `@tailwindcss/vite ^4.2.2` - Tailwind v4 Vite integration (replaces PostCSS approach)
- nodemon `^3.1.14` - Backend dev auto-restart (listed under dependencies, not devDependencies)

**Testing:**
- No testing framework detected

## Key Dependencies

**Critical:**
- `mongoose ^9.2.3` - All data models depend on this (`backend/models/Package.js`, `backend/models/User.js`, `backend/models/Facility.js`, `backend/models/Route.js`, `backend/models/HandlingEvent.js`)
- `bcryptjs ^3.0.3` - Password hashing in `backend/models/User.js` and `backend/utils/localUserStore.js`
- `axios ^1.14.0` - HTTP client used in all frontend API calls (`frontend/src/lib/api.js`)
- `dotenv ^17.3.1` - Env variable loading in `backend/server.js` (loads both `.env` and `.env.local`)

**Infrastructure:**
- `cors ^2.8.6` - Unrestricted CORS enabled globally in `backend/server.js` (no origin whitelist)
- `mongodb ^7.1.0` - Underlying MongoDB driver (peer of mongoose)

## Configuration

**Environment:**
- Backend reads `.env` then `.env.local` (local overrides primary); key vars: `MONGODB_URI`, `MONGODB_LOCAL_URI`, `GEMINI_API_KEY`, `GEMINI_MODEL`
- Frontend reads `VITE_API_BASE_URL` at build time; defaults to `http://localhost:5000/api`
- `.env.example` files present in both `frontend/` and `backend/` as reference templates

**Build:**
- `frontend/vite.config.js` - Vite config with React and Tailwind plugins
- `frontend/eslint.config.js` - Flat ESLint config (ESLint v9 format), targets `.js` and `.jsx` files
- Root `package.json` is empty `{}` — no monorepo orchestration scripts

## Module System

- **Backend:** CommonJS (`"type": "commonjs"` in `backend/package.json`); uses `require()`/`module.exports`
- **Frontend:** ES Modules (`"type": "module"` in `frontend/package.json`); uses `import`/`export`

## Platform Requirements

**Development:**
- Node.js (version unspecified)
- MongoDB local instance at `mongodb://127.0.0.1:27017/packet-tracker` (fallback when `MONGODB_URI` is absent or unreachable)
- Optional: `GEMINI_API_KEY` for AI briefing feature; system degrades gracefully without it

**Production:**
- No deployment configuration detected (no Dockerfile, no CI/CD config, no Procfile)
- Assumes external MongoDB Atlas or similar service via `MONGODB_URI`

---

*Stack analysis: 2026-04-16*
