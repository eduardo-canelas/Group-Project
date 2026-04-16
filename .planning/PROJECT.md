# Packet Tracker — Admin & Driver Dashboard Upgrade

## What This Is

A full-stack package tracking web application (React + Express + MongoDB) used by admins and drivers to manage shipments from pickup through delivery. Admins see all packages across the system; drivers see only their own. Both roles can create, edit, and track packages through status transitions, with AI-powered operational briefings available to admins.

This milestone upgrades two things on top of the existing working system: wiring the AI briefing to real live backend data, and elevating the UI of both dashboards (admin + driver) to a polished, LinkedIn-showcase quality.

## Core Value

Any user who opens the dashboard immediately understands the current state of operations — which packages need attention, where risk is concentrated, and what to act on next.

## Requirements

### Validated

- ✓ User authentication with role-based access (admin / driver) — existing
- ✓ Package CRUD for both roles with field-level permission scoping — existing
- ✓ Package lifecycle: pending → picked_up → in_transit → delivered / lost / returned / cancelled — existing
- ✓ Handling events recorded on every package state change — existing
- ✓ Facility and route auto-creation from free-text location strings — existing
- ✓ Admin dashboard with package list, driver summaries, and analytics — existing
- ✓ Driver dashboard with own-package view and CRUD — existing
- ✓ AI briefing endpoint in backend with Gemini integration + local fallback — existing
- ✓ AI assistant UI component wired in AdminDashboard — existing
- ✓ Dark / light theme toggle, persisted to localStorage — existing

### Active

- [ ] AI briefing "Generate" flow wired to real live backend data (no mock/placeholder output)
- [ ] Generated briefing covers: package health, urgent/risky records, delayed/lost/returned packages, driver workload, route bottlenecks, latest handling events, operational patterns
- [ ] Empty states handled gracefully with clean user feedback
- [ ] Admin dashboard premium UI: both dark and light themes polished
- [ ] Driver dashboard premium UI: both dark and light themes polished
- [ ] Subtle GSAP motion added where it elevates quality (not decoration)
- [ ] Button hierarchy, hover/focus/active states improved across both dashboards
- [ ] Card layout, spacing, and typography hierarchy improved
- [ ] AI panel right-side feels premium and intentional
- [ ] "No urgent packages" and other empty states feel designed, not blank

### Out of Scope

- JWT authentication / security hardening — known concern, separate milestone
- Pagination on package listing — performance improvement, separate milestone
- Test coverage — no testing framework in project; out of scope for this milestone
- Driver dashboard AI briefing — only admin needs AI; driver upgrade is UI-only
- Mobile redesign — responsiveness preserved, not redesigned
- Backend architectural refactor (service extraction, monolith splitting) — not this milestone

## Context

The codebase already has a working AI briefing backend at `POST /api/ai/ops-briefing`. The `aiController.js` fetches all packages, runs a local risk-scoring engine (`summarizePackages`), and optionally calls Gemini. The issue is that the frontend AI assistant component may not be correctly calling this endpoint or may be displaying stale/mock state rather than the live response.

Both dashboards load live data via `loadDashboardData` using parallel `Promise.all` fetches. The UI component library lives in `frontend/src/components/ui.jsx` — all polish must use or extend these existing primitives. GSAP is already installed (`^3.15.0`) and used via `usePageMotion` hook in `motion.jsx`.

The project is a group project intended to be showcased on LinkedIn — it must demonstrate real problem-solving (packages being lost/delayed surfaced in the briefing) and look production-ready.

## Constraints

- **Architecture**: Do not replace the existing routing, auth flow, or data models
- **Backend**: Surgical changes only — wire existing endpoints, don't rewrite controllers
- **UI**: Extend existing component primitives in `ui.jsx`; do not introduce a new component library
- **Motion**: GSAP only (already installed); no Framer Motion or CSS animation overload
- **Scope**: Admin dashboard AI wiring + both dashboards UI upgrade only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use existing `/api/ai/ops-briefing` endpoint | Already implements risk scoring + Gemini fallback; only needs correct frontend wiring | — Pending |
| Extend ui.jsx primitives rather than adding new component library | Codebase convention; avoids dependency bloat | — Pending |
| Both themes polished (dark + light) | User explicitly requested both; theme toggle already works | — Pending |
| Admin + Driver dashboards upgraded | User wants consistent experience across both roles | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-16 after initialization*
