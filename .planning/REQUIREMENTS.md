# Requirements: Packet Tracker Dashboard Upgrade

**Defined:** 2026-04-16
**Core Value:** Any user who opens the dashboard immediately understands the current state of operations — which packages need attention, where risk is concentrated, and what to act on next.

## v1 Requirements

### AI Briefing

- [ ] **AI-01**: Clicking "Generate briefing" triggers a real API call to `POST /api/ai/ops-briefing` using live backend data (not placeholder or mock output)
- [ ] **AI-02**: Generated briefing displays current package health summary (total counts by status: pending, in_transit, delivered, lost, returned, cancelled)
- [ ] **AI-03**: Generated briefing surfaces urgent/risky packages (lost, returned, long-delayed, or high-priority items requiring immediate attention)
- [ ] **AI-04**: Generated briefing includes driver workload analysis (package count per driver, overloaded vs. underloaded drivers)
- [ ] **AI-05**: Generated briefing includes route bottleneck analysis (facilities or routes with high-volume or stuck packages)
- [ ] **AI-06**: Generated briefing includes recent handling event summary (what happened in the last N events)
- [ ] **AI-07**: Generated briefing includes a concise leadership-ready "situation now" paragraph
- [ ] **AI-08**: Empty state (no packages in system) handled gracefully with a designed, informative message
- [ ] **AI-09**: Loading state during briefing generation shows a visible, polished indicator (not blank/frozen UI)
- [ ] **AI-10**: Error state (backend failure or no Gemini key) shows a clean fallback message, not a raw error dump

### Admin Dashboard UI

- [ ] **ADMIN-01**: Section spacing, card rhythm, and layout alignment improved — no cramped or inconsistent zones
- [ ] **ADMIN-02**: Typography hierarchy improved — clear visual distinction between headings, labels, values, and secondary text
- [ ] **ADMIN-03**: AI panel (right side) feels premium: strong visual container, intentional layout, not an afterthought
- [ ] **ADMIN-04**: "No urgent packages" empty state feels designed — illustration, icon, or styled message instead of bare text
- [ ] **ADMIN-05**: Action chips/buttons have polished hierarchy — primary, secondary, and ghost states are visually distinct
- [ ] **ADMIN-06**: Button hover, focus, and active states implemented consistently across the dashboard
- [ ] **ADMIN-07**: Bottom stat/info cards balanced with upper layout — no orphaned or misaligned sections
- [ ] **ADMIN-08**: Dark theme elevated — deeper backgrounds, intentional accent colors, glass/surface treatment on cards
- [ ] **ADMIN-09**: Light theme polished — clean whites, professional greys, crisp borders
- [ ] **ADMIN-10**: Subtle GSAP entrance animations on dashboard mount (staggered cards, not distracting)
- [ ] **ADMIN-11**: No existing functionality broken by UI changes

### Driver Dashboard UI

- [ ] **DRIVER-01**: Section spacing, card rhythm, and layout alignment improved to match admin dashboard quality
- [ ] **DRIVER-02**: Typography hierarchy improved — consistent with admin dashboard treatment
- [ ] **DRIVER-03**: Empty package state feels designed, not blank
- [ ] **DRIVER-04**: Action buttons polished and consistent with admin dashboard button system
- [ ] **DRIVER-05**: Dark theme elevated to match admin dashboard premium treatment
- [ ] **DRIVER-06**: Light theme polished to match admin dashboard clean treatment
- [ ] **DRIVER-07**: Subtle GSAP entrance animations on dashboard mount
- [ ] **DRIVER-08**: No existing functionality broken by UI changes

## v2 Requirements

### Security Hardening

- **SEC-01**: Replace header-based auth with signed JWT in httpOnly cookie
- **SEC-02**: Add rate limiting on `/api/auth/*` endpoints
- **SEC-03**: Restrict CORS to explicit origin allowlist

### Performance

- **PERF-01**: Paginate `GET /api/packages` (default page size 50)
- **PERF-02**: Cache `getDataModelSummary` results with 30-second TTL
- **PERF-03**: Move AI briefing package aggregation to MongoDB pipeline instead of in-memory

### Testing

- **TEST-01**: Add Vitest to frontend with unit tests for `requireCurrentUser` middleware and package controller helpers
- **TEST-02**: Add Jest + Supertest to backend

## Out of Scope

| Feature | Reason |
|---------|--------|
| JWT auth / security overhaul | Known concern; separate milestone — don't touch auth flow |
| Pagination | Performance improvement; separate milestone |
| Backend service extraction (monolith split) | Maintainability refactor; out of scope for UI/AI milestone |
| Mobile redesign | Responsiveness preserved, not redesigned |
| Driver AI briefing | Only admin needs AI; driver upgrade is UI-only |
| CI/CD pipeline | Infrastructure; separate milestone |
| Error boundary | Minor reliability improvement; out of scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AI-01 | Phase 1 | Pending |
| AI-02 | Phase 1 | Pending |
| AI-03 | Phase 1 | Pending |
| AI-04 | Phase 1 | Pending |
| AI-05 | Phase 1 | Pending |
| AI-06 | Phase 1 | Pending |
| AI-07 | Phase 1 | Pending |
| AI-08 | Phase 1 | Pending |
| AI-09 | Phase 1 | Pending |
| AI-10 | Phase 1 | Pending |
| ADMIN-01 | Phase 2 | Pending |
| ADMIN-02 | Phase 2 | Pending |
| ADMIN-03 | Phase 2 | Pending |
| ADMIN-04 | Phase 2 | Pending |
| ADMIN-05 | Phase 2 | Pending |
| ADMIN-06 | Phase 2 | Pending |
| ADMIN-07 | Phase 2 | Pending |
| ADMIN-08 | Phase 2 | Pending |
| ADMIN-09 | Phase 2 | Pending |
| ADMIN-10 | Phase 2 | Pending |
| ADMIN-11 | Phase 2 | Pending |
| DRIVER-01 | Phase 2 | Pending |
| DRIVER-02 | Phase 2 | Pending |
| DRIVER-03 | Phase 2 | Pending |
| DRIVER-04 | Phase 2 | Pending |
| DRIVER-05 | Phase 2 | Pending |
| DRIVER-06 | Phase 2 | Pending |
| DRIVER-07 | Phase 2 | Pending |
| DRIVER-08 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-16*
*Last updated: 2026-04-16 after initial definition*
