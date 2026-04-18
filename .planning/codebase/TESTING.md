# Testing Patterns

**Analysis Date:** 2026-04-16

## Current State: No Automated Tests

This codebase has no automated test suite. There are no unit tests, integration tests, or end-to-end tests. No test runner, assertion library, mocking framework, or coverage tool is installed or configured anywhere in the repository.

## Test Framework

**Runner:** None installed

**Assertion Library:** None

**Run Commands:** No test scripts defined

- `frontend/package.json` scripts: `dev`, `build`, `lint`, `preview` — no `test` script
- `backend/package.json` scripts: `dev`, `start` — no `test` script

## Test File Locations

**Test files found:** None

No `*.test.js`, `*.test.jsx`, `*.spec.js`, `*.spec.jsx`, or `__tests__/` directories exist anywhere under `frontend/src/` or `backend/`.

**Configuration files found:** None

The following config files were searched for and not found:
- `jest.config.*`
- `vitest.config.*`
- `cypress.config.*`
- `playwright.config.*`

## The Only "Test" File

`backend/test_db.js` exists but is a manual connectivity check script, not an automated test:

```js
require("dotenv").config();
const mongoose = require("mongoose");
console.log("URI is:", process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI).then(() => {
    console.log("Connected to MongoDB");
    process.exit(0);
}).catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
});
```

This script verifies that `MONGODB_URI` resolves to a reachable MongoDB instance. It has no assertions, no test runner integration, and is not referenced in any `package.json` script. It is a developer utility, not a test.

## Coverage

**Requirements:** None enforced

**Coverage tooling:** None installed

## What Would Need Testing (Gap Analysis)

The following areas have zero automated coverage:

**Backend — high risk, untested:**
- `backend/controllers/packageController.js` — CRUD logic, field validation, role-based access (`canAccessPackage`), duplicate key handling, tracking context assembly (`buildTrackingContext`, `recordHandlingEvent`)
- `backend/controllers/authController.js` — login credential validation, registration duplicate detection, MongoDB vs local-store branching
- `backend/controllers/aiController.js` — Gemini API call, JSON parsing fallback (`tryParseJsonBlock`), local briefing generation, risk scoring (`computePackageRisk`)
- `backend/middleware/requireCurrentUser.js` — header validation, user lookup, role/username consistency check
- `backend/utils/` — `localUserStore.js`, `userDirectory.js` utility functions

**Frontend — high risk, untested:**
- `frontend/src/lib/api.js` — Axios interceptor attaches auth headers
- `frontend/src/lib/auth.js` — stored user retrieval
- `frontend/src/lib/packageInsights.js` — derived data calculations (`getStatusCounts`, `getPriorityPackages`, `getDriverLeaderboard`, `getDeliveryMix`)
- `frontend/src/lib/packageFields.js` — form field factory and mapper (`createPackageForm`, `mapPackageToForm`)
- `frontend/src/pages/AdminDashboard.jsx` — submit, edit, delete flows; search filtering; driver summary aggregation
- `frontend/src/pages/DriverDashboard.jsx` — submit, status update, delete flows

## Recommended Starting Point

If tests are added, the recommended stack for this project is:

**Backend:**
- `vitest` or `jest` as runner
- `supertest` for Express route integration tests
- In-memory MongoDB via `mongodb-memory-server` for controller tests

**Frontend:**
- `vitest` as runner (matches Vite build tooling already in use)
- `@testing-library/react` for component tests
- `msw` (Mock Service Worker) to mock the Axios API layer

---

*Testing analysis: 2026-04-16*
