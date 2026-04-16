# Packet Tracker — "Ship" Edition Design Spec

**Date:** 2026-04-16
**Author:** Eduardo Canelas
**Status:** Approved

## Goal

Transform the existing MERN Packet Tracker project into a LinkedIn-worthy portfolio piece that:

1. Looks Apple-caliber on desktop AND mobile
2. Solves a real-world problem (package tracking loss for small businesses)
3. Includes a shareable customer-facing feature (the viral moment)
4. Reads as "shipped product" to recruiters, not "class project"

## Audience

- **Primary:** Recruiters and hiring managers scrolling LinkedIn
- **Secondary:** Small-business operators, drivers, and their customers who would actually use the tool

## What Exists Today

- React 19 + Vite 8 + Tailwind 4 + React Router 7 + GSAP frontend
- Node + Express + MongoDB backend with Users, Packages, Facilities, Routes, HandlingEvents
- Admin + Driver dashboards with CRUD
- Glass-card UI, light/dark theme, AI assistant placeholder
- No mobile optimization, no customer-facing pages, no public tracking

## Scope (What Will Be Built)

### 1. Design System Refresh (non-breaking additive tokens)

- SF-style typography: `-0.05em` to `-0.06em` tracking on headings, precise line heights
- Spring motion tokens: `cubic-bezier(0.22, 1, 0.36, 1)` default easing, `200ms` base duration
- Depth system: 3 layers of frosted glass surfaces with proper backdrop blur
- Mobile-first spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 72
- Apple system colors: iOS blue accents, SF gray scale, subtle shadows
- Focus states: ring-4 with low opacity, respecting reduced-motion

### 2. Landing / Login Page

- Cinematic hero with scroll-triggered GSAP reveals
- Animated "package in motion" scene (SVG/CSS-based, no heavy 3D)
- Glass nav bar that condenses on scroll
- Social proof strip (small business use cases)
- Problem/solution section with side-by-side "before / after Packet Tracker"
- Feature grid with live-ish mockups
- One-tap demo login (`Try as dispatcher` / `Try as driver`) — seeded accounts
- Mobile: stacks cleanly, hero reduces to 1-column, CTAs become full-width

### 3. Admin Command Center Rework

- iOS-style segmented tabs: `Overview · Shipments · Drivers · Events`
- Live shipment timeline (vertical, with animated state transitions)
- Command palette (⌘K) for power users: jump to package, driver, or action
- Metric cards with count-up animation on mount
- Empty states with helpful suggestions, not just blank cards
- Mobile: tabs scroll horizontally, cards stack, FAB for "New shipment"

### 4. Driver Mobile-First Experience

- Bottom navigation (Today / Route / Profile)
- Swipe-to-update status on shipment cards (iOS swipe-action pattern)
- "Mark delivered" action with photo-proof capture stub (uses file input with `capture="environment"`)
- Bottom-sheet modal for shipment details (Apple-style, with drag handle)
- Thumb-zone button placement (primary actions in bottom third)
- Pull-to-refresh on shipment list
- Haptic-style press feedback on buttons (scale + subtle shadow)

### 5. Public Tracking Page (NEW — the killer feature)

- Route: `/track/:packageId` — no auth required
- Apple-style vertical timeline of handling events
- Animated truck icon traveling the path
- ETA-style current status hero
- "Copy tracking link" with success toast
- Share-ready Open Graph meta tags (so LinkedIn previews look good)
- Privacy: only shows package ID, status, timeline, generalized locations — no customer PII
- Mobile: this is the primary target — recipients will open on their phones
- Backend: new `GET /api/track/:packageId` endpoint (public, read-only, rate-limited)

### 6. Micro-interactions

- Status badge morph (color + icon transitions between states)
- Magnetic button hover on desktop (disabled on touch)
- Count-up metrics on mount using GSAP
- Skeleton loaders replace text "Loading…"
- Page transitions: opacity + subtle translate
- Respect `prefers-reduced-motion`: disable transforms, keep opacity

## Architecture

### Frontend file layout (additive)

```
frontend/src/
  components/
    ui.jsx                  (existing — extend with new primitives)
    motion.jsx              (existing — add spring presets)
    theme.jsx               (existing)
    ai-assistant.jsx        (existing)
    CommandPalette.jsx      NEW
    TimelineEvent.jsx       NEW
    ShipmentCard.jsx        NEW (shared between admin + driver + public)
    BottomNav.jsx           NEW
    BottomSheet.jsx         NEW
    SegmentedTabs.jsx       NEW
    PackageJourney.jsx      NEW (animated timeline)
    TruckAnimation.jsx      NEW (hero scene)
    SwipeableCard.jsx       NEW
    MagneticButton.jsx      NEW
    CountUp.jsx             NEW
    Skeleton.jsx            NEW
  pages/
    Login.jsx               (rework into full landing)
    AdminDashboard.jsx      (rework with segmented tabs)
    DriverDashboard.jsx     (mobile-first rebuild)
    PublicTracking.jsx      NEW
    Register.jsx            (minor polish)
  lib/
    api.js                  (existing)
    auth.js                 (existing)
    publicApi.js            NEW (unauthenticated tracking API)
    demoAccounts.js         NEW (seeded demo login credentials)
```

### Backend additions (minimal)

```
backend/
  routes/
    publicRoutes.js         NEW: GET /api/track/:packageId
  controllers/
    publicController.js     NEW: serves sanitized tracking data
  middleware/
    rateLimit.js            NEW: simple in-memory limiter for public endpoint
```

### Data flow — public tracking

1. Customer receives share link from sender: `https://app/track/PKG-2048`
2. Frontend loads `PublicTracking.jsx`, calls `GET /api/track/PKG-2048`
3. Backend returns: `{ packageId, status, statusLabel, events: [...], originCity, destCity, lastUpdated }`
4. Explicit field allowlist — no driver info, no customer PII, no internal IDs
5. Rate-limited per IP: 30 requests/minute

### Error handling

- Public tracking: unknown ID → friendly 404 page with "Check the ID or contact sender"
- Auth pages: preserve existing behavior, improve error copy
- Network errors: inline error cards with retry button, not page-wide blowups
- Optimistic UI for status updates in driver view with rollback on failure

## Testing

- Manual test matrix: Login / Admin / Driver / PublicTracking on Chrome desktop + iPhone viewport + reduced-motion
- Smoke test: create package as admin → view in public tracking → update as driver → confirm timeline updates
- Accessibility: keyboard navigation on desktop, focus indicators visible, contrast ≥ WCAG AA
- Mobile: safe-area insets on notch devices, bottom nav doesn't conflict with home indicator

## Explicit Non-Goals

- Backend data model changes (schema stays as-is)
- Real-time WebSockets (polling is fine for demo)
- Real photo upload to cloud storage (capture input only, local preview)
- Actual SMS/email delivery of tracking links (copy-to-clipboard is enough)
- Internationalization
- Real rate-limiting infrastructure (simple in-memory is fine for demo scope)
- Backend auth changes
- Replacing the AI assistant component — keep as-is, just restyle

## Success Criteria

- Landing page is screenshottable and reads as a product, not a project
- Public tracking page works on a cold iPhone with a shared link and looks native
- Admin dashboard works smoothly in both desktop and mobile widths
- Driver dashboard feels like a native app at 375px width
- All existing CRUD flows still work
- Lighthouse mobile score ≥ 90 for performance and accessibility
- Zero console errors on any page
- Reduced-motion preference properly respected

## Implementation Order

1. Design system tokens + motion primitives + shared UI primitives
2. Public tracking page + backend public endpoint (the killer feature, do early so the rest of the polish compounds on it)
3. Landing / Login cinematic rework
4. Admin Command Center rework
5. Driver mobile-first rebuild
6. Polish pass: empty states, skeletons, micro-interactions, OG tags
7. Final QA pass across desktop + mobile viewports + reduced-motion
