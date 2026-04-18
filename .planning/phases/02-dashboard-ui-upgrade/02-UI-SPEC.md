---
phase: 2
slug: dashboard-ui-upgrade
status: approved
shadcn_initialized: false
preset: not applicable
created: 2026-04-16
---

# Phase 2 — UI Design Contract

> Visual and interaction contract for the Packet Tracker dashboard upgrade. Generated locally using the `gsd-ui-phase` workflow with requirements-traceability fallback because `ROADMAP.md` is not present in this repository.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | custom local primitives in `frontend/src/components/ui.jsx` |
| Icon library | none — text marks, pills, and simple glyphs only |
| Font | Sora for display and major headings, Manrope for body and controls |

**System rule:** extend the existing primitive layer instead of introducing a new UI kit. New surfaces must feel like part of one operating system, not a pile of one-off cards.

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline separators, micro-adjustments |
| sm | 8px | Compact chip padding, inline stack spacing |
| md | 16px | Default field gaps, card internals, label-to-input spacing |
| lg | 24px | Standard panel padding, intra-section gaps |
| xl | 32px | Major content grouping, hero text spacing |
| 2xl | 48px | Section separation inside dashboards |
| 3xl | 64px | Page-level rhythm for premium hero and wide desktop layouts |

Exceptions: `20px` may be used inside pills and segmented controls where optical balance is better than strict token matching.

**Layout contract**
- Dashboard sections must breathe in vertical stacks; never compress major cards below `24px` internal padding.
- Two-column desktop layouts should collapse cleanly to one column below `1024px`.
- On mobile, task-entry or sign-in surfaces appear before showcase/marketing content.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 15–16px | 500 | 1.65–1.8 |
| Label | 11–13px | 700 | 1.3 |
| Heading | 24–32px | 600–700 | 1.1–1.25 |
| Display | 40–56px desktop, 28–36px mobile | 700–800 | 0.95–1.08 |

**Typography rules**
- Sora is reserved for brand mark, page title, section titles, and large product-story statements.
- Manrope carries paragraphs, fields, helper text, metrics, and table-like operational details.
- Uppercase microcopy is allowed only for chips, section kickers, and status metadata.
- Never place low-contrast muted body copy over low-contrast glass backgrounds in light theme.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#07111f` dark / `#edf6ff` light | App background, overall canvas, large atmospheric fields |
| Secondary (30%) | `rgba(12,19,34,0.72)` dark / `rgba(255,255,255,0.88)` light | Cards, elevated surfaces, panels, auth shells |
| Accent (10%) | `#83e0c0` dark / `#2563eb` light | Primary CTA, active segmented state, trust/progress emphasis, AI/live affordances |
| Destructive | `#f43f5e` | Delete, loss, recovery-critical states only |

Accent reserved for: primary CTA buttons, active filter/toggle states, focus rings, AI/live badges, and trust/health indicators. Accent must not be used as the default color for all links, all chips, or all headings.

**Theme contract**
- Dark theme is the default showcase state because it presents the strongest LinkedIn-first visual impression.
- Light theme must remain fully supported, but should read as crisp and editorial rather than washed out.
- Lost, returned, cancelled, and stale states should rely on semantic severity tones, not only on text labels.

---

## Motion Contract

| Property | Value |
|----------|-------|
| Engine | GSAP core + `@gsap/react` |
| Entry ease | `power3.out` for hero, `power2.out` for cards and sections |
| Hero entry | `autoAlpha` from 0, `y` 20–30px, stagger `0.07–0.10` |
| Card entry | `autoAlpha` from 0, `y` 14–22px, `scale` 0.985, stagger `0.045–0.06` |
| Float motion | `sine.inOut`, low amplitude only, ambient not attention-seeking |
| Reduced motion | use `gsap.matchMedia()` and disable decorative motion under `prefers-reduced-motion: reduce` |

**Motion rules**
- Motion must clarify hierarchy and premium feel, never simulate activity that the data does not support.
- Entrance animation is allowed on page mount and section reveal, but should finish quickly and stay out of the user’s way.
- Mobile motion must be shorter and lighter than desktop.
- Do not animate layout-heavy properties when transforms or `autoAlpha` can achieve the same result.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | `Enter workspace` |
| Empty state heading | `No urgent packages right now` |
| Empty state body | `The current network snapshot does not show a high-priority recovery queue. Keep monitoring active loads and refresh statuses as new scans arrive.` |
| Error state | `Could not load the dashboard. Refresh the page or try again in a moment.` |
| Destructive confirmation | `Delete shipment`: `This removes the package record and its handling history from the working board.` |

**Copy rules**
- Language should sound like a product solving a real business problem, not a school assignment describing itself.
- Headline copy may be confident and portfolio-ready, but supporting copy must stay operational and concrete.
- AI messaging must emphasize “live package data”, “operations”, and “next steps” rather than generic intelligence claims.
- Driver copy should be simpler and more action-oriented than admin copy.

---

## Surface and Component Contract

- Reuse `GlassCard`, `SurfacePanel`, `MetricCard`, `GhostChip`, `FilterPill`, `Alert`, and button primitives before adding new wrappers.
- All cards require clear top-left identity, readable body copy, and one obvious action or state anchor.
- Filters and quick actions should use pill treatment, but they must remain legible and tappable on mobile.
- Status presentation uses semantic badges; secondary chips may supplement status but must not compete with it.
- Auth pages may include showcase storytelling, but core form completion should remain above the fold on mobile.

---

## Page-Specific Contract

### Login / Register
- Default theme loads in dark mode.
- Sign-in or account-creation form appears before narrative marketing content on mobile.
- Left-side showcase content must prove technical range: full stack, AI, and real-world logistics value.

### Admin Dashboard
- Hero must explain the business problem: preventing lost packages for small teams.
- Exception radar is the primary showcase block.
- AI copilot should feel integrated into operations, not attached as an unrelated widget.
- Route pressure, facility watch, custody timeline, and driver accountability should read as connected layers of one system.

### Driver Dashboard
- Driver board prioritizes speed, clarity, and next-step actions over analytics density.
- Quick status transitions should be visible inline on each package card.
- “What should I update first?” must be answerable in under five seconds.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party registry | none | not allowed in this phase |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-16
