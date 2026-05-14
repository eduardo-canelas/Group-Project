import React, { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AIAssistant from '../components/ai-assistant';
import { AccuracyCommandPanel, PackageJourneyTimeline, RouteMapPanel, ScanConsole } from '../components/logistics-intelligence';
import DriverTour from '../components/driver-tour';
import { clearDriverTourFlag, hasSeenDriverTour } from '../components/driver-tour-storage';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePageMotion } from '../components/motion';
import {
  LogisticsFlowBoard,
  RouteProgressStrip,
} from '../components/operations-showcase';
import {
  Alert,
  AppShell,
  EmptyState,
  GhostChip,
  GlassCard,
  PageFrame,
  PageTitle,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
  SectionHeading,
  StatusBadge,
  SurfacePanel,
} from '../components/ui';
import { clearStoredUser, getStoredUser } from '../lib/auth';
import api from '../lib/api';
import {
  formatStatusLabel,
  getDriverGPSUrl,
  getDriverNextStep,
  getDriverActionQueue,
  getPriorityPackages,
  getRouteMapUrl,
} from '../lib/packageInsights';

const DRIVER_AI_SUGGESTIONS = [
  'Summarize shift',
  'What needs attention',
  'Write handoff',
];

const progressByStatus = {
  pending: 24,
  picked_up: 44,
  in_transit: 68,
  delivered: 92,
  returned: 52,
  lost: 36,
  cancelled: 18,
};

const staleThresholdMs = 12 * 60 * 60 * 1000;

const statusSearchAliases = {
  pending: ['pending', 'attention', 'needs attention', 'waiting'],
  picked_up: ['picked up', 'picked', 'collected', 'moving'],
  in_transit: ['in transit', 'transit', 'moving', 'on route'],
  delivered: ['delivered', 'complete', 'done'],
  returned: ['returned', 'return', 'exception', 'attention'],
  lost: ['lost', 'missing', 'exception', 'attention'],
  cancelled: ['cancelled', 'canceled', 'void', 'attention'],
};

const driverStatusActions = {
  pending: ['picked_up'],
  picked_up: ['in_transit', 'delivered'],
  in_transit: ['delivered'],
};

function getPackageTitle(pkg) {
  return pkg.description || 'Assigned Packet';
}

function getActionPackageName(item) {
  return item.description || (item.packageId ? `Package ID ${item.packageId}` : 'Assigned package');
}

function buildActionPrompt(item) {
  const packageName = getActionPackageName(item);
  const packageId = item.packageId && item.packageId !== 'Legacy record'
    ? ` Package ID: ${item.packageId}.`
    : '';
  return `Guide me through ${item.title} for ${packageName}.${packageId} ${item.nextStepDetail}`;
}

function getPackageAmountLabel(pkg) {
  return `${pkg.amount ?? pkg.weight ?? '—'} units`;
}

function formatDeliveryTypeLabel(type) {
  return type
    ? type
      .replace(/_/g, ' ')
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
    : 'Store';
}

function normalizeLookupValue(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getPackageUpdatedAt(pkg) {
  return new Date(pkg.updatedAt || pkg.createdAt || Date.now()).getTime();
}

function isStalePackage(pkg) {
  return ['pending', 'picked_up', 'in_transit'].includes(pkg.status)
    && Date.now() - getPackageUpdatedAt(pkg) > staleThresholdMs;
}

function getPackageSearchFields(pkg) {
  return [
    { value: pkg.packageId, weight: { exact: 180, startsWith: 120, includes: 84 } },
    { value: pkg.truckId, weight: { exact: 150, startsWith: 105, includes: 76 } },
    { value: pkg.pickupLocation, weight: { exact: 110, startsWith: 82, includes: 64 } },
    { value: pkg.dropoffLocation, weight: { exact: 110, startsWith: 82, includes: 64 } },
    { value: pkg.description, weight: { exact: 72, startsWith: 52, includes: 34 } },
    { value: pkg.deliveryType, weight: { exact: 60, startsWith: 44, includes: 28 } },
    { value: pkg.priority, weight: { exact: 58, startsWith: 42, includes: 26 } },
    { value: pkg.scanCode, weight: { exact: 180, startsWith: 120, includes: 84 } },
    { value: pkg.customerName, weight: { exact: 72, startsWith: 52, includes: 34 } },
    { value: formatStatusLabel(pkg.status), weight: { exact: 92, startsWith: 68, includes: 48 } },
    { value: (statusSearchAliases[pkg.status] || []).join(' '), weight: { exact: 70, startsWith: 54, includes: 44 } },
  ];
}

function scoreLookupToken(fieldValue, token, weight) {
  const normalizedField = normalizeLookupValue(fieldValue);
  if (!normalizedField) {
    return -1;
  }

  if (normalizedField === token) {
    return weight.exact;
  }

  if (normalizedField.startsWith(token)) {
    return weight.startsWith;
  }

  if (normalizedField.includes(token)) {
    return weight.includes;
  }

  return -1;
}

function scorePackageLookup(pkg, query) {
  if (!query) {
    return 0;
  }

  const tokens = query.split(' ').filter(Boolean);
  if (!tokens.length) {
    return 0;
  }

  let total = 0;
  const fields = getPackageSearchFields(pkg);

  for (const token of tokens) {
    let tokenScore = -1;
    for (const field of fields) {
      tokenScore = Math.max(tokenScore, scoreLookupToken(field.value, token, field.weight));
    }

    if (tokenScore < 0) {
      return -1;
    }

    total += tokenScore;
  }

  if (isStalePackage(pkg)) {
    total += 16;
  }

  if (['pending', 'lost', 'returned', 'cancelled'].includes(pkg.status)) {
    total += 12;
  }

  return total;
}

function formatRelativeUpdate(value) {
  if (!value) {
    return 'No scan yet';
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return 'No scan yet';
  }

  const diffMs = Date.now() - timestamp;
  const diffHours = Math.max(1, Math.round(diffMs / (60 * 60 * 1000)));
  if (diffHours < 24) {
    return `Updated ${diffHours}h ago`;
  }

  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `Updated ${diffDays}d ago`;
}

function matchesDriverBoardFilter(pkg, filter) {
  if (filter === 'all') {
    return true;
  }

  if (filter === 'attention') {
    return ['pending', 'lost', 'returned', 'cancelled'].includes(pkg.status);
  }

  if (filter === 'moving') {
    return pkg.status === 'in_transit';
  }

  if (filter === 'delivered') {
    return pkg.status === 'delivered';
  }

  if (filter === 'stale') {
    return isStalePackage(pkg);
  }

  return pkg.status === filter;
}

const timestampFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function getDriverStatusActions(status) {
  return driverStatusActions[status] || [];
}

function DriverStatusControls({ pkg, loadingId, onUpdateStatus, compact = false }) {
  const actions = getDriverStatusActions(pkg.status);
  const isLoading = loadingId === pkg._id;

  if (!actions.length) {
    return (
      <div className={`driver-status-controls driver-status-controls-complete ${compact ? 'driver-status-controls-compact' : ''}`.trim()}>
        <div>
          <p className="driver-status-controls-label">Status complete</p>
          <p className="driver-status-controls-copy">Current: {formatStatusLabel(pkg.status)}</p>
        </div>
        <GhostChip>Done</GhostChip>
      </div>
    );
  }

  return (
    <div className={`driver-status-controls ${compact ? 'driver-status-controls-compact' : ''}`.trim()}>
      <div className="driver-status-controls-header">
        <div>
          <p className="driver-status-controls-label">Quick status update</p>
          <p className="driver-status-controls-copy">Current: {formatStatusLabel(pkg.status)}</p>
        </div>
        {isLoading ? <GhostChip>Saving</GhostChip> : null}
      </div>

      <div className="driver-status-button-grid">
        {actions.map((nextStatus) => (
          <PrimaryButton
            key={`${pkg._id}-${nextStatus}`}
            type="button"
            className="driver-load-status-action"
            onClick={() => onUpdateStatus?.(pkg._id, nextStatus)}
            disabled={isLoading}
          >
            Mark {formatStatusLabel(nextStatus)}
          </PrimaryButton>
        ))}
      </div>
    </div>
  );
}

function buildDriverFlowLanes(packages) {
  return packages.slice(0, 3).map((pkg) => ({
    id: pkg._id,
    title: getPackageTitle(pkg),
    summary: pkg.description || 'Shipment in progress',
    metric: formatStatusLabel(pkg.status),
    truckLabel: pkg.truckId ? `Truck ${pkg.truckId}` : 'Truck not assigned',
    stateLabel: `${pkg.pickupLocation || 'Origin'} -> ${pkg.dropoffLocation || 'Destination'}`,
    startLabel: 'Pickup',
    endLabel: 'Drop-off',
    endType: 'warehouse',
    progress: progressByStatus[pkg.status] ?? 40,
    emphasis: ['lost', 'returned', 'cancelled'].includes(pkg.status) ? 'alert' : pkg.status === 'delivered' ? 'success' : 'accent',
    packets: [
      {
        label: getPackageTitle(pkg),
        status: formatStatusLabel(pkg.status),
      },
    ],
  }));
}

function formatTimestamp(value) {
  if (!value) {
    return 'No scan yet';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'No scan yet' : timestampFormatter.format(date);
}

function DriverLoadLedger({ packages = [], loadingId, onUpdateStatus, focusedPackageId, onScanFirst }) {
  if (!packages.length) {
    return (
      <EmptyState
        title="No active loads on manifest"
        description="Once dispatch assigns a load it shows up here. You can still scan a package any time."
        action={onScanFirst ? (
          <PrimaryButton type="button" onClick={onScanFirst}>Scan a package</PrimaryButton>
        ) : null}
      />
    );
  }

  return (
    <div className="grid gap-3">
      {packages.map((pkg) => {
        const nextStep = getDriverNextStep(pkg);

        return (
          <SurfacePanel
            key={pkg._id}
            id={`driver-load-${pkg._id}`}
            className={`motion-card driver-load-card ${focusedPackageId === pkg._id ? 'is-focused' : ''}`.trim()}
          >
            <div className="grid gap-3">
              <div className="driver-load-topline">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xl font-semibold text-[color:var(--text)]">{getPackageTitle(pkg)}</p>
                    <StatusBadge status={pkg.status} />
                    {isStalePackage(pkg) ? <GhostChip className="load-board-flag-chip">Needs scan</GhostChip> : null}
                  </div>
                  <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-wide text-[color:var(--muted-strong)]">
                    Package ID: {pkg.packageId || 'Legacy record'}
                  </p>
                </div>
                <div className="driver-load-chip-row">
                  <GhostChip>{pkg.truckId || 'No truck'}</GhostChip>
                  <GhostChip>{formatDeliveryTypeLabel(pkg.deliveryType)}</GhostChip>
                  <GhostChip>{formatDeliveryTypeLabel(pkg.priority || 'standard')}</GhostChip>
                  <GhostChip>{getPackageAmountLabel(pkg)}</GhostChip>
                </div>
              </div>

              <RouteProgressStrip
                pickup={pkg.pickupLocation || 'Pickup'}
                truckId={pkg.truckId || 'Truck pending'}
                dropoff={pkg.dropoffLocation || 'Drop-off'}
                status={pkg.status}
              />

              <div className="driver-load-body-grid">
                <div className="grid gap-3">
                  <div className="driver-load-callout">
                    <p className="driver-load-callout-label">Next step</p>
                    <p className="driver-load-callout-title">{nextStep.label}</p>
                    <p className="driver-load-callout-copy">{nextStep.detail}</p>
                  </div>

                  <div className="driver-load-meta-grid driver-load-meta-compact">
                    <p><span>Pickup</span>{pkg.pickupLocation || 'Pickup'}</p>
                    <p><span>Drop Off</span>{pkg.dropoffLocation || 'Drop-off'}</p>
                    <p><span>Truck</span>{pkg.truckId || 'No truck'}</p>
                    <p><span>Quantity</span>{getPackageAmountLabel(pkg)}</p>
                    <p><span>Customer</span>{pkg.customerName || 'Not listed'}</p>
                    <p><span>Last Update</span>{formatTimestamp(pkg.updatedAt || pkg.createdAt)}</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  {pkg.deliveryInstructions ? (
                    <div className="driver-load-callout driver-load-proof-callout">
                      <p className="driver-load-callout-label">Delivery proof</p>
                      <p className="driver-load-callout-title">Before marking delivered</p>
                      <p className="driver-load-callout-copy">{pkg.deliveryInstructions}</p>
                    </div>
                  ) : null}

                  {(pkg.pickupLocation || pkg.dropoffLocation) ? (
                    <a
                      href={getRouteMapUrl(pkg)}
                      target="_blank"
                      rel="noreferrer"
                      className="driver-navigate-link"
                    >
                      <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{flexShrink:0}}>
                        <path d="M10 2C6.686 2 4 4.686 4 8c0 4.5 6 10 6 10s6-5.5 6-10c0-3.314-2.686-6-6-6zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="currentColor"/>
                      </svg>
                      Navigate: {pkg.pickupLocation || 'Origin'} → {pkg.dropoffLocation || 'Destination'}
                    </a>
                  ) : null}

                  {getDriverGPSUrl(pkg) ? (
                    <a
                      href={getDriverGPSUrl(pkg)}
                      target="_blank"
                      rel="noreferrer"
                      className="driver-navigate-link driver-gps-link"
                    >
                      <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{flexShrink:0}}>
                        <circle cx="10" cy="10" r="3" fill="currentColor" />
                        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M10 1v3M10 16v3M1 10h3M16 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      View last GPS location
                    </a>
                  ) : null}

                  <DriverStatusControls
                    pkg={pkg}
                    loadingId={loadingId}
                    onUpdateStatus={onUpdateStatus}
                  />

                  {pkg.proofPhoto ? (
                    <div className="driver-proof-photo-wrap">
                      <p className="driver-load-callout-label">Proof photo</p>
                      <img
                        src={pkg.proofPhoto}
                        alt="Delivery proof"
                        className="driver-proof-photo"
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <PackageJourneyTimeline packageId={pkg._id} />
            </div>
          </SurfacePanel>
        );
      })}
    </div>
  );
}


function DriverActionCenter({
  items = [],
  checklist = [],
  loadingId = '',
  onFocusPacket,
  onJumpToWorkspace,
  onAskAssistant,
  onUpdateStatus,
}) {
  const firstAction = items[0];

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        {onJumpToWorkspace ? (
          <div className="flex flex-wrap justify-end gap-2">
            <SecondaryButton type="button" className="driver-workspace-jump-button" onClick={onJumpToWorkspace}>Open update workspace</SecondaryButton>
          </div>
        ) : null}

        {firstAction ? (
          <div className="driver-guided-summary motion-card">
            <div>
              <p className="driver-guided-summary-kicker">Start here</p>
              <p className="driver-guided-summary-title">{getActionPackageName(firstAction)}</p>
              <p className="driver-guided-summary-copy">{firstAction.title}. {firstAction.nextStepDetail}</p>
              <p className="mt-2 font-mono text-[0.7rem] uppercase tracking-wide text-[color:var(--muted-strong)]">Package ID: {firstAction.packageId}</p>
            </div>
            <div className="driver-guided-summary-actions">
              <SecondaryButton type="button" onClick={() => onFocusPacket?.(firstAction.id)}>
                Open {getActionPackageName(firstAction)}
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={() => onAskAssistant?.(buildActionPrompt(firstAction))}
              >
                Ask assistant
              </PrimaryButton>
            </div>
          </div>
        ) : null}

        {items.length ? (
          <div className="driver-action-list">
            {items.map((item, index) => (
              <article
                key={item.id}
                className={`driver-action-card motion-card driver-action-${item.priority}`.trim()}
              >
                <div className="driver-action-card-topline">
                  <span className="showcase-timeline-index">{String(index + 1).padStart(2, '0')}</span>
                  <GhostChip>{item.priority}</GhostChip>
                </div>

                <div className="grid gap-1 text-left">
                  <p className="driver-action-card-title">{getActionPackageName(item)}</p>
                  <p className="driver-action-card-package">{item.title}</p>
                  <p className="font-mono text-[0.7rem] uppercase text-[color:var(--muted-strong)]">Package ID: {item.packageId}</p>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-wide text-[color:var(--muted-strong)]">{item.nextStepLabel}</p>
                  <p className="mt-1 driver-action-card-copy">{item.nextStepDetail}</p>
                </div>

                <div className="driver-action-card-meta">
                  <p>Pickup / Drop Off: {item.route}</p>
                  <p>Quantity / Truck: {item.amount} units • {item.truckId}</p>
                  <p>Last Update: {item.updatedAtLabel}</p>
                </div>

                <div className="driver-action-card-controls">
                  <SecondaryButton type="button" onClick={() => onFocusPacket?.(item.id)}>
                    Open load
                  </SecondaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={() => onAskAssistant?.(buildActionPrompt(item))}
                  >
                    Ask assistant
                  </SecondaryButton>
                  {item.primaryStatus ? (
                    <PrimaryButton
                      type="button"
                      onClick={() => onUpdateStatus?.(item.id, item.primaryStatus)}
                      disabled={loadingId === item.id}
                    >
                      Mark {formatStatusLabel(item.primaryStatus)}
                    </PrimaryButton>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No urgent actions" description="Your queue is clear right now." />
        )}
      </div>

      <div className="driver-inline-section">
        <SectionHeading
          kicker="Shift Close"
          title="Closeout Checklist"
        />

        <div className="shift-guide-list">
          {checklist.map((item, index) => (
            <div key={item.title} className="shift-guide-item motion-card">
              <span className="shift-guide-step">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <p className="font-semibold text-[color:var(--text)]">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DriverBoardSearchResults({
  packages = [],
  search = '',
  statusFilter = 'all',
  hasInteracted = false,
  onOpen,
  onUpdateStatus,
  loadingId = '',
}) {
  const hasScopedResults = hasInteracted || search.trim().length > 0 || statusFilter !== 'all';
  const searchSummary = search.trim()
    ? 'Best matches surface first so drivers can grab the right load quickly.'
    : 'Assigned loads stay visible here while you work.';

  if (!packages.length) {
    return (
      <div className="load-board-results-panel">
        <div className="load-board-results-header">
          <div>
            <p className="load-board-results-label">Load Lookup</p>
            <p className="load-board-results-copy">
              {hasScopedResults ? 'No loads match the current search or filter.' : 'No assigned loads are available right now.'}
            </p>
          </div>
        </div>

        <div className="load-board-results-empty">
          <EmptyState
            title={hasScopedResults ? 'No matching loads' : 'No assigned loads'}
            description={hasScopedResults
              ? 'Try a different package, truck, stop, or status filter.'
              : 'Loads assigned to this shift will appear here.'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="load-board-results-panel">
      <div className="load-board-results-header">
        <div>
          <p className="load-board-results-label">Load Lookup</p>
          <p className="load-board-results-copy">
            {searchSummary}
          </p>
        </div>
        <GhostChip>{packages.length} shown</GhostChip>
      </div>

      <div className="load-board-results-list">
        {packages.map((pkg) => (
          <div key={pkg._id} className="load-board-result-card motion-card">
            <div className="load-board-result-topline">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-lg font-semibold text-[color:var(--text)]">{getPackageTitle(pkg)}</p>
                  <StatusBadge status={pkg.status} />
                  {isStalePackage(pkg) ? <GhostChip className="load-board-flag-chip">Stale</GhostChip> : null}
                </div>
                <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-wide text-[color:var(--muted-strong)]">
                  Package ID: {pkg.packageId || 'Legacy record'}
                </p>
              </div>
              <GhostChip>{pkg.truckId || 'No truck'}</GhostChip>
            </div>

            <div className="load-board-result-route">
              <span>Pickup: {pkg.pickupLocation || 'Pickup'}</span>
              <span className="load-board-result-separator">-&gt;</span>
              <span>Drop Off: {pkg.dropoffLocation || 'Drop-off'}</span>
            </div>

            <div className="load-board-result-meta-grid">
              <p><span className="load-board-result-meta-label">Package</span>{getPackageTitle(pkg)}</p>
              <p><span className="load-board-result-meta-label">Truck</span>{pkg.truckId || 'No truck'}</p>
              <p><span className="load-board-result-meta-label">Type</span>{formatDeliveryTypeLabel(pkg.deliveryType)}</p>
              <p><span className="load-board-result-meta-label">Quantity</span>{getPackageAmountLabel(pkg)}</p>
              <p><span className="load-board-result-meta-label">Status</span>{formatStatusLabel(pkg.status)}</p>
              <p><span className="load-board-result-meta-label">Last Update</span>{formatTimestamp(pkg.updatedAt || pkg.createdAt)}</p>
              <p><span className="load-board-result-meta-label">Freshness</span>{formatRelativeUpdate(pkg.updatedAt || pkg.createdAt)}</p>
            </div>

            <div className="load-board-result-actions">
              <SecondaryButton type="button" className="load-board-result-edit" onClick={() => onOpen?.(pkg)}>
                Open load
              </SecondaryButton>

              <DriverStatusControls
                pkg={pkg}
                loadingId={loadingId}
                onUpdateStatus={onUpdateStatus}
                compact
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskPulseBanner({ pulse, onDismiss }) {
  if (!pulse) return null;
  return (
    <div className={`risk-pulse-banner risk-pulse-banner-${pulse.level}`} role="alert" aria-live="polite">
      <div className="risk-pulse-indicator">
        <span className="risk-pulse-dot" aria-hidden="true" />
      </div>
      <p className="risk-pulse-text">{pulse.message}</p>
      <button type="button" className="risk-pulse-action" onClick={onDismiss} aria-label="Dismiss alert">
        Dismiss
      </button>
    </div>
  );
}

const RISK_DISMISS_KEY = 'routepulse:driver-risk-dismissed-v1';

function DriverDashboard() {
  const [packages, setPackages] = useState([]);
  const [error, setError] = useState('');
  const [loadingId, setLoadingId] = useState('');
  const [riskBannerDismissed, setRiskBannerDismissed] = useState(() => {
    try { return sessionStorage.getItem(RISK_DISMISS_KEY) === '1'; } catch { return false; }
  });
  const [loadBoardSearch, setLoadBoardSearch] = useState('');
  const [loadBoardStatusFilter, setLoadBoardStatusFilter] = useState('all');
  const [hasTouchedLoadBoardSearch, setHasTouchedLoadBoardSearch] = useState(false);
  const [focusedPackageId, setFocusedPackageId] = useState('');
  const [assistantIntent, setAssistantIntent] = useState(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [undoToast, setUndoToast] = useState(null);
  const [lastUpdateAt, setLastUpdateAt] = useState(null);
  const navigate = useNavigate();
  const scope = usePageMotion();
  const updateWorkspaceRef = useRef(null);
  const loadBoardRef = useRef(null);
  const assistantPanelRef = useRef(null);
  const scanPanelRef = useRef(null);
  const undoTimerRef = useRef(null);
  const deferredLoadBoardSearch = useDeferredValue(loadBoardSearch);
  const currentUser = getStoredUser();

  const fetchPackages = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setRefreshing(true);
    try {
      const response = await api.get('/packages');
      setPackages(response.data);
      setLastUpdateAt(Date.now());
      if (!silent) setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.response?.data?.message || 'Could not fetch packages.');
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchPackages();
  }, [fetchPackages]);

  // Polling every 20s, paused when tab hidden
  useEffect(() => {
    let timer = null;
    const tick = () => {
      if (!document.hidden) void fetchPackages({ silent: true });
    };
    const start = () => {
      if (timer) return;
      timer = window.setInterval(tick, 20000);
    };
    const stop = () => {
      if (timer) { window.clearInterval(timer); timer = null; }
    };
    const onVisibility = () => {
      if (document.hidden) { stop(); return; }
      void fetchPackages({ silent: true });
      start();
    };
    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility); };
  }, [fetchPackages]);

  // First-run tour
  useEffect(() => {
    if (!hasSeenDriverTour()) {
      const id = window.setTimeout(() => setTourOpen(true), 500);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, []);

  const openTour = () => { clearDriverTourFlag(); setTourKey((k) => k + 1); setTourOpen(true); };
  const closeTour = () => setTourOpen(false);

  const persistRiskDismiss = () => {
    setRiskBannerDismissed(true);
    try { sessionStorage.setItem(RISK_DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  const handleManualRefresh = () => { void fetchPackages(); };

  const handleEdit = (pkg) => {
    setFocusedPackageId(pkg._id);
    focusPackage(pkg._id);
  };

  const dismissUndo = () => {
    if (undoTimerRef.current) { window.clearTimeout(undoTimerRef.current); undoTimerRef.current = null; }
    setUndoToast(null);
  };

  const handleUpdateStatus = async (id, status) => {
    setError('');
    setLoadingId(id);

    const previous = packages.find((pkg) => pkg._id === id);
    const previousStatus = previous?.status;

    // Optimistic update
    setPackages((current) => current.map((pkg) => (pkg._id === id ? { ...pkg, status } : pkg)));

    try {
      await api.put(`/packages/${id}`, { status });
      await fetchPackages({ silent: true });
      if (status === 'delivered' && previousStatus && previousStatus !== 'delivered') {
        dismissUndo();
        setUndoToast({ id, previousStatus, label: `Marked delivered — ${previous?.description || 'package'}` });
        undoTimerRef.current = window.setTimeout(() => setUndoToast(null), 6000);
      }
    } catch (requestError) {
      // Rollback
      setPackages((current) => current.map((pkg) => (pkg._id === id ? { ...pkg, status: previousStatus } : pkg)));
      setError(requestError.response?.data?.error || requestError.response?.data?.message || 'Could not update status.');
    } finally {
      setLoadingId('');
    }
  };

  const handleUndoDelivered = async () => {
    if (!undoToast) return;
    const { id, previousStatus } = undoToast;
    dismissUndo();
    await handleUpdateStatus(id, previousStatus);
  };

  const handleScan = async (scanPayload) => {
    const response = await api.post('/packages/scan', scanPayload);
    await fetchPackages({ silent: true });
    return response.data;
  };

  const handleLogout = () => {
    clearStoredUser();
    navigate('/');
  };

  const normalizedLoadBoardSearch = normalizeLookupValue(deferredLoadBoardSearch);
  const loadBoardSearchScopedPackages = useMemo(() => {
    return packages
      .map((pkg) => ({
        pkg,
        score: scorePackageLookup(pkg, normalizedLoadBoardSearch),
      }))
      .filter(({ score }) => normalizedLoadBoardSearch ? score >= 0 : true)
      .sort((left, right) => {
        if (left.score !== right.score) {
          return right.score - left.score;
        }

        return getPackageUpdatedAt(right.pkg) - getPackageUpdatedAt(left.pkg);
      })
      .map(({ pkg }) => pkg);
  }, [packages, normalizedLoadBoardSearch]);

  const loadBoardFilteredPackages = useMemo(
    () => loadBoardSearchScopedPackages.filter((pkg) => matchesDriverBoardFilter(pkg, loadBoardStatusFilter)),
    [loadBoardSearchScopedPackages, loadBoardStatusFilter],
  );

  const priorityPackages = useMemo(() => getPriorityPackages(packages), [packages]);
  const actionQueue = useMemo(() => getDriverActionQueue(packages), [packages]);
  const deliveredCount = packages.filter((pkg) => pkg.status === 'delivered').length;
  const shiftGuide = useMemo(
    () => [
      {
        title: 'Work active loads',
        detail: `${actionQueue.length || 0} active load${actionQueue.length === 1 ? '' : 's'} in Action Center. Keep in-transit packages updated until delivered.`,
      },
      {
        title: 'Close exceptions',
        detail: `${priorityPackages.length} load${priorityPackages.length === 1 ? '' : 's'} in pending, returned, lost, or cancelled. Clear them before handoff.`,
      },
      {
        title: 'Keep route data current',
        detail: 'Pickup, drop-off, truck, and status should be correct before you end the shift.',
      },
    ],
    [actionQueue.length, priorityPackages.length],
  );
  const staleSearchScopedCount = useMemo(
    () => loadBoardSearchScopedPackages.filter((pkg) => matchesDriverBoardFilter(pkg, 'stale')).length,
    [loadBoardSearchScopedPackages],
  );
  const movingSearchScopedCount = useMemo(
    () => loadBoardSearchScopedPackages.filter((pkg) => matchesDriverBoardFilter(pkg, 'moving')).length,
    [loadBoardSearchScopedPackages],
  );
  const deliveredSearchScopedCount = useMemo(
    () => loadBoardSearchScopedPackages.filter((pkg) => matchesDriverBoardFilter(pkg, 'delivered')).length,
    [loadBoardSearchScopedPackages],
  );
  const attentionSearchScopedCount = useMemo(
    () => loadBoardSearchScopedPackages.filter((pkg) => matchesDriverBoardFilter(pkg, 'attention')).length,
    [loadBoardSearchScopedPackages],
  );
  const loadBoardStats = useMemo(
    () => [
      { status: 'attention', label: 'Needs attention', count: attentionSearchScopedCount },
      { status: 'moving', label: 'In transit', count: movingSearchScopedCount },
      { status: 'delivered', label: 'Delivered', count: deliveredSearchScopedCount },
      { status: 'stale', label: 'Stale updates', count: staleSearchScopedCount },
    ],
    [attentionSearchScopedCount, movingSearchScopedCount, deliveredSearchScopedCount, staleSearchScopedCount],
  );
  const hasActiveFilters = hasTouchedLoadBoardSearch || loadBoardSearch.trim().length > 0 || loadBoardStatusFilter !== 'all';
  const riskPulse = useMemo(() => {
    if (!packages.length || riskBannerDismissed) return null;
    const critical = packages.filter((pkg) => ['lost', 'cancelled'].includes(pkg.status));
    if (critical.length > 0) {
      return { level: 'critical', message: `${critical.length} package${critical.length === 1 ? '' : 's'} on your shift marked lost or cancelled` };
    }
    const exceptions = packages.filter(
      (pkg) =>
        pkg.status === 'returned' ||
        (['pending', 'picked_up', 'in_transit'].includes(pkg.status) &&
          Date.now() - new Date(pkg.updatedAt || pkg.createdAt).getTime() > 43200000),
    );
    if (exceptions.length > 0) {
      return { level: 'warning', message: `${exceptions.length} package${exceptions.length === 1 ? '' : 's'} need a status update before shift end` };
    }
    return null;
  }, [packages, riskBannerDismissed]);

  const flowLanes = useMemo(() => buildDriverFlowLanes(packages), [packages]);
  const flowSummary = useMemo(
    () => [
      { label: 'Assigned', value: packages.length },
      { label: 'Attention', value: priorityPackages.length },
      { label: 'Delivered', value: deliveredCount },
    ],
    [packages.length, priorityPackages.length, deliveredCount],
  );

  const scrollToUpdateWorkspace = () => {
    const el = updateWorkspaceRef.current;
    if (!el) return;
    gsap.set(el, { autoAlpha: 1, y: 0 });
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.requestAnimationFrame(() => ScrollTrigger.refresh());
  };

  const scrollToScan = () => {
    const el = scanPanelRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const focusPackage = (packageKey) => {
    if (!packageKey) {
      scrollToUpdateWorkspace();
      return;
    }

    const matched = packages.find((pkg) => pkg._id === packageKey || pkg.packageId === packageKey);
    if (!matched) {
      scrollToUpdateWorkspace();
      return;
    }

    setFocusedPackageId(matched._id);
    scrollToUpdateWorkspace();
    const target = () => document.getElementById(`driver-load-${matched._id}`);
    // rAF chain — wait until layout settles after parent scroll
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        target()?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  };

  const useFollowUpPrompt = (promptText) => {
    const prompt = promptText?.trim();
    if (!prompt) return;
    assistantPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setAssistantIntent({ id: Date.now(), prompt });
  };

  return (
    <AppShell
      headerActions={(
        <>
          <SecondaryButton
            type="button"
            onClick={handleManualRefresh}
            className="driver-header-action"
            aria-label="Refresh shipments"
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </SecondaryButton>
          <SecondaryButton
            type="button"
            onClick={openTour}
            className="driver-header-action"
            aria-label="Replay driver tour"
          >
            Help
          </SecondaryButton>
          <SecondaryButton type="button" onClick={handleLogout} className="driver-header-action">Log Out</SecondaryButton>
        </>
      )}
      headerClassName="dashboard-header"
    >
      <PageFrame className="dashboard-frame">
        <div ref={scope} className="space-y-5 sm:space-y-6">
          <RiskPulseBanner pulse={riskPulse} onDismiss={persistRiskDismiss} />

          <PageTitle
            kicker="Driver Dashboard"
            title="Route Command"
            description="Make the next packet move obvious: see what it is, where it goes, what quantity is assigned, and what action comes next."
            action={(
              <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                <GhostChip className="shift-status-pill motion-chip">
                  <span className="shift-status-pill-dot" aria-hidden="true" />
                  <span>{currentUser?.username || 'driver'} live shift</span>
                </GhostChip>
                {lastUpdateAt ? (
                  <GhostChip className="driver-sync-chip" title={new Date(lastUpdateAt).toLocaleTimeString()}>
                    <span className="driver-sync-dot" aria-hidden="true" />
                    Live · auto-sync 20s
                  </GhostChip>
                ) : null}
              </div>
            )}
          />

          <div aria-live="polite" aria-atomic="true">
            {error ? <Alert tone="error">{error}</Alert> : null}
          </div>

          <div className="dashboard-main-grid dashboard-main-grid-driver">

            <div ref={assistantPanelRef} className="driver-ai-slot">
              <AIAssistant
                className="dashboard-ai-assistant ai-top-panel"
                title="Ask RoutePulse"
                description="Ask what to do next, then jump straight into the packet that needs your update."
                suggestions={DRIVER_AI_SUGGESTIONS}
                perspective="driver"
                actionPlan={actionQueue}
                assistantIntent={assistantIntent}
                onJumpToWorkspace={scrollToUpdateWorkspace}
                onFocusPackage={focusPackage}
              />
            </div>

            <div className="dashboard-stack driver-right-stack">
              <GlassCard ref={scanPanelRef} data-tour="scan" className="motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-ledger">
                <div className="dashboard-scroll-region dashboard-scroll-region-flow dashboard-scroll-fill">
                  <div className="grid gap-5">
                    <ScanConsole
                      title="Driver package scan"
                      description="Scan at pickup, truck load, customer door, or exception stop so dispatch knows the real package state."
                      defaultLocation={currentUser?.username ? `${currentUser.username} route` : 'Driver route'}
                      onScan={handleScan}
                    />
                    <RouteMapPanel
                      packages={loadBoardFilteredPackages.length ? loadBoardFilteredPackages : packages}
                      title="Current route map"
                      description="Tap Navigate for turn-by-turn directions. Mark status updates inline."
                      onUpdateStatus={handleUpdateStatus}
                      loadingId={loadingId}
                    />
                  </div>
                </div>
              </GlassCard>

              <GlassCard data-tour="action-center" className="shift-guide-card motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-primary driver-support-panel">
                <SectionHeading
                  kicker="Driver Support"
                  title="Action Center"
                  description="In-transit and open loads stay here so drivers can make the next update fast."
                />

                <div className="mt-5 grid gap-4 flex-1 min-h-0">
                  <SurfacePanel className="motion-card load-board-shell flex flex-col p-4 sm:p-5">
                    <div className="driver-inline-section driver-inline-section-no-divider dashboard-scroll-region dashboard-scroll-region-support dashboard-scroll-fill driver-support-panel-content flex-1 min-h-0">
                      <DriverActionCenter
                        items={actionQueue}
                        checklist={shiftGuide}
                        loadingId={loadingId}
                        onFocusPacket={focusPackage}
                        onJumpToWorkspace={scrollToUpdateWorkspace}
                        onAskAssistant={useFollowUpPrompt}
                        onUpdateStatus={handleUpdateStatus}
                      />
                    </div>
                  </SurfacePanel>
                </div>
              </GlassCard>

              <GlassCard className="motion-section p-5 sm:p-6">
                <AccuracyCommandPanel packages={packages} title="Your delivery accuracy" />
              </GlassCard>

              <GlassCard className="motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-ledger lg:hidden">
                <div className="dashboard-scroll-region dashboard-scroll-region-flow dashboard-scroll-fill">
                  <LogisticsFlowBoard
                    title="Route Flow"
                    description="Live progress for the loads on your shift."
                    lanes={flowLanes}
                    summary={flowSummary}
                    emptyTitle="No active routes"
                    emptyDescription=""
                  />
                </div>
              </GlassCard>
            </div>

            <div className="dashboard-stack driver-left-stack">
              <GlassCard ref={updateWorkspaceRef} data-tour="update" className="motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-update">
                <SectionHeading
                  kicker="Assigned Loads"
                  title="Update Workspace"
                  description="Update packet status with the route, quantity, and next step all in one place."
                />

                <div className="driver-inline-section driver-inline-section-no-divider">
                  <SectionHeading
                    title="Packet Updates"
                    description="Each card shows the packet, its quantity, its route, and the exact next move."
                    action={<GhostChip>{packages.length} shown</GhostChip>}
                    as="h3"
                    titleClassName="text-xl sm:text-2xl"
                  />
                </div>

                <div className="dashboard-scroll-region dashboard-scroll-region-update dashboard-scroll-fill">
                  <div className="mt-5">
                    <DriverLoadLedger
                      packages={packages}
                      loadingId={loadingId}
                      onUpdateStatus={handleUpdateStatus}
                      focusedPackageId={focusedPackageId}
                      onScanFirst={scrollToScan}
                    />
                  </div>

                </div>
              </GlassCard>

              <GlassCard ref={loadBoardRef} data-tour="board" className="hero-panel motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-primary load-board-panel">
                <SectionHeading
                  title="Load Board"
                  description="Track every assigned load in one place."
                  action={<GhostChip>{loadBoardFilteredPackages.length || packages.length} assigned</GhostChip>}
                />

                <div className="mt-5 flex flex-col gap-4 flex-1 min-h-0">
                  <SurfacePanel className="motion-card load-board-shell flex flex-col p-4 sm:p-5">
                    <div className="flex flex-col gap-4 flex-1 min-h-0">
                      <SearchInput
                        name="load_search"
                        value={loadBoardSearch}
                        aria-label="Search loads by package ID, truck, pickup, drop-off, or status"
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          startTransition(() => {
                            setHasTouchedLoadBoardSearch(true);
                            setLoadBoardSearch(nextValue);
                          });
                        }}
                        onClear={() => {
                          startTransition(() => {
                            setHasTouchedLoadBoardSearch(false);
                            setLoadBoardSearch('');
                            setLoadBoardStatusFilter('all');
                          });
                        }}
                        placeholder="Search package ID, truck, stop, or status…"
                      />

                      <div className="dashboard-stat-grid">
                        {loadBoardStats.map((item) => (
                          <button
                            key={item.status}
                            type="button"
                            className={`mini-stat mini-stat-button ${loadBoardStatusFilter === item.status ? 'is-active' : ''}`.trim()}
                            onClick={() => {
                              startTransition(() => {
                                setHasTouchedLoadBoardSearch(true);
                                setLoadBoardStatusFilter((current) => (current === item.status ? 'all' : item.status));
                              });
                            }}
                            aria-pressed={loadBoardStatusFilter === item.status}
                          >
                            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--muted-strong)]">{item.label}</p>
                            <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--text)]">{item.count}</p>
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="search-results-action">
                          <GhostChip>{loadBoardFilteredPackages.length} match{loadBoardFilteredPackages.length === 1 ? '' : 'es'}</GhostChip>
                          {hasActiveFilters ? (
                            <SecondaryButton type="button" onClick={() => {
                              startTransition(() => {
                                setHasTouchedLoadBoardSearch(false);
                                setLoadBoardSearch('');
                                setLoadBoardStatusFilter('all');
                              });
                            }}>
                              Reset
                            </SecondaryButton>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex-1 min-h-0 flex flex-col">
                        <DriverBoardSearchResults
                          packages={loadBoardFilteredPackages}
                          search={loadBoardSearch}
                          statusFilter={loadBoardStatusFilter}
                          hasInteracted={hasTouchedLoadBoardSearch}
                          onOpen={handleEdit}
                          onUpdateStatus={handleUpdateStatus}
                          loadingId={loadingId}
                        />
                      </div>
                    </div>
                  </SurfacePanel>
                </div>
              </GlassCard>

            </div>
          </div>

          <GlassCard className="hidden motion-section p-5 sm:p-6 flex-col dashboard-panel-fixed-ledger lg:flex">
            <div className="dashboard-scroll-region dashboard-scroll-region-flow dashboard-scroll-fill">
              <LogisticsFlowBoard
                title="Route Flow"
                description="Live progress for the loads on your shift."
                lanes={flowLanes}
                summary={flowSummary}
                emptyTitle="No active routes"
                emptyDescription=""
              />
            </div>
          </GlassCard>
        </div>
      </PageFrame>

      <DriverTour key={tourKey} open={tourOpen} onClose={closeTour} />

      {undoToast ? (
        <div className="driver-undo-toast" role="status" aria-live="polite">
          <p className="driver-undo-toast-text">{undoToast.label}</p>
          <div className="driver-undo-toast-actions">
            <button type="button" className="driver-undo-toast-action" onClick={handleUndoDelivered}>Undo</button>
            <button type="button" className="driver-undo-toast-dismiss" onClick={dismissUndo} aria-label="Dismiss">×</button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

export default DriverDashboard;
