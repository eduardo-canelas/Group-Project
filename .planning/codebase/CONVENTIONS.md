# Coding Conventions

**Analysis Date:** 2026-04-16

## Naming Patterns

**Files:**
- React page components: PascalCase `.jsx` — `AdminDashboard.jsx`, `DriverDashboard.jsx`, `Login.jsx`, `Register.jsx` in `frontend/src/pages/`
- UI primitive/utility components: lowercase kebab-case `.jsx` — `ai-assistant.jsx`, `motion.jsx`, `theme.jsx`, `ui.jsx` in `frontend/src/components/`
- Frontend lib modules: camelCase `.js` — `api.js`, `auth.js`, `packageFields.js`, `packageInsights.js` in `frontend/src/lib/`
- Backend controllers: camelCase `.js` — `authController.js`, `packageController.js`, `aiController.js` in `backend/controllers/`
- Backend routes: camelCase `.js` — `authRoutes.js`, `packageRoutes.js`, `aiRoutes.js` in `backend/routes/`
- Backend models: PascalCase `.js` — `Package.js`, `Facility.js`, `Route.js`, `HandlingEvent.js`, `User.js` in `backend/models/`

**Functions:**
- Frontend async handlers: camelCase verb-noun — `handleLogin`, `handleSubmit`, `handleEdit`, `handleDelete`, `fetchPackages`, `loadDashboardData`
- Frontend data builders: camelCase verb-noun — `buildPayload`, `buildDriverSummaries`
- Backend controller helpers: camelCase verb-noun — `buildTrackingContext`, `recordHandlingEvent`, `resolveOwner`, `buildPackagePayload`, `pickAllowedFields`, `normalizeNumber`
- React components: PascalCase — `Login`, `AdminDashboard`, `AppShell`, `GlassCard`, `PrimaryButton`
- Custom hooks: `use` prefix — `usePageMotion` in `frontend/src/components/motion.jsx`

**Variables:**
- camelCase throughout — `requestError`, `currentUser`, `formData`, `editingId`, `deferredSearch`, `trackingContext`
- Sort comparator parameters use `left`/`right` instead of `a`/`b` — consistent in `frontend/src/pages/AdminDashboard.jsx` and `backend/controllers/aiController.js`
- Module-level config constants: SCREAMING_SNAKE_CASE — `DRIVER_EDITABLE_FIELDS`, `ADMIN_EDITABLE_FIELDS` in `backend/controllers/packageController.js`

**Types / Props:**
- No TypeScript — project is plain JavaScript (`.js`) and JSX (`.jsx`)
- Prop names use camelCase — `className`, `children`, `tone`, `kicker`, `action`, `detail`

## Code Style

**Formatting:**
- No Prettier config present — formatting is manually consistent
- Frontend (`.jsx`): 2-space indentation, single quotes
- Backend (`.js`): 4-space indentation, double quotes
- Trailing commas present in most multi-line structures

**Linting:**
- ESLint configured at `frontend/eslint.config.js` using flat config (ESLint 9+)
- Extends `@eslint/js` recommended, `eslint-plugin-react-hooks` recommended, `eslint-plugin-react-refresh` vite preset
- Rule: `no-unused-vars` is an error; `varsIgnorePattern: '^[A-Z_]'` exempts PascalCase and SCREAMING_SNAKE constants
- No ESLint config present in `backend/` — no automated style enforcement for backend code

## Import Organization

**Frontend pattern** (consistent order across all page and component files):

1. React core and hooks — `import React, { useState, useEffect, useMemo } from 'react'`
2. Third-party routing — `import { Link, useNavigate } from 'react-router-dom'`
3. Third-party libraries — `import gsap from 'gsap'`
4. Internal UI components — `import { AppShell, GlassCard, ... } from '../components/ui'`
5. Internal hooks — `import { usePageMotion } from '../components/motion'`
6. Internal lib/data — `import api from '../lib/api'`, `import { getStoredUser } from '../lib/auth'`
7. Internal domain helpers — `import { createPackageForm, ... } from '../lib/packageFields'`

**Backend pattern** (CommonJS `require` — consistent order):

1. External packages — `const mongoose = require("mongoose")`, `const express = require("express")`
2. Internal models — `const Package = require("../models/Package")`
3. Internal utils (whole module) — `const localUserStore = require("../utils/localUserStore")`
4. Internal utils (destructured) — `const { findUserByUsername, isMongoConnected } = require("../utils/userDirectory")`

**Path Aliases:**
- None — all imports use relative paths (`../`, `./`)

## Error Handling

**Backend — controller pattern:**

All exported route handlers are wrapped in `try/catch`. A centralized helper `handlePackageError(res, action, error)` in `backend/controllers/packageController.js` standardizes error responses:
- Checks `error.statusCode` (business logic errors attach `.statusCode` to the Error object before throwing)
- Falls back to 400 for Mongoose duplicate key (`error.code === 11000`) or `ValidationError`
- Falls back to 500 for everything else

Custom validation errors are thrown like this:
```js
const error = new Error("Assigned driver was not found");
error.statusCode = 400;
throw error;
```

`authController.js` uses inline `return res.status(N).json({ message })` directly rather than a shared helper.

Early-return guard pattern for invalid IDs and missing records:
```js
if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ message: "Package not found" });
}
const pkg = await Package.findById(id);
if (!pkg) {
    return res.status(404).json({ message: "Package not found" });
}
```

**Frontend — component pattern:**

All API calls inside `try/catch` blocks within async event handlers. Errors extracted from Axios responses with a fallback chain:
```js
requestError.response?.data?.error || requestError.response?.data?.message || 'Fallback string.'
```

Error stored in local `useState` and rendered via `<Alert tone="error">` from `frontend/src/components/ui.jsx`. Error state cleared at the top of each new submit:
```js
setError('');
```

## API Response Shape Conventions

**Success responses (backend):**
- `201` — created document object directly (e.g., `res.status(201).json(newPackage)`)
- `200` — document object or array for reads and updates
- `200` — `{ message: "..." }` for deletes and auth registration
- `200` login shape: `{ message, id, username, role }`
- Summary endpoint shape (nested): `{ entities: {...}, manyToMany: {...}, driverDirectory: [...], recentHandlingEvents: [...] }`
- AI briefing shape: `{ briefing: {...}, source, model, warning, generatedAt }`

**Error responses (backend):**
- Shape: `{ message: "...", error: "..." }` — `message` always present; `error` included on 500s and some 400s
- HTTP codes used: 400 (bad input/validation), 401 (missing/invalid auth), 403 (role mismatch), 404 (not found), 500 (server fault)

**Frontend API calls:**
- All calls use the shared Axios instance from `frontend/src/lib/api.js`
- Auth headers injected automatically via Axios request interceptor: `x-user-id`, `x-user-username`, `x-user-role`
- Response data accessed via `response.data` (Axios unwraps the JSON body)

## React Component Patterns

**Component definitions:**
- All components are plain functions — no class components anywhere
- Page components: one default export per file — `export default Login`, `export default AdminDashboard`
- UI primitives: named exports from a single barrel file `frontend/src/components/ui.jsx`

**Props with defaults:**
- `className = ''` on all wrapper UI components, enabling optional composition:
  ```jsx
  export function GlassCard({ children, className = '' }) {
    return <section className={`surface-card ${className}`.trim()}>{children}</section>;
  }
  ```
- Spread rest props (`...props`) on form input primitives so native HTML attributes pass through:
  ```jsx
  export function TextInput({ className = '', ...props }) {
    return <input {...props} className={`${baseInput} ${className}`.trim()} />;
  }
  ```

**Conditional rendering:**
- Uses ternary returning `null` — never `&&` (avoids accidental `0` renders):
  ```jsx
  {description ? <p className="...">{description}</p> : null}
  {action ? <div className="shrink-0">{action}</div> : null}
  ```

**State management:**
- All state via `useState` — no global state library (no Redux, Zustand, Context for data)
- `useDeferredValue` used for search input in both dashboards to avoid blocking the render
- `useMemo` used for derived lists (filtered/sorted packages)

**Form field updater pattern** (curried handler):
```js
const updateField = (field) => (event) => {
  setFormData((current) => ({ ...current, [field]: event.target.value }));
};
```

**Data fetching:**
- `useEffect` with empty `[]` dependency array for initial page load
- Parallel fetches via `Promise.all([fetch1(), fetch2()])` — see `loadDashboardData` in both dashboards
- No data-fetching library (no React Query, SWR, or similar)

**Auth guard pattern** (`frontend/src/App.jsx`):
- `<PublicOnly>` wrapper component redirects authenticated users away from `/` and `/register`
- `<RequireRole role="...">` wrapper enforces role-specific route access and redirects mismatched roles

## Module Design

**Frontend exports:**
- UI primitives: all named exports from `frontend/src/components/ui.jsx` (barrel file)
- Pages: one default export per file
- Lib modules: default export for singleton instances (`api`, auth helpers), named exports for utility functions

**Backend exports:**
- Controllers: `exports.functionName = async (req, res) => { ... }` (CommonJS named exports on `exports`)
- Routes: `module.exports = router`
- Middleware: `module.exports = async function name(...)`
- Models: `module.exports = mongoose.model('ModelName', schema)`

## Comments

**Usage pattern:**
- Sparse inline comments — used for brief intent notes, not documentation blocks
- Route files use end-of-line comments: `router.post("/", createPackage); //create a new package`
- No JSDoc/TSDoc annotations anywhere in the codebase
- Commented-out code present in at least one place (`/*notes: event.notes || "",*/` in `backend/controllers/packageController.js`)

---

*Convention analysis: 2026-04-16*
