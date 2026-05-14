import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { markDriverTourSeen } from './driver-tour-storage';

const STEPS = [
  {
    id: 'scan',
    target: '[data-tour="scan"]',
    title: 'Step 1 — Scan a package',
    body: 'Tap a load, scan its code, attach a proof photo. GPS auto-sends to dispatch.',
    placement: 'auto',
  },
  {
    id: 'action',
    target: '[data-tour="action-center"]',
    title: 'Step 2 — Action Center',
    body: 'Your next move shows up here. Tap “Open load” to jump to it.',
    placement: 'auto',
  },
  {
    id: 'update',
    target: '[data-tour="update"]',
    title: 'Step 3 — Update Workspace',
    body: 'Mark Picked Up, In Transit, or Delivered with one tap. Updates sync live.',
    placement: 'auto',
  },
  {
    id: 'board',
    target: '[data-tour="board"]',
    title: 'Step 4 — Load Board',
    body: 'Search, filter, find any assigned load fast.',
    placement: 'auto',
  },
];

function getRect(selector) {
  const el = typeof document !== 'undefined' ? document.querySelector(selector) : null;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height, el };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function DriverTour({ open, onClose }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, placement: 'bottom' });
  const tooltipRef = useRef(null);

  const step = STEPS[stepIndex];
  const totalSteps = STEPS.length;
  const isLast = stepIndex === totalSteps - 1;

  const recompute = useCallback(() => {
    if (!open || !step) return;
    const next = getRect(step.target);
    if (!next) { setRect(null); return; }

    next.el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

    const update = () => {
      const r = next.el.getBoundingClientRect();
      const padding = 8;
      const expanded = {
        top: r.top - padding,
        left: r.left - padding,
        width: r.width + padding * 2,
        height: r.height + padding * 2,
      };
      setRect(expanded);

      const tooltipW = Math.min(340, window.innerWidth - 24);
      const tooltipH = tooltipRef.current?.offsetHeight ?? 160;
      const gap = 14;
      const spaceBelow = window.innerHeight - (expanded.top + expanded.height);
      const spaceAbove = expanded.top;
      const placeBelow = spaceBelow >= tooltipH + gap || spaceBelow >= spaceAbove;

      const top = placeBelow
        ? clamp(expanded.top + expanded.height + gap, 12, window.innerHeight - tooltipH - 12)
        : clamp(expanded.top - tooltipH - gap, 12, window.innerHeight - tooltipH - 12);

      const left = clamp(
        expanded.left + expanded.width / 2 - tooltipW / 2,
        12,
        window.innerWidth - tooltipW - 12,
      );
      setTooltipPos({ top, left, placement: placeBelow ? 'bottom' : 'top' });
    };

    window.setTimeout(update, 240);
  }, [open, step]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- recompute reads DOM rect then writes layout-derived state
  useLayoutEffect(() => { recompute(); }, [recompute]);

  useEffect(() => {
    if (!open) return undefined;
    const handler = () => recompute();
    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
    };
  }, [open, recompute]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
      if (event.key === 'ArrowRight') setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
      if (event.key === 'ArrowLeft') setStepIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, totalSteps]);

  const closeAndReset = useCallback(() => {
    setStepIndex(0);
    onClose?.();
  }, [onClose]);

  const handleNext = () => {
    if (isLast) {
      markDriverTourSeen();
      closeAndReset();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handleSkip = () => {
    markDriverTourSeen();
    closeAndReset();
  };

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="driver-tour" role="dialog" aria-modal="true" aria-label={step?.title || 'Driver tour'}>
      <svg className="driver-tour-mask" aria-hidden="true">
        <defs>
          <mask id="driver-tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect ? (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx="14"
                ry="14"
                fill="black"
              />
            ) : null}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(6, 10, 20, 0.72)"
          mask="url(#driver-tour-mask)"
        />
        {rect ? (
          <rect
            x={rect.left}
            y={rect.top}
            width={rect.width}
            height={rect.height}
            rx="14"
            ry="14"
            fill="none"
            stroke="rgba(99, 174, 255, 0.95)"
            strokeWidth="2"
            className="driver-tour-spotlight-ring"
          />
        ) : null}
      </svg>

      <div
        ref={tooltipRef}
        className={`driver-tour-tooltip driver-tour-tooltip-${tooltipPos.placement}`}
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <p className="driver-tour-step">Step {stepIndex + 1} of {totalSteps}</p>
        <h3 className="driver-tour-title">{step?.title}</h3>
        <p className="driver-tour-body">{step?.body}</p>
        <div className="driver-tour-actions">
          <button type="button" className="driver-tour-skip" onClick={handleSkip}>
            Skip tour
          </button>
          <div className="driver-tour-nav">
            {stepIndex > 0 ? (
              <button
                type="button"
                className="driver-tour-back"
                onClick={() => setStepIndex((i) => Math.max(i - 1, 0))}
              >
                Back
              </button>
            ) : null}
            <button type="button" className="driver-tour-next" onClick={handleNext}>
              {isLast ? 'Got it' : 'Next'}
            </button>
          </div>
        </div>
        <div className="driver-tour-dots" aria-hidden="true">
          {STEPS.map((s, i) => (
            <span key={s.id} className={`driver-tour-dot ${i === stepIndex ? 'is-active' : ''}`} />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
