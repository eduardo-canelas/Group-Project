import React, { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AIAssistant from '../components/ai-assistant';
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
  getDriverNextStep,
  getDriverActionQueue,
  getPriorityPackages,
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
    return ['picked_up', 'in_transit'].includes(pkg.status);
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

function buildDriverFlowLanes(packages) {
  return packages.slice(0, 3).map((pkg) => ({
    id: pkg._id,
    title: pkg.packageId || 'Legacy record',
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
        label: pkg.packageId || 'Packet',
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

function DriverLoadLedger({ packages = [], loadingId, onUpdateStatus, focusedPackageId }) {
  if (!packages.length) {
    return <EmptyState title="No active loads on manifest" />;
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
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(13rem,auto)]">
              <div className="grid gap-3 min-w-0">
                <div className="driver-load-topline">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xl font-semibold text-[color:var(--text)]">{pkg.packageId || 'Legacy record'}</p>
                      <StatusBadge status={pkg.status} />
                      {isStalePackage(pkg) ? <GhostChip className="load-board-flag-chip">Needs scan</GhostChip> : null}
                    </div>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">{pkg.description || 'Packet assigned to this shift.'}</p>
                  </div>

                  <div className="driver-load-chip-row">
                    <GhostChip>{pkg.truckId || 'No truck'}</GhostChip>
                    <GhostChip>{pkg.deliveryType || 'store'}</GhostChip>
                    <GhostChip>{pkg.amount ?? pkg.weight ?? '—'} units</GhostChip>
                  </div>
                </div>

                <div className="driver-load-callout">
                  <p className="driver-load-callout-label">Next step</p>
                  <p className="driver-load-callout-title">{nextStep.label}</p>
                  <p className="driver-load-callout-copy">{nextStep.detail}</p>
                </div>

                <RouteProgressStrip
                  pickup={pkg.pickupLocation || 'Pickup'}
                  truckId={pkg.truckId || 'Truck pending'}
                  dropoff={pkg.dropoffLocation || 'Drop-off'}
                  status={pkg.status}
                />

                <div className="driver-load-meta-grid">
                  <p><span>Packet</span>{pkg.packageId || 'Legacy record'}</p>
                  <p><span>Quantity</span>{pkg.amount ?? pkg.weight ?? '—'} units</p>
                  <p><span>Route</span>{`${pkg.pickupLocation || 'Pickup'} -> ${pkg.dropoffLocation || 'Drop-off'}`}</p>
                  <p><span>Last update</span>{formatTimestamp(pkg.updatedAt || pkg.createdAt)}</p>
                </div>

                {getDriverStatusActions(pkg.status).length ? (
                  <div className="flex flex-wrap gap-2">
                    {getDriverStatusActions(pkg.status).map((nextStatus) => (
                      <PrimaryButton
                        key={`${pkg._id}-${nextStatus}`}
                        className="driver-load-status-action"
                        onClick={() => onUpdateStatus(pkg._id, nextStatus)}
                        disabled={loadingId === pkg._id}
                      >
                        Mark {formatStatusLabel(nextStatus)}
                      </PrimaryButton>
                    ))}
                  </div>
                ) : (
                  <GhostChip>Driver updates complete</GhostChip>
                )}
              </div>
            </div>
          </SurfacePanel>
        );
      })}
    </div>
  );
}

function DriverPriorityStack({ packages = [] }) {
  if (!packages.length) {
    return <EmptyState title="Queue clear" />;
  }

  return (
    <div className="grid gap-3">
      {packages.map((pkg) => (
        <SurfacePanel key={pkg._id} className="motion-card">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-semibold text-[color:var(--text)]">{pkg.packageId}</p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">{pkg.description}</p>
              </div>
              <StatusBadge status={pkg.status} />
            </div>
            <RouteProgressStrip
              pickup={pkg.pickupLocation || 'Pickup'}
              truckId={pkg.truckId || 'Truck pending'}
              dropoff={pkg.dropoffLocation || 'Drop-off'}
              status={pkg.status}
            />
            <div className="grid gap-2 text-sm text-[color:var(--muted)]">
              <p>Type: {pkg.deliveryType || 'store'}</p>
              <p>Last scan: {formatTimestamp(pkg.updatedAt || pkg.createdAt)}</p>
            </div>
          </div>
        </SurfacePanel>
      ))}
    </div>
  );
}

function DriverActionCenter({ items = [], checklist = [], onFocusPacket, onJumpToWorkspace }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <SectionHeading
          title="Next Actions"
          description="Immediate tasks to clear first."
          action={onJumpToWorkspace ? (
            <SecondaryButton type="button" onClick={onJumpToWorkspace}>Open update workspace</SecondaryButton>
          ) : null}
        />

        {items.length ? (
          <div className="driver-action-list">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`driver-action-card motion-card driver-action-${item.priority}`.trim()}
                onClick={() => onFocusPacket?.(item.id)}
              >
                <div className="driver-action-card-topline">
                  <span className="showcase-timeline-index">{String(index + 1).padStart(2, '0')}</span>
                  <GhostChip>{item.priority}</GhostChip>
                </div>

                <div className="grid gap-2 text-left">
                  <p className="driver-action-card-title">{item.packageId} • {item.nextStepLabel}</p>
                  <p className="driver-action-card-copy">{item.nextStepDetail}</p>
                </div>

                <div className="driver-action-card-meta">
                  <p>{item.route}</p>
                  <p>{item.amount} units • {item.truckId}</p>
                  <p>{item.updatedAtLabel}</p>
                </div>
              </button>
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
                  <p className="truncate text-lg font-semibold text-[color:var(--text)]">{pkg.packageId || 'Legacy record'}</p>
                  <StatusBadge status={pkg.status} />
                  {isStalePackage(pkg) ? <GhostChip className="load-board-flag-chip">Stale</GhostChip> : null}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-[color:var(--muted)]">{pkg.description || 'Shipment in progress'}</p>
              </div>
              <GhostChip>{pkg.truckId || 'No truck'}</GhostChip>
            </div>

            <div className="load-board-result-route">
              <span>{pkg.pickupLocation || 'Pickup'}</span>
              <span className="load-board-result-separator">-&gt;</span>
              <span>{pkg.dropoffLocation || 'Drop-off'}</span>
            </div>

            <div className="load-board-result-meta-grid">
              <p><span className="load-board-result-meta-label">Last update</span>{formatTimestamp(pkg.updatedAt || pkg.createdAt)}</p>
              <p><span className="load-board-result-meta-label">Freshness</span>{formatRelativeUpdate(pkg.updatedAt || pkg.createdAt)}</p>
              <p><span className="load-board-result-meta-label">Type</span>{pkg.deliveryType || 'Store'}</p>
              <p><span className="load-board-result-meta-label">Amount</span>{pkg.amount ?? pkg.weight ?? '—'}</p>
            </div>

            <div className="load-board-result-actions">
              <SecondaryButton type="button" className="load-board-result-edit" onClick={() => onOpen?.(pkg)}>
                Open load
              </SecondaryButton>

              {getDriverStatusActions(pkg.status).length ? (
                <div className="load-board-result-status-row">
                  {getDriverStatusActions(pkg.status).slice(0, 2).map((nextStatus) => (
                    <PrimaryButton
                      key={`${pkg._id}-${nextStatus}`}
                      className="py-2 px-4 text-xs font-bold"
                      onClick={() => onUpdateStatus?.(pkg._id, nextStatus)}
                      disabled={loadingId === pkg._id}
                    >
                      Mark {formatStatusLabel(nextStatus)}
                    </PrimaryButton>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DriverDashboard() {
  const [packages, setPackages] = useState([]);
  const [error, setError] = useState('');
  const [loadingId, setLoadingId] = useState('');
  const [loadBoardSearch, setLoadBoardSearch] = useState('');
  const [loadBoardStatusFilter, setLoadBoardStatusFilter] = useState('all');
  const [hasTouchedLoadBoardSearch, setHasTouchedLoadBoardSearch] = useState(false);
  const [focusedPackageId, setFocusedPackageId] = useState('');
  const navigate = useNavigate();
  const scope = usePageMotion();
  const updateWorkspaceRef = useRef(null);
  const loadBoardRef = useRef(null);
  const deferredLoadBoardSearch = useDeferredValue(loadBoardSearch);
  const currentUser = getStoredUser();

  const fetchPackages = async () => {
    try {
      const response = await api.get('/packages');
      setPackages(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.response?.data?.message || 'Could not fetch packages.');
    }
  };

  useEffect(() => {
    void fetchPackages();
  }, []);

  const handleEdit = (pkg) => {
    setFocusedPackageId(pkg._id);
    focusPackage(pkg._id);
  };

  const handleUpdateStatus = async (id, status) => {
    setError('');
    setLoadingId(id);

    try {
      await api.put(`/packages/${id}`, { status });
      await fetchPackages();
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.response?.data?.message || 'Could not update status.');
    } finally {
      setLoadingId('');
    }
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
        title: 'Update stale loads',
        detail: `${actionQueue.length || 0} load${actionQueue.length === 1 ? '' : 's'} in the queue. Update oldest first.`,
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
      { status: 'moving', label: 'Moving now', count: movingSearchScopedCount },
      { status: 'delivered', label: 'Delivered', count: deliveredSearchScopedCount },
      { status: 'stale', label: 'Stale updates', count: staleSearchScopedCount },
    ],
    [attentionSearchScopedCount, movingSearchScopedCount, deliveredSearchScopedCount, staleSearchScopedCount],
  );
  const hasActiveFilters = hasTouchedLoadBoardSearch || loadBoardSearch.trim().length > 0 || loadBoardStatusFilter !== 'all';
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
    updateWorkspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    window.setTimeout(() => {
      document.getElementById(`driver-load-${matched._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 140);
  };

  const useFollowUpPrompt = (promptText) => {
    loadBoardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      const promptArea = document.querySelector('.briefing-chat-textarea');
      if (promptArea instanceof HTMLTextAreaElement) {
        promptArea.value = promptText;
        promptArea.dispatchEvent(new Event('input', { bubbles: true }));
        promptArea.focus();
      }
    }, 140);
  };

  return (
    <AppShell
      headerActions={<SecondaryButton type="button" onClick={handleLogout}>Log Out</SecondaryButton>}
      headerClassName="dashboard-header"
    >
      <PageFrame className="dashboard-frame">
        <div ref={scope} className="space-y-5 sm:space-y-6">
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
              </div>
            )}
          />

          {error ? <Alert tone="error">{error}</Alert> : null}

          <div className="dashboard-main-grid dashboard-main-grid-driver">
            <div className="dashboard-stack order-2 lg:order-1">
              <AIAssistant
                className="dashboard-ai-assistant ai-top-panel p-5 sm:p-6"
                title="Ask RoutePulse"
                description="Ask what to do next, then jump straight into the packet that needs your update."
                suggestions={DRIVER_AI_SUGGESTIONS}
                perspective="driver"
                onJumpToWorkspace={scrollToUpdateWorkspace}
                onFocusPackage={focusPackage}
                onUseFollowUp={useFollowUpPrompt}
              />

              <GlassCard ref={updateWorkspaceRef} className="motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-update">
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
                    />
                  </div>

                  <div className="driver-inline-section">
                    <SectionHeading
                      kicker="Priority"
                      title="Needs Attention"
                      description="Loads that should be updated before the rest."
                      action={<GhostChip>{priorityPackages.length} active</GhostChip>}
                    />

                    <div className="mt-5">
                      <DriverPriorityStack packages={priorityPackages} />
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard ref={loadBoardRef} className="hero-panel motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-primary load-board-panel">
                <SectionHeading
                  title="Load Board"
                  description="Track every assigned load in one place."
                  action={<GhostChip>{loadBoardFilteredPackages.length || packages.length} assigned</GhostChip>}
                />

                <div className="mt-5 grid gap-4 flex-1 min-h-0">
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

            <div className="dashboard-stack order-1 lg:order-2">
              <GlassCard className="shift-guide-card motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-primary driver-support-panel">
                <SectionHeading
                  kicker="Driver Support"
                  title="Action Center"
                  description="Tap an action to jump to the packet that needs work."
                />

                <div className="mt-5 grid gap-4 flex-1 min-h-0">
                  <SurfacePanel className="motion-card load-board-shell flex flex-col p-4 sm:p-5">
                    <div className="driver-inline-section driver-inline-section-no-divider dashboard-scroll-region dashboard-scroll-region-support dashboard-scroll-fill driver-support-panel-content flex-1 min-h-0">
                      <DriverActionCenter
                        items={actionQueue}
                        checklist={shiftGuide}
                        onFocusPacket={focusPackage}
                        onJumpToWorkspace={scrollToUpdateWorkspace}
                      />
                    </div>
                  </SurfacePanel>
                </div>
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
    </AppShell>
  );
}

export default DriverDashboard;
