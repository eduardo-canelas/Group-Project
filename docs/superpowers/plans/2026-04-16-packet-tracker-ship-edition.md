# Packet Tracker "Ship" Edition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing MERN Packet Tracker into a LinkedIn-worthy portfolio piece with Apple-caliber UI, mobile-first driver workflow, and a public customer-facing tracking page as the killer feature.

**Architecture:** Keep the existing MERN stack and data model. Add additive frontend design-system tokens and reusable UI primitives. Rework three pages (Login, Admin, Driver) and add one new page (PublicTracking). Add one public backend endpoint. No schema changes.

**Tech Stack:** React 19, Vite 8, Tailwind CSS 4, GSAP 3.15, React Router 7, Node/Express, MongoDB/Mongoose.

**Reference spec:** `docs/superpowers/specs/2026-04-16-packet-tracker-ship-edition-design.md`

**Dev servers for verification:**
- Frontend: `cd frontend && npm run dev` → http://localhost:5173
- Backend: `cd backend && npm run dev` → http://localhost:5000

**Test account setup:** Register an admin and a driver first (via `/register`). Reuse across all verification steps.

---

## Task 1: Design System Tokens + Motion Primitives

**Files:**
- Modify: `frontend/src/index.css`
- Create: `frontend/src/lib/motion-presets.js`

- [ ] **Step 1: Extend `index.css` with Apple-style tokens and responsive primitives**

Add these blocks at the appropriate locations in `frontend/src/index.css`. Keep all existing content; this is additive.

Replace the top-level `@import` font line with the SF-style stack:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif:wght@400&display=swap');
@import "tailwindcss";
```

Inside `:root`, add after the existing variables:

```css
    /* Apple-style motion + spacing tokens */
    --ease-spring: cubic-bezier(0.22, 1, 0.36, 1);
    --ease-swift: cubic-bezier(0.4, 0, 0.2, 1);
    --dur-fast: 180ms;
    --dur-base: 280ms;
    --dur-slow: 520ms;
    --radius-sm: 0.75rem;
    --radius-md: 1.25rem;
    --radius-lg: 1.75rem;
    --radius-xl: 2.25rem;
    --tap-target: 44px;
    --safe-top: env(safe-area-inset-top, 0px);
    --safe-bottom: env(safe-area-inset-bottom, 0px);
    --depth-1: 0 1px 2px rgba(2, 6, 23, 0.08);
    --depth-2: 0 12px 28px -16px rgba(2, 6, 23, 0.45);
    --depth-3: 0 32px 72px -32px rgba(2, 6, 23, 0.55);
```

In `body`, change `font-family` to:

```css
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-feature-settings: 'ss01', 'cv11';
```

In `h1, h2, h3, h4` change `font-family` to:

```css
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    letter-spacing: -0.04em;
```

Append to the `@layer components` block BEFORE the closing brace:

```css
  /* Mobile-first container */
  .container-fluid {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding-left: 1rem;
    padding-right: 1rem;
  }
  @media (min-width: 640px) { .container-fluid { padding-left: 1.5rem; padding-right: 1.5rem; } }
  @media (min-width: 1024px) { .container-fluid { padding-left: 2rem; padding-right: 2rem; } }

  /* Segmented iOS-style tabs */
  .segmented {
    display: inline-flex;
    padding: 4px;
    border-radius: 9999px;
    background: var(--surface-muted);
    border: 1px solid var(--border);
    gap: 2px;
  }
  .segmented-tab {
    position: relative;
    padding: 0.55rem 1.1rem;
    font-size: 0.82rem;
    font-weight: 600;
    border-radius: 9999px;
    color: var(--muted);
    cursor: pointer;
    transition: color var(--dur-fast) var(--ease-swift);
    white-space: nowrap;
  }
  .segmented-tab.is-active {
    color: var(--text);
    background: var(--surface-strong);
    box-shadow: var(--depth-2);
  }

  /* Bottom sheet (mobile) */
  .sheet-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(2, 6, 23, 0.55);
    backdrop-filter: blur(6px);
    z-index: 50;
    animation: fadeIn var(--dur-base) var(--ease-swift);
  }
  .sheet {
    position: fixed;
    left: 0; right: 0; bottom: 0;
    background: var(--bg-elevated);
    border-top-left-radius: var(--radius-xl);
    border-top-right-radius: var(--radius-xl);
    border-top: 1px solid var(--border);
    padding: 1rem 1rem calc(1.5rem + var(--safe-bottom));
    box-shadow: var(--depth-3);
    z-index: 51;
    animation: slideUp var(--dur-base) var(--ease-spring);
    max-height: 85vh;
    overflow-y: auto;
  }
  .sheet-handle {
    width: 44px;
    height: 5px;
    border-radius: 9999px;
    background: var(--muted);
    opacity: 0.35;
    margin: 0 auto 0.75rem;
  }

  /* Bottom navigation (mobile) */
  .bottom-nav {
    position: fixed;
    left: 0; right: 0; bottom: 0;
    background: var(--bg-elevated);
    border-top: 1px solid var(--border);
    padding: 0.5rem 0.75rem calc(0.5rem + var(--safe-bottom));
    backdrop-filter: blur(28px);
    z-index: 40;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.25rem;
  }
  .bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 0.5rem 0;
    border-radius: var(--radius-sm);
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--muted);
    min-height: var(--tap-target);
    transition: color var(--dur-fast) var(--ease-swift);
  }
  .bottom-nav-item.is-active { color: var(--accent-strong); }

  /* Timeline */
  .timeline {
    position: relative;
    padding-left: 2rem;
  }
  .timeline::before {
    content: '';
    position: absolute;
    left: 11px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: linear-gradient(180deg, var(--accent-strong), var(--border));
    border-radius: 9999px;
  }
  .timeline-node {
    position: relative;
    padding: 0.75rem 0 1.25rem;
  }
  .timeline-node::before {
    content: '';
    position: absolute;
    left: -1.75rem;
    top: 1.1rem;
    width: 12px;
    height: 12px;
    border-radius: 9999px;
    background: var(--accent-strong);
    box-shadow: 0 0 0 4px var(--bg), 0 0 0 5px var(--accent-soft);
  }
  .timeline-node.is-muted::before {
    background: var(--surface-strong);
    border: 2px solid var(--border);
  }

  /* Skeleton loaders */
  .skeleton {
    display: block;
    border-radius: var(--radius-sm);
    background: linear-gradient(90deg, var(--surface-muted) 0%, var(--surface) 50%, var(--surface-muted) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.4s var(--ease-swift) infinite;
  }

  /* Magnetic button (desktop only) */
  .btn-magnetic {
    transition: transform var(--dur-base) var(--ease-spring);
  }
  @media (hover: hover) and (pointer: fine) {
    .btn-magnetic:hover { transform: translateY(-2px) scale(1.02); }
    .btn-magnetic:active { transform: translateY(0) scale(0.98); }
  }

  /* Swipeable list items */
  .swipe-row {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius-md);
    touch-action: pan-y;
  }
  .swipe-row-content {
    position: relative;
    z-index: 1;
    background: var(--surface);
    transition: transform var(--dur-base) var(--ease-spring);
    will-change: transform;
  }
  .swipe-row-actions {
    position: absolute;
    top: 0; right: 0; bottom: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-right: 0.75rem;
  }

  /* Hero scene */
  .hero-orb-pulse {
    animation: orbPulse 8s var(--ease-swift) infinite;
  }

  /* Toast */
  .toast {
    position: fixed;
    left: 50%;
    bottom: calc(1.5rem + var(--safe-bottom));
    transform: translateX(-50%);
    background: var(--surface-strong);
    border: 1px solid var(--border);
    padding: 0.75rem 1.25rem;
    border-radius: 9999px;
    box-shadow: var(--depth-3);
    z-index: 60;
    font-weight: 600;
    font-size: 0.88rem;
    animation: slideUp var(--dur-base) var(--ease-spring);
  }

  /* Public tracking hero */
  .track-hero {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius-xl);
    background:
      radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.22), transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(131, 224, 192, 0.18), transparent 50%),
      var(--surface-strong);
    border: 1px solid var(--border);
    padding: 2rem 1.5rem;
  }

  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
  @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
  @keyframes orbPulse { 0%, 100% { transform: scale(1); opacity: 0.6 } 50% { transform: scale(1.08); opacity: 0.9 } }

  /* Safe area helpers */
  .pt-safe { padding-top: var(--safe-top); }
  .pb-safe { padding-bottom: var(--safe-bottom); }
  .mobile-hidden { display: block; }
  .mobile-only { display: none; }
  @media (max-width: 767px) {
    .mobile-hidden { display: none; }
    .mobile-only { display: block; }
  }
```

- [ ] **Step 2: Create `frontend/src/lib/motion-presets.js`**

```javascript
export const springIn = {
  opacity: 0,
  y: 24,
  duration: 0.6,
  ease: 'power3.out',
};

export const springOut = {
  opacity: 1,
  y: 0,
  duration: 0.6,
  ease: 'power3.out',
};

export const staggerChildren = {
  stagger: 0.08,
  ease: 'power3.out',
};

export const SPRING_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const SWIFT_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

- [ ] **Step 3: Verify in browser**

Run `cd frontend && npm run dev`. Open http://localhost:5173. Confirm no console errors and the font visibly changed to Inter. Existing pages should still render (styles are additive).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/index.css frontend/src/lib/motion-presets.js
git commit -m "feat(ui): add Apple-style design tokens and motion presets"
```

---

## Task 2: Shared UI Primitives

**Files:**
- Create: `frontend/src/components/CountUp.jsx`
- Create: `frontend/src/components/Skeleton.jsx`
- Create: `frontend/src/components/SegmentedTabs.jsx`
- Create: `frontend/src/components/BottomSheet.jsx`
- Create: `frontend/src/components/BottomNav.jsx`
- Create: `frontend/src/components/Toast.jsx`
- Create: `frontend/src/components/TimelineEvent.jsx`
- Create: `frontend/src/components/MagneticButton.jsx`
- Create: `frontend/src/components/SwipeableCard.jsx`
- Create: `frontend/src/components/TruckScene.jsx`
- Create: `frontend/src/components/PhoneFrame.jsx`

- [ ] **Step 1: Create `CountUp.jsx`**

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../lib/motion-presets';

export default function CountUp({ to = 0, duration = 1200, className = '' }) {
  const [value, setValue] = useState(prefersReducedMotion() ? to : 0);
  const start = useRef(0);
  const raf = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(to);
      return undefined;
    }
    start.current = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start.current) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(to * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [to, duration]);

  return <span className={className}>{value.toLocaleString()}</span>;
}
```

- [ ] **Step 2: Create `Skeleton.jsx`**

```jsx
import React from 'react';

export default function Skeleton({ className = '', width, height, style }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height, display: 'inline-block', ...style }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="surface-panel space-y-3" aria-busy="true">
      <Skeleton height="14px" width="40%" />
      <Skeleton height="24px" width="80%" />
      <Skeleton height="12px" width="60%" />
    </div>
  );
}
```

- [ ] **Step 3: Create `SegmentedTabs.jsx`**

```jsx
import React from 'react';

export default function SegmentedTabs({ options, value, onChange, className = '' }) {
  return (
    <div className={`segmented overflow-x-auto ${className}`} role="tablist">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`segmented-tab ${value === opt.value ? 'is-active' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create `BottomSheet.jsx`**

```jsx
import React, { useEffect } from 'react';

export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label={title} className="sheet">
        <div className="sheet-handle" />
        {title ? (
          <h3 className="mb-3 text-lg font-semibold tracking-[-0.02em] text-[color:var(--text)]">{title}</h3>
        ) : null}
        <div>{children}</div>
      </div>
    </>
  );
}
```

- [ ] **Step 5: Create `BottomNav.jsx`**

```jsx
import React from 'react';

export default function BottomNav({ items, value, onChange }) {
  return (
    <nav className="bottom-nav md:hidden" aria-label="Primary">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`bottom-nav-item ${value === item.value ? 'is-active' : ''}`}
        >
          <span aria-hidden="true" className="text-lg leading-none">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 6: Create `Toast.jsx`**

```jsx
import React, { useEffect, useState } from 'react';

let pushToast = () => {};

export function useToast() {
  return pushToast;
}

export default function ToastHost() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    pushToast = (message) => {
      setToast(message);
      setTimeout(() => setToast(null), 2400);
    };
    return () => { pushToast = () => {}; };
  }, []);

  if (!toast) return null;
  return <div className="toast" role="status">{toast}</div>;
}
```

- [ ] **Step 7: Create `TimelineEvent.jsx`**

```jsx
import React from 'react';

export default function TimelineEvent({ title, subtitle, timestamp, muted = false, icon }) {
  return (
    <div className={`timeline-node ${muted ? 'is-muted' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[color:var(--text)]">
            {icon ? <span className="mr-1">{icon}</span> : null}{title}
          </p>
          {subtitle ? <p className="mt-1 text-xs text-[color:var(--muted)]">{subtitle}</p> : null}
        </div>
        {timestamp ? (
          <span className="shrink-0 text-xs text-[color:var(--muted)]">{timestamp}</span>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Create `MagneticButton.jsx`**

```jsx
import React, { useRef } from 'react';
import { prefersReducedMotion } from '../lib/motion-presets';

export default function MagneticButton({ children, className = '', onClick, type = 'button', ...rest }) {
  const ref = useRef(null);
  const reduced = prefersReducedMotion();

  const onMove = (event) => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.12}px, ${y * 0.2}px)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`btn-magnetic ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 9: Create `SwipeableCard.jsx`**

```jsx
import React, { useRef, useState } from 'react';

export default function SwipeableCard({ children, actions, threshold = 80 }) {
  const [delta, setDelta] = useState(0);
  const [open, setOpen] = useState(false);
  const startX = useRef(0);
  const active = useRef(false);

  const onStart = (event) => {
    active.current = true;
    startX.current = event.touches ? event.touches[0].clientX : event.clientX;
  };
  const onMove = (event) => {
    if (!active.current) return;
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const d = Math.min(0, clientX - startX.current);
    setDelta(Math.max(-160, d));
  };
  const onEnd = () => {
    active.current = false;
    if (delta < -threshold) {
      setDelta(-140);
      setOpen(true);
    } else {
      setDelta(0);
      setOpen(false);
    }
  };

  return (
    <div className="swipe-row">
      <div className="swipe-row-actions">{actions}</div>
      <div
        className="swipe-row-content"
        style={{ transform: `translateX(${delta}px)` }}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
        onClick={() => { if (open) { setDelta(0); setOpen(false); } }}
      >
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 10: Create `TruckScene.jsx`**

```jsx
import React from 'react';

export default function TruckScene({ className = '' }) {
  return (
    <svg viewBox="0 0 480 260" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent-strong)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent-strong)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--border)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="480" height="180" fill="url(#sky)" rx="24" />
      <path d="M0 200 Q 240 120 480 200 L 480 260 L 0 260 Z" fill="url(#road)" />
      <g className="hero-orb-pulse" style={{ transformOrigin: '70px 120px' }}>
        <circle cx="70" cy="120" r="36" fill="var(--accent-soft)" />
      </g>
      <g transform="translate(170 150)">
        <rect x="0" y="0" width="120" height="42" rx="6" fill="var(--surface-strong)" stroke="var(--border)" />
        <rect x="120" y="12" width="40" height="30" rx="6" fill="var(--accent-strong)" />
        <circle cx="30" cy="48" r="10" fill="var(--text)" />
        <circle cx="140" cy="48" r="10" fill="var(--text)" />
        <rect x="14" y="10" width="40" height="20" rx="3" fill="var(--bg)" opacity="0.6" />
      </g>
      <g opacity="0.6">
        <circle cx="380" cy="60" r="4" fill="var(--accent)" />
        <circle cx="400" cy="90" r="3" fill="var(--accent)" />
        <circle cx="420" cy="55" r="2" fill="var(--accent)" />
      </g>
    </svg>
  );
}
```

- [ ] **Step 11: Create `PhoneFrame.jsx`**

```jsx
import React from 'react';

export default function PhoneFrame({ children, className = '' }) {
  return (
    <div className={`relative mx-auto ${className}`} style={{ width: '320px' }}>
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: '52px',
          border: '10px solid #0b1220',
          boxShadow: '0 60px 120px -30px rgba(2,6,23,0.6), inset 0 0 0 2px rgba(255,255,255,0.06)',
          background: 'var(--bg)',
          aspectRatio: '9 / 19',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90px',
            height: '24px',
            borderRadius: '9999px',
            background: '#0b1220',
            zIndex: 5,
          }}
        />
        <div className="h-full w-full overflow-y-auto pt-10">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 12: Mount `ToastHost` globally**

Edit `frontend/src/App.jsx`. Add import and mount inside `ThemeProvider`:

```jsx
import ToastHost from './components/Toast';
```

Wrap content so it looks like:

```jsx
return (
  <ThemeProvider>
    <Router>
      <Routes>
        {/* existing routes */}
      </Routes>
      <ToastHost />
    </Router>
  </ThemeProvider>
);
```

- [ ] **Step 13: Smoke test**

Restart dev server if needed. Verify no console errors on Login page. Skeletons and toasts are not visible yet but should compile cleanly.

- [ ] **Step 14: Commit**

```bash
git add frontend/src/components/*.jsx frontend/src/App.jsx
git commit -m "feat(ui): add shared UI primitives (sheets, segmented tabs, swipe, toast, timeline)"
```

---

## Task 3: Backend Public Tracking Endpoint

**Files:**
- Create: `backend/middleware/rateLimit.js`
- Create: `backend/controllers/publicController.js`
- Create: `backend/routes/publicRoutes.js`
- Modify: `backend/server.js`

- [ ] **Step 1: Create rate-limit middleware**

Write `backend/middleware/rateLimit.js`:

```javascript
const buckets = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 30;

function rateLimit(req, res, next) {
  const key = req.ip || req.headers['x-forwarded-for'] || 'global';
  const now = Date.now();
  const bucket = buckets.get(key) || { count: 0, reset: now + WINDOW_MS };
  if (now > bucket.reset) {
    bucket.count = 0;
    bucket.reset = now + WINDOW_MS;
  }
  bucket.count += 1;
  buckets.set(key, bucket);
  if (bucket.count > MAX_PER_WINDOW) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.' });
  }
  return next();
}

module.exports = rateLimit;
```

- [ ] **Step 2: Look at existing Package and HandlingEvent models**

Run: `cat backend/models/*.js`

Note: the goal is to read packages by `packageId` and list handling events for that package. Use whatever fields/schemas the models already expose — do not change them.

- [ ] **Step 3: Create public controller**

Write `backend/controllers/publicController.js`:

```javascript
const Package = require('../models/Package');
const HandlingEvent = require('../models/HandlingEvent');

const STATUS_LABELS = {
  pending: 'Pending pickup',
  picked_up: 'Picked up',
  in_transit: 'In transit',
  delivered: 'Delivered',
  lost: 'Lost',
  returned: 'Returned',
  cancelled: 'Cancelled',
};

function generalizeLocation(value) {
  if (!value) return null;
  const parts = String(value).split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  return `${parts[0]}, ${parts[parts.length - 1]}`;
}

async function getTracking(req, res) {
  try {
    const { packageId } = req.params;
    if (!packageId || packageId.length < 2 || packageId.length > 64) {
      return res.status(400).json({ error: 'Invalid tracking ID.' });
    }

    const pkg = await Package.findOne({ packageId }).lean();
    if (!pkg) {
      return res.status(404).json({ error: 'Tracking ID not found.' });
    }

    let events = [];
    try {
      events = await HandlingEvent
        .find({ package: pkg._id })
        .populate('facility', 'name locationType')
        .sort({ timestamp: 1 })
        .lean();
    } catch (_) {
      events = [];
    }

    return res.json({
      packageId: pkg.packageId,
      status: pkg.status,
      statusLabel: STATUS_LABELS[pkg.status] || pkg.status,
      description: pkg.description ? String(pkg.description).slice(0, 140) : null,
      origin: generalizeLocation(pkg.pickupLocation),
      destination: generalizeLocation(pkg.dropoffLocation),
      lastUpdated: pkg.updatedAt || null,
      events: events.map((event, index) => ({
        id: String(event._id || index),
        eventType: event.eventType,
        status: event.statusSnapshot || null,
        facility: event.facility ? { name: event.facility.name, type: event.facility.locationType } : null,
        timestamp: event.timestamp || null,
      })),
    });
  } catch (error) {
    console.error('Public tracking error:', error.message);
    return res.status(500).json({ error: 'Could not load tracking.' });
  }
}

module.exports = { getTracking };
```

- [ ] **Step 4: Create public routes**

Write `backend/routes/publicRoutes.js`:

```javascript
const express = require('express');
const rateLimit = require('../middleware/rateLimit');
const { getTracking } = require('../controllers/publicController');

const router = express.Router();

router.get('/:packageId', rateLimit, getTracking);

module.exports = router;
```

- [ ] **Step 5: Register the route in `server.js`**

Open `backend/server.js`. Add near the other route imports:

```javascript
const publicRoutes = require("./routes/publicRoutes");
```

Inside `startServer` after the existing `app.use(...)` routes and before the `app.get("/", ...)` block, add:

```javascript
        app.use("/api/track", publicRoutes);
```

- [ ] **Step 6: Manual test**

Start backend: `cd backend && npm run dev`. In another terminal:

```bash
curl -s http://localhost:5000/api/track/PKG-DOES-NOT-EXIST | head -1
```

Expected: `{"error":"Tracking ID not found."}` (404).

If you have a known test package, curl that too and confirm a JSON object with `packageId`, `status`, `events` fields comes back.

- [ ] **Step 7: Commit**

```bash
git add backend/middleware/rateLimit.js backend/controllers/publicController.js backend/routes/publicRoutes.js backend/server.js
git commit -m "feat(api): add public /api/track/:packageId endpoint with rate limiting"
```

---

## Task 4: Public Tracking Page (Frontend)

**Files:**
- Create: `frontend/src/lib/publicApi.js`
- Create: `frontend/src/pages/PublicTracking.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/index.html`

- [ ] **Step 1: Create `publicApi.js`**

```javascript
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const publicApi = axios.create({ baseURL });

export async function fetchTracking(packageId) {
  const response = await publicApi.get(`/track/${encodeURIComponent(packageId)}`);
  return response.data;
}

export default publicApi;
```

- [ ] **Step 2: Create `PublicTracking.jsx`**

```jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import TimelineEvent from '../components/TimelineEvent';
import Skeleton, { SkeletonCard } from '../components/Skeleton';
import { useToast } from '../components/Toast';
import { fetchTracking } from '../lib/publicApi';

const STATUS_ICONS = {
  pending: '○',
  picked_up: '•',
  in_transit: '→',
  delivered: '✓',
  lost: '!',
  returned: '↺',
  cancelled: '×',
};

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function PublicTracking() {
  const { packageId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const pushToast = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchTracking(packageId)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => {
        if (cancelled) return;
        const message = err?.response?.data?.error || 'Could not load tracking.';
        setError(message);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [packageId]);

  const progressPct = useMemo(() => {
    if (!data) return 0;
    const map = { pending: 10, picked_up: 30, in_transit: 65, delivered: 100, returned: 100, lost: 100, cancelled: 100 };
    return map[data.status] ?? 0;
  }, [data]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      pushToast('Tracking link copied');
    } catch {
      pushToast('Copy failed — select the URL');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 pt-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="brand-mark">PT</span>
          <span className="text-sm font-semibold tracking-[-0.02em] text-[color:var(--text)]">Packet Tracker</span>
        </Link>
        <button type="button" onClick={copyLink} className="button-secondary btn-magnetic" style={{ padding: '0.55rem 0.95rem', fontSize: '0.78rem' }}>
          Share link
        </button>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        {loading ? (
          <div className="space-y-4">
            <Skeleton height="160px" style={{ width: '100%', borderRadius: '1.75rem' }} />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <div className="surface-card p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] text-xl">?</div>
            <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[color:var(--text)]">Tracking not available</h1>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{error} Check the tracking ID with the sender, or try again in a moment.</p>
            <Link to="/" className="button-secondary btn-magnetic mt-6 inline-flex">Back to home</Link>
          </div>
        ) : data ? (
          <>
            <section className="track-hero">
              <div className="flex flex-col gap-3">
                <span className="ghost-chip self-start">{data.packageId}</span>
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[color:var(--text)] sm:text-4xl">
                  {data.statusLabel}
                </h1>
                {data.description ? (
                  <p className="text-sm leading-7 text-[color:var(--muted)]">{data.description}</p>
                ) : null}
                {data.origin || data.destination ? (
                  <p className="text-sm text-[color:var(--muted)]">
                    {data.origin || '—'} <span aria-hidden="true">→</span> {data.destination || '—'}
                  </p>
                ) : null}
                {data.lastUpdated ? (
                  <p className="text-xs text-[color:var(--muted)]">Updated {formatTime(data.lastUpdated)}</p>
                ) : null}

                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[color:var(--surface-muted)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progressPct}%`,
                      background: 'linear-gradient(90deg, var(--accent-strong), var(--accent))',
                      transition: 'width 0.8s var(--ease-spring)',
                    }}
                  />
                </div>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="mb-4 text-lg font-semibold tracking-[-0.02em] text-[color:var(--text)]">Delivery timeline</h2>
              {data.events.length === 0 ? (
                <div className="surface-panel text-sm text-[color:var(--muted)]">
                  The first handling event will show up here as soon as your package is scanned.
                </div>
              ) : (
                <div className="timeline">
                  {[...data.events].reverse().map((event) => (
                    <TimelineEvent
                      key={event.id}
                      icon={STATUS_ICONS[event.status] || '•'}
                      title={
                        event.facility
                          ? `${event.eventType || 'Scan'} at ${event.facility.name}`
                          : event.eventType || 'Scan'
                      }
                      subtitle={event.facility?.type ? `${event.facility.type}` : null}
                      timestamp={formatTime(event.timestamp)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-10 rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5 text-sm text-[color:var(--muted)]">
              <p className="font-semibold text-[color:var(--text)]">Want tracking like this for your business?</p>
              <p className="mt-2 leading-7">Packet Tracker gives small delivery teams one shareable link per package — with a live status feed customers can open on any device.</p>
              <Link to="/" className="button-primary btn-magnetic mt-4 inline-flex">Get started free</Link>
            </section>
          </>
        ) : null}
      </main>

      <footer className="mx-auto max-w-2xl px-4 pb-10 pt-6 text-center text-xs text-[color:var(--muted)]">
        <p>Packet Tracker · Built for small businesses that ship real things</p>
      </footer>
    </div>
  );
}
```

- [ ] **Step 3: Wire the route into `App.jsx`**

Open `frontend/src/App.jsx`. Add an import:

```jsx
import PublicTracking from './pages/PublicTracking';
```

Inside `<Routes>`, add (above the existing `/` route is fine):

```jsx
<Route path="/track/:packageId" element={<PublicTracking />} />
```

- [ ] **Step 4: Add OG tags in `frontend/index.html`**

Replace existing `<head>` metadata section so it contains:

```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>Packet Tracker — shareable package tracking for small businesses</title>
<meta name="description" content="Live tracking links for every shipment. Built for small delivery teams and the customers who rely on them." />
<meta name="theme-color" content="#07111f" />
<meta property="og:title" content="Packet Tracker" />
<meta property="og:description" content="Live package tracking links for small businesses." />
<meta property="og:type" content="website" />
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%2325a87d'/><text x='16' y='22' font-family='Inter,sans-serif' font-weight='700' font-size='16' text-anchor='middle' fill='white'>PT</text></svg>" />
```

Keep the existing script/module line (`<script type="module" src="/src/main.jsx"></script>`).

- [ ] **Step 5: Verify in browser**

Ensure backend and frontend dev servers are running. Open http://localhost:5173/track/DOES-NOT-EXIST — should show the friendly error card. Create a package as admin with `packageId=PKG-DEMO` and open http://localhost:5173/track/PKG-DEMO — should show the hero, progress bar, and timeline (empty if no events yet).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/publicApi.js frontend/src/pages/PublicTracking.jsx frontend/src/App.jsx frontend/index.html
git commit -m "feat(tracking): add public /track/:packageId page and share flow"
```

---

## Task 5: Landing / Login Cinematic Rework

**Files:**
- Modify: `frontend/src/pages/Login.jsx`
- Modify: `frontend/src/components/ui.jsx` (extend the AppShell with a nav variant)

- [ ] **Step 1: Extend `AppShell` to accept a `minimal` prop (keeps existing callers working)**

Edit `frontend/src/components/ui.jsx`. Replace the existing `AppShell` with:

```jsx
export function AppShell({ children, className = '', minimal = false }) {
  return (
    <div className={`app-shell ${className}`.trim()}>
      <div className="ambient-grid" />
      <div className="ambient-orb ambient-orb-a motion-float" />
      <div className="ambient-orb ambient-orb-b motion-float" />
      <div className="ambient-orb ambient-orb-c motion-float" />

      {!minimal ? (
        <header className="relative z-10 px-4 pt-4 sm:px-6 lg:px-8 lg:pt-6">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="brand-mark">PT</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--muted-strong)]">Packet Tracker</p>
                <p className="text-sm text-[color:var(--muted)]">Motion-first logistics workspace</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>
      ) : null}

      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Replace `frontend/src/pages/Login.jsx` with the landing-style layout**

```jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, AppShell, Field, GhostChip, GlassCard, PageFrame, PrimaryButton, SecondaryButton, TextInput } from '../components/ui';
import MagneticButton from '../components/MagneticButton';
import TruckScene from '../components/TruckScene';
import PhoneFrame from '../components/PhoneFrame';
import { ThemeToggle } from '../components/theme';
import { usePageMotion } from '../components/motion';
import api from '../lib/api';

const problemPoints = [
  { k: 'Lost packages', v: '1 in 10 shipments go dark with no tracking.' },
  { k: 'Support tickets', v: '"Where is my package?" is the #1 question.' },
  { k: 'Lost trust', v: 'Customers stop buying after one missed delivery.' },
];

const solutionPoints = [
  { k: 'One link per package', v: 'Share a beautiful live tracker. No login required.' },
  { k: 'Driver-first updates', v: 'Swipe, scan, photo proof — all in your drivers\' thumb.' },
  { k: 'Admin clarity', v: 'Know every driver, truck, and stop at a glance.' },
];

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const scope = usePageMotion();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', { username, password });
      localStorage.setItem('user', JSON.stringify(response.data));
      navigate(response.data.role === 'admin' ? '/admin' : '/driver');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <AppShell minimal>
      <nav className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--bg-elevated)] backdrop-blur-xl">
        <div className="container-fluid flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <span className="brand-mark">PT</span>
            <span className="text-sm font-semibold tracking-[-0.02em]">Packet Tracker</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/register"><SecondaryButton className="btn-magnetic" style={{ padding: '0.55rem 0.95rem', fontSize: '0.8rem' }}>Create account</SecondaryButton></Link>
          </div>
        </div>
      </nav>

      <PageFrame className="py-6 lg:py-10">
        <div ref={scope} className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="motion-hero space-y-6">
            <GhostChip>Shareable tracking for small logistics teams</GhostChip>
            <h1 className="text-4xl font-semibold tracking-[-0.06em] text-[color:var(--text)] sm:text-6xl">
              The fastest way to stop losing packages.
            </h1>
            <p className="max-w-xl text-base leading-8 text-[color:var(--muted)]">
              Packet Tracker is an operations workspace for small delivery teams — plus a beautiful public link you can send to any customer. They always know where their package is. You always look like a serious business.
            </p>
            <div className="flex flex-wrap gap-3">
              <MagneticButton onClick={() => document.getElementById('login-panel')?.scrollIntoView({ behavior: 'smooth' })} className="button-primary">
                Sign in
              </MagneticButton>
              <Link to="/register">
                <MagneticButton className="button-secondary">Create team account</MagneticButton>
              </Link>
            </div>
          </div>

          <div className="motion-hero flex justify-center">
            <PhoneFrame>
              <div className="p-4 text-[color:var(--text)]">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[color:var(--muted-strong)]">Live tracking</p>
                <p className="mt-1 text-lg font-semibold tracking-[-0.03em]">In transit</p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">PKG-2048 · Warehouse A → Downtown</p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-[color:var(--surface-muted)]">
                  <div className="h-full rounded-full" style={{ width: '65%', background: 'linear-gradient(90deg, var(--accent-strong), var(--accent))' }} />
                </div>
                <div className="timeline mt-6">
                  <div className="timeline-node">
                    <p className="text-sm font-semibold">Picked up</p>
                    <p className="text-xs text-[color:var(--muted)]">Warehouse A · 8:12 AM</p>
                  </div>
                  <div className="timeline-node">
                    <p className="text-sm font-semibold">In transit</p>
                    <p className="text-xs text-[color:var(--muted)]">Truck 21 · 9:40 AM</p>
                  </div>
                  <div className="timeline-node is-muted">
                    <p className="text-sm font-semibold text-[color:var(--muted)]">Out for delivery</p>
                    <p className="text-xs text-[color:var(--muted)]">ETA 12:30 PM</p>
                  </div>
                </div>
              </div>
            </PhoneFrame>
          </div>
        </div>
      </PageFrame>

      <PageFrame className="py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <GlassCard className="motion-card p-6 sm:p-8">
            <GhostChip>Without Packet Tracker</GhostChip>
            <h3 className="mt-4 text-xl font-semibold tracking-[-0.03em]">Packages go dark</h3>
            <ul className="mt-5 space-y-3">
              {problemPoints.map((p) => (
                <li key={p.k} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-rose-400/40 text-xs font-bold text-rose-400">×</span>
                  <div>
                    <p className="text-sm font-semibold">{p.k}</p>
                    <p className="mt-0.5 text-xs text-[color:var(--muted)]">{p.v}</p>
                  </div>
                </li>
              ))}
            </ul>
          </GlassCard>
          <GlassCard className="motion-card p-6 sm:p-8" style={{ borderColor: 'rgba(37,99,235,0.3)' }}>
            <GhostChip>With Packet Tracker</GhostChip>
            <h3 className="mt-4 text-xl font-semibold tracking-[-0.03em]">Every shipment is visible</h3>
            <ul className="mt-5 space-y-3">
              {solutionPoints.map((p) => (
                <li key={p.k} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[color:var(--accent-strong)] text-xs font-bold text-[color:var(--accent-strong)]">✓</span>
                  <div>
                    <p className="text-sm font-semibold">{p.k}</p>
                    <p className="mt-0.5 text-xs text-[color:var(--muted)]">{p.v}</p>
                  </div>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </PageFrame>

      <PageFrame className="py-8">
        <GlassCard className="motion-card p-6 sm:p-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div><p className="text-3xl font-semibold tracking-[-0.04em]">&lt;60s</p><p className="mt-1 text-xs text-[color:var(--muted)]">From scan to shareable link</p></div>
            <div><p className="text-3xl font-semibold tracking-[-0.04em]">5 roles</p><p className="mt-1 text-xs text-[color:var(--muted)]">Driver, dispatcher, customer, facility, admin</p></div>
            <div><p className="text-3xl font-semibold tracking-[-0.04em]">Mobile-first</p><p className="mt-1 text-xs text-[color:var(--muted)]">Drivers live in their phones</p></div>
          </div>
        </GlassCard>
      </PageFrame>

      <PageFrame className="py-8">
        <div id="login-panel" className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <GlassCard className="motion-card p-6 sm:p-8">
            <GhostChip>Team sign-in</GhostChip>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em]">Sign into the operations workspace</h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">Admins command the network. Drivers get a streamlined mobile queue.</p>
            {error ? <Alert tone="error">{error}</Alert> : null}
            <form className="mt-6 space-y-5" onSubmit={handleLogin}>
              <Field label="Username">
                <TextInput type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="dispatcher-main" autoComplete="username" required />
              </Field>
              <Field label="Password">
                <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" required />
              </Field>
              <PrimaryButton type="submit" className="btn-magnetic w-full">Enter workspace</PrimaryButton>
            </form>
            <div className="mt-6 border-t border-[color:var(--border)] pt-5 text-sm">
              <span className="text-[color:var(--muted)]">New team? </span>
              <Link to="/register" className="font-semibold text-[color:var(--accent-strong)]">Create an account →</Link>
            </div>
          </GlassCard>
          <div className="mobile-hidden">
            <TruckScene className="w-full" />
          </div>
        </div>
      </PageFrame>

      <footer className="container-fluid py-8 text-center text-xs text-[color:var(--muted)]">
        Packet Tracker · A shipping-grade demo app
      </footer>
    </AppShell>
  );
}

export default Login;
```

- [ ] **Step 3: Verify in browser**

Open http://localhost:5173. Verify:
- Nav is sticky and blurs on scroll
- Hero looks clean on desktop
- Resize to 375px — the phone-frame wraps under the hero, copy stays readable, buttons become full width
- "Sign in" button scrolls to login panel
- Login still works with existing account

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Login.jsx frontend/src/components/ui.jsx
git commit -m "feat(landing): cinematic login page with problem/solution and phone preview"
```

---

## Task 6: Admin Command Center Rework

**Files:**
- Modify: `frontend/src/pages/AdminDashboard.jsx`

- [ ] **Step 1: Add segmented tabs + CountUp without breaking current features**

Keep all existing logic. Replace the return JSX to organize into tabs. Add these imports at the top of `AdminDashboard.jsx`:

```jsx
import SegmentedTabs from '../components/SegmentedTabs';
import CountUp from '../components/CountUp';
```

Add tab state inside the `AdminDashboard` function near the other `useState` calls:

```jsx
const [activeTab, setActiveTab] = useState('overview');
const tabs = [
  { value: 'overview', label: 'Overview' },
  { value: 'shipments', label: 'Shipments' },
  { value: 'drivers', label: 'Drivers' },
  { value: 'events', label: 'Events' },
];
```

Replace the `MetricCard` usage in the hero grid to use `CountUp` for the value. Example replacement for the first one:

```jsx
<MetricCard label="Packages" value={<CountUp to={packages.length} />} detail="Across all active and completed records." tone="accent" />
<MetricCard label="Drivers" value={<CountUp to={registeredDrivers.length} />} detail="Registered driver accounts ready for assignment." />
<MetricCard label="Facilities" value={<CountUp to={dataModelSummary?.entities?.facilities ?? 0} />} detail="Tracked origin, transit, and destination facilities." />
<MetricCard label="Handling Events" value={<CountUp to={dataModelSummary?.entities?.handlingEvents ?? 0} />} detail="Recorded movement and status history." tone="success" />
```

Add the segmented tabs bar right after the `PageTitle` block, inside the motion-hero div. Insert:

```jsx
<div className="mt-5 flex flex-wrap items-center gap-4">
  <SegmentedTabs options={tabs} value={activeTab} onChange={setActiveTab} />
  <p className="text-xs text-[color:var(--muted)]">Switch sections without losing context.</p>
</div>
```

Wrap the existing major sections in conditional renders based on `activeTab`. Structure:

```jsx
{activeTab === 'overview' && (
  <>
    {/* existing hero GlassCard with search + status counts */}
    {/* existing priority board + AI assistant grid */}
  </>
)}

{activeTab === 'shipments' && (
  <>
    {/* existing shipment form + shipment board grid */}
  </>
)}

{activeTab === 'drivers' && (
  <>
    {/* existing "Assignments by driver" GlassCard */}
    {/* existing delivery mix + driver leaderboard card */}
  </>
)}

{activeTab === 'events' && (
  <>
    {/* existing "Recent handling events" surface panel wrapped in a GlassCard */}
  </>
)}
```

Do not delete any existing JSX — just move it into the appropriate tab. Add a per-shipment "Share tracking" action in the shipments tab: inside the existing SurfacePanel where the Edit/Remove buttons live, add:

```jsx
<SecondaryButton
  type="button"
  onClick={() => {
    const url = `${window.location.origin}/track/${pkg.packageId}`;
    navigator.clipboard.writeText(url).catch(() => {});
  }}
>
  Share link
</SecondaryButton>
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:5173 as admin. Confirm:
- Tabs at top switch cleanly between Overview / Shipments / Drivers / Events
- Metric numbers count up on load
- "Share link" button on each package copies `/track/:id` to clipboard
- Resize to 375px: tabs scroll horizontally if overflow, cards stack

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/AdminDashboard.jsx
git commit -m "feat(admin): add segmented tabs, count-up metrics, per-package share link"
```

---

## Task 7: Driver Mobile-First Rebuild

**Files:**
- Modify: `frontend/src/pages/DriverDashboard.jsx`

- [ ] **Step 1: Read current driver file to preserve business logic**

Run `cat frontend/src/pages/DriverDashboard.jsx | head -80` to capture current state updates, fetch logic, and routes used. Preserve all API calls and state shape; only the JSX layout and interactions change.

- [ ] **Step 2: Rebuild the page**

Replace the return JSX of `DriverDashboard` with this layout. Imports to add at the top:

```jsx
import BottomNav from '../components/BottomNav';
import BottomSheet from '../components/BottomSheet';
import SwipeableCard from '../components/SwipeableCard';
import { useToast } from '../components/Toast';
```

Add state inside the component:

```jsx
const [section, setSection] = useState('today');
const [sheetPkg, setSheetPkg] = useState(null);
const pushToast = useToast();
```

The return body (preserve the existing data handlers `handleStatusChange`, `handleEdit`, etc. — wire them into the new UI):

```jsx
return (
  <AppShell>
    <PageFrame className="pb-32">
      <div ref={scope} className="space-y-6">
        <PageTitle
          title="Your shipments"
          description="Swipe any shipment to update its status. Tap to open full details."
          action={<SecondaryButton type="button" onClick={handleLogout}>Log out</SecondaryButton>}
        />

        {error ? <Alert tone="error">{error}</Alert> : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="surface-panel">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-strong)]">Active</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{myPackages.filter((p) => p.status !== 'delivered' && p.status !== 'cancelled').length}</p>
          </div>
          <div className="surface-panel">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-strong)]">Delivered today</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{myPackages.filter((p) => p.status === 'delivered').length}</p>
          </div>
          <div className="surface-panel">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-strong)]">Assigned</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{myPackages.length}</p>
          </div>
        </div>

        <div className="space-y-3">
          {myPackages.length === 0 ? (
            <EmptyState title="No shipments yet" description="When a dispatcher assigns you a package, it shows up here." />
          ) : (
            myPackages.map((pkg) => (
              <SwipeableCard
                key={pkg._id}
                actions={
                  <>
                    <button
                      type="button"
                      className="button-primary"
                      style={{ padding: '0.55rem 0.9rem', fontSize: '0.78rem' }}
                      onClick={async () => {
                        await handleStatusChange(pkg, 'delivered');
                        pushToast('Marked delivered');
                      }}
                    >
                      Delivered
                    </button>
                  </>
                }
              >
                <div className="surface-panel" onClick={() => setSheetPkg(pkg)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--text)]">{pkg.packageId || 'Package'}</p>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">{pkg.description}</p>
                    </div>
                    <StatusBadge status={pkg.status} />
                  </div>
                  <p className="mt-3 text-xs text-[color:var(--muted)]">{pkg.pickupLocation || '—'} → {pkg.dropoffLocation || '—'}</p>
                </div>
              </SwipeableCard>
            ))
          )}
        </div>
      </div>
    </PageFrame>

    <BottomNav
      value={section}
      onChange={setSection}
      items={[
        { value: 'today', label: 'Today', icon: '◐' },
        { value: 'route', label: 'Route', icon: '→' },
        { value: 'profile', label: 'Profile', icon: '◉' },
      ]}
    />

    <BottomSheet open={!!sheetPkg} onClose={() => setSheetPkg(null)} title={sheetPkg?.packageId || 'Shipment'}>
      {sheetPkg ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <StatusBadge status={sheetPkg.status} />
            <button
              type="button"
              className="button-secondary"
              style={{ padding: '0.5rem 0.9rem', fontSize: '0.78rem' }}
              onClick={() => {
                const url = `${window.location.origin}/track/${sheetPkg.packageId}`;
                navigator.clipboard.writeText(url).catch(() => {});
                pushToast('Tracking link copied');
              }}
            >
              Share link
            </button>
          </div>
          <p className="text-sm leading-7 text-[color:var(--muted)]">{sheetPkg.description}</p>
          <div className="grid gap-2 text-sm text-[color:var(--muted)]">
            <p>Pickup: {sheetPkg.pickupLocation || '—'}</p>
            <p>Dropoff: {sheetPkg.dropoffLocation || '—'}</p>
            <p>Truck: {sheetPkg.truckId || '—'}</p>
          </div>
          <Field label="Status">
            <SelectInput value={sheetPkg.status} onChange={(event) => handleStatusChange(sheetPkg, event.target.value)}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Photo proof (optional)">
            <input type="file" accept="image/*" capture="environment" className="field-shell" />
          </Field>
          <PrimaryButton
            type="button"
            className="w-full"
            onClick={async () => {
              await handleStatusChange(sheetPkg, 'delivered');
              setSheetPkg(null);
              pushToast('Marked delivered');
            }}
          >
            Mark delivered
          </PrimaryButton>
        </div>
      ) : null}
    </BottomSheet>
  </AppShell>
);
```

Notes for the implementer:
- `handleStatusChange(pkg, nextStatus)` should already exist. If the current file uses a different shape, adapt the calls above to use the existing handler name.
- If `myPackages` is named differently (e.g. `packages`), use whatever the current file uses.
- Do not change the fetch/update API calls.

- [ ] **Step 3: Verify in browser**

Open http://localhost:5173 as driver:
- Mobile viewport (375px): bottom nav appears, swipe left on a shipment reveals "Delivered" action
- Tap a card: bottom sheet slides up with details and status select
- "Share link" copies `/track/:id` and toast confirms
- Desktop: looks clean as a stacked list (bottom nav is hidden via `md:hidden`)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/DriverDashboard.jsx
git commit -m "feat(driver): mobile-first workflow with swipe-to-update and bottom sheet"
```

---

## Task 8: Polish Pass

**Files:**
- Modify: `frontend/src/pages/Register.jsx`
- Modify: `frontend/src/components/ui.jsx` (upgrade `EmptyState` visual)

- [ ] **Step 1: Tighten `Register.jsx`**

Open the file and mirror the login layout minimally: keep form logic identical, wrap in `AppShell minimal`, add the same sticky nav as Login. Replace the `AppShell` usage to `<AppShell minimal>` and add this nav block above the `PageFrame`:

```jsx
<nav className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--bg-elevated)] backdrop-blur-xl">
  <div className="container-fluid flex items-center justify-between py-3">
    <Link to="/" className="flex items-center gap-3">
      <span className="brand-mark">PT</span>
      <span className="text-sm font-semibold tracking-[-0.02em]">Packet Tracker</span>
    </Link>
    <Link to="/"><SecondaryButton className="btn-magnetic" style={{ padding: '0.55rem 0.95rem', fontSize: '0.8rem' }}>Sign in</SecondaryButton></Link>
  </div>
</nav>
```

Ensure `Link` and `AppShell` are imported.

- [ ] **Step 2: Upgrade `EmptyState` icon slot**

In `frontend/src/components/ui.jsx`, replace the existing `EmptyState` with:

```jsx
export function EmptyState({ title, description, action, icon = '+' }) {
  return (
    <GlassCard className="p-8 text-center">
      <div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface-muted)] text-2xl font-semibold text-[color:var(--text)]"
        aria-hidden="true"
      >
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[color:var(--text)]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </GlassCard>
  );
}
```

- [ ] **Step 3: Verify in browser**

- Register page has the sticky nav
- Empty states (e.g. driver with no packages) render with the updated icon block

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Register.jsx frontend/src/components/ui.jsx
git commit -m "chore(ui): polish register page and empty state"
```

---

## Task 9: Final QA

- [ ] **Step 1: Manual cross-page test matrix**

With backend + frontend dev servers running, walk the following flows. Expected: no console errors, no layout breakage.

1. Logged out: `/` (desktop + 375px + 768px)
2. `/register` → create an admin account
3. Log in as admin → each tab in the dashboard
4. Create a package `PKG-QA-1`
5. Open `/track/PKG-QA-1` in a separate window → confirm hero, progress, empty timeline message
6. Create a driver account, assign `PKG-QA-1` to that driver
7. Log in as that driver on mobile viewport → swipe-to-update and bottom sheet
8. Copy share link from driver and re-open `/track/PKG-QA-1` → status should have advanced
9. `/track/NONSENSE` → friendly error card
10. Enable reduced-motion in OS or DevTools → confirm animations stop / skip

- [ ] **Step 2: Lighthouse mobile audit**

In Chrome DevTools → Lighthouse → Mobile → Performance + Accessibility. Target: Performance ≥ 85, Accessibility ≥ 90. Fix blatant issues (missing alt text, low contrast) inline if any.

- [ ] **Step 3: Final commit**

Only if fixes were needed from the audit:

```bash
git add -A
git commit -m "chore: final polish from QA pass"
```

Otherwise no commit.

- [ ] **Step 4: Push**

Confirm the current branch is `production`:

```bash
git status -sb
```

Let the user decide whether to push or merge to main.

---

## Out of Scope (Reminder)

- Backend schema changes
- WebSocket / real-time updates
- Cloud storage for photo proof (capture input only)
- Real SMS/email delivery
- i18n
