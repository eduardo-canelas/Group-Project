# Design

## Visual Theme

RoutePulse uses a restrained operations-console aesthetic with light mode as the default and a serious dark mode for lower-light work. The interface should feel crisp, quiet, and finished: off-white and charcoal surfaces, thin borders, measured shadows, and one blue-green operational accent.

Physical scene: an admin checks package exceptions on a desktop monitor in a busy office during the day, while a driver checks the next stop on a phone near a vehicle. That requires readable light mode, with dark mode available for after-hours work.

## Color

Use OKLCH-ready neutral intent even when implemented as CSS custom properties. Neutrals should be tinted, not pure white or pure black.

- Canvas light: soft blue-gray white
- Surface light: warm paper white
- Canvas dark: charcoal navy
- Surface dark: lifted graphite
- Text: near-charcoal in light mode, soft white in dark mode
- Muted text: slate gray with enough contrast
- Accent: controlled teal-blue for primary actions, focus, and active states
- Danger: rose only for true exceptions and destructive actions
- Success: green only for delivered or complete states

## Typography

Use a high-quality sans-serif product stack. Keep labels compact, headings direct, and data readable. Body text should stay under 75 characters where prose appears. Numeric and package-ID data may use a monospace style.

## Components

Core components: app shell, auth split screen, theme toggle, fields, status badges, package cards, route progress strips, metric groups, empty states, alerts, search, and action buttons.

Buttons should use consistent rounded pills with tactile active states. Inputs use labels above fields, visible focus rings, and helpful placeholder examples. Status badges should be semantic and compact.

## Layout

Auth pages use an asymmetric split layout with video as a product signal and the form as the task. Desktop can use a large video panel; mobile should stack with the video still visible but not pushing the form below the fold.

Dashboards use predictable product layouts. Avoid nested cards and repeated decorative cards. Group operational details through spacing, borders, headings, and clear metadata rows.

## Motion

Use short 150ms to 250ms transitions for focus, hover, route progress, and page entry. GSAP may handle existing page/card reveal behavior. Avoid decorative motion that delays task completion. Respect reduced-motion settings.

## Media

Keep the existing MP4 assets on login and register. Video should show from top to bottom when possible using object-fit cover with top-centered positioning, and should never make the form unusable on mobile.
