import React, { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AIAssistant from '../components/ai-assistant';
import { usePageMotion } from '../components/motion';
import {
  CustodyTimeline,
  LogisticsFlowBoard,
  RouteProgressStrip,
} from '../components/operations-showcase';
import {
  Alert,
  AppShell,
  EmptyState,
  Field,
  FilterPill,
  GhostChip,
  GlassCard,
  PageFrame,
  PageTitle,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
  SectionHeading,
  SelectInput,
  StatusBadge,
  SurfacePanel,
  TextInput,
} from '../components/ui';
import { clearStoredUser, getStoredUser } from '../lib/auth';
import api from '../lib/api';
import {
  formatStatusLabel,
  getDriverActionQueue,
  getPriorityPackages,
  getSuggestedStatuses,
} from '../lib/packageInsights';
import { createPackageForm, deliveryTypeOptions, mapPackageToForm, statusOptions } from '../lib/packageFields';

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

function buildPayload(formData) {
  return {
    packageId: formData.packageId,
    description: formData.description,
    amount: formData.amount,
    deliveryType: formData.deliveryType,
    truckId: formData.truckId,
    pickupLocation: formData.pickupLocation,
    dropoffLocation: formData.dropoffLocation,
    status: formData.status,
  };
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

function DriverLoadLedger({ packages = [], loadingId, onUpdateStatus, onEdit, onDelete }) {
  if (!packages.length) {
    return <EmptyState title="No active loads on manifest" />;
  }

  return (
    <div className="grid gap-3">
      {packages.map((pkg) => (
        <SurfacePanel key={pkg._id} className="motion-card">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(13rem,auto)]">
            <div className="grid gap-3 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-[color:var(--text)]">{pkg.packageId || 'Legacy record'}</p>
                <StatusBadge status={pkg.status} />
                <GhostChip>{pkg.truckId || 'No truck'}</GhostChip>
                <GhostChip>{pkg.deliveryType || 'store'}</GhostChip>
              </div>

              <p className="text-sm leading-6 text-[color:var(--muted)]">{pkg.description}</p>

              <RouteProgressStrip
                pickup={pkg.pickupLocation || 'Pickup'}
                truckId={pkg.truckId || 'Truck pending'}
                dropoff={pkg.dropoffLocation || 'Drop-off'}
                status={pkg.status}
              />

              <div className="grid gap-2 text-sm text-[color:var(--muted)] sm:grid-cols-2 xl:grid-cols-4">
                <p>Amount: {pkg.amount ?? pkg.weight ?? '—'}</p>
                <p>Pickup: {pkg.pickupLocation || '—'}</p>
                <p>Drop-off: {pkg.dropoffLocation || '—'}</p>
                <p>Last update: {formatTimestamp(pkg.updatedAt || pkg.createdAt)}</p>
              </div>

              {getSuggestedStatuses(pkg.status).length ? (
                <div className="flex flex-wrap gap-2">
                  {getSuggestedStatuses(pkg.status).map((nextStatus) => (
                    <FilterPill
                      key={`${pkg._id}-${nextStatus}`}
                      className="text-[0.68rem]"
                      onClick={() => onUpdateStatus(pkg._id, nextStatus)}
                      active={false}
                      disabled={loadingId === pkg._id}
                    >
                      Mark {formatStatusLabel(nextStatus)}
                    </FilterPill>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="driver-load-actions grid gap-3">
              <SelectInput
                value={pkg.status}
                disabled={loadingId === pkg._id}
                onChange={(event) => onUpdateStatus(pkg._id, event.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>

              <div className="driver-load-btn-row flex gap-3">
                <SecondaryButton type="button" className="flex-1" onClick={() => onEdit(pkg)}>Edit</SecondaryButton>
                <SecondaryButton type="button" tone="danger" className="flex-1" onClick={() => onDelete(pkg._id)}>Delete</SecondaryButton>
              </div>
            </div>
          </div>
        </SurfacePanel>
      ))}
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

function DriverActionCenter({ items = [], checklist = [] }) {
  return (
    <div className="grid gap-6">
      <CustodyTimeline
        title="Next Actions"
        description="Immediate tasks to clear first."
        items={items}
        compact
      />

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
  onEdit,
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
              <SecondaryButton type="button" className="load-board-result-edit" onClick={() => onEdit?.(pkg)}>
                Open load
              </SecondaryButton>

              {getSuggestedStatuses(pkg.status).length ? (
                <div className="load-board-result-status-row">
                  {getSuggestedStatuses(pkg.status).slice(0, 2).map((nextStatus) => (
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
  const [formData, setFormData] = useState(createPackageForm());
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const [loadingId, setLoadingId] = useState('');
  const [loadBoardSearch, setLoadBoardSearch] = useState('');
  const [loadBoardStatusFilter, setLoadBoardStatusFilter] = useState('all');
  const [hasTouchedLoadBoardSearch, setHasTouchedLoadBoardSearch] = useState(false);
  const navigate = useNavigate();
  const scope = usePageMotion();
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

  const updateField = (field) => (event) => {
    setFormData((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const resetForm = () => {
    setEditingId('');
    setFormData(createPackageForm());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const payload = buildPayload(formData);

      if (editingId) {
        await api.put(`/packages/${editingId}`, payload);
      } else {
        await api.post('/packages', payload);
      }

      resetForm();
      await fetchPackages();
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.response?.data?.message || 'Could not save package.');
    }
  };

  const handleEdit = (pkg) => {
    setEditingId(pkg._id);
    setFormData(mapPackageToForm(pkg));
    document.getElementById('driver-shipment-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const handleDelete = async (id) => {
    setError('');

    try {
      await api.delete(`/packages/${id}`);
      if (editingId === id) {
        resetForm();
      }
      await fetchPackages();
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.response?.data?.message || 'Could not delete package.');
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
  const filterOptions = useMemo(
    () => ([
      { value: 'all', label: 'All loads', count: loadBoardSearchScopedPackages.length },
      { value: 'attention', label: 'Needs attention', count: attentionSearchScopedCount },
      { value: 'moving', label: 'Moving', count: movingSearchScopedCount },
      { value: 'stale', label: 'Stale', count: staleSearchScopedCount },
      { value: 'delivered', label: 'Delivered', count: deliveredSearchScopedCount },
    ].filter((item) => item.value === 'all' || item.count > 0)),
    [loadBoardSearchScopedPackages.length, attentionSearchScopedCount, movingSearchScopedCount, staleSearchScopedCount, deliveredSearchScopedCount],
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

  return (
    <AppShell
      headerActions={<SecondaryButton type="button" onClick={handleLogout}>Log Out</SecondaryButton>}
      headerClassName="dashboard-header"
    >
      <PageFrame className="dashboard-frame">
        <div ref={scope} className="space-y-5 sm:space-y-6">
          <div className="motion-hero grid gap-5">
            <PageTitle
              kicker="Driver Dashboard"
              title="Route Command"
              action={(
                <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                  <GhostChip className="shift-status-pill motion-chip">
                    <span className="shift-status-pill-dot" aria-hidden="true" />
                    <span>{currentUser?.username || 'driver'} live shift</span>
                  </GhostChip>
                </div>
              )}
            />

            <AIAssistant
              className="dashboard-ai-assistant ai-top-panel p-5 sm:p-6"
              title="Ask RoutePulse"
              suggestions={DRIVER_AI_SUGGESTIONS}
              perspective="driver"
            />
          </div>

          {error ? <Alert tone="error">{error}</Alert> : null}

          <div className="dashboard-main-grid dashboard-main-grid-driver">
            <div className="dashboard-stack order-2 lg:order-1">
              <GlassCard className="motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-update">
                <SectionHeading
                  kicker="Assigned Loads"
                  title="Update Workspace"
                  description="Status, route, and priority in one editing surface."
                />

                <div className="driver-inline-section driver-inline-section-no-divider">
                  <SectionHeading
                    title="Shipment Updates"
                    description="Status, route, and edit controls for your route."
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
                    onEdit={handleEdit}
                    onDelete={handleDelete}
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

              <GlassCard className="hero-panel motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-primary load-board-panel">
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
                          onEdit={handleEdit}
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
              <GlassCard className="motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-update">
                <SectionHeading
                  kicker={editingId ? 'Edit Load' : 'Quick Entry'}
                  title={editingId ? 'Update Load' : 'Create Load'}
                  description="Add a shipment record without leaving the dashboard."
                />

                <form id="driver-shipment-form" className="mt-5 space-y-4 pb-4" onSubmit={handleSubmit}>
                  <Field label="Package ID">
                    <TextInput name="package_id" type="text" value={formData.packageId} onChange={updateField('packageId')} placeholder="PKG-3021" required autoComplete="off" spellCheck={false} />
                  </Field>

                  <Field label="Description">
                    <TextInput name="description" type="text" value={formData.description} onChange={updateField('description')} placeholder="Retail order, refill pallet, return shipment…" required autoComplete="off" />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Quantity">
                      <TextInput name="amount" type="number" min="0" step="1" value={formData.amount} onChange={updateField('amount')} required />
                    </Field>

                    <Field label="Truck ID">
                      <TextInput name="truck_id" type="text" value={formData.truckId} onChange={updateField('truckId')} placeholder="TRK-09" required autoComplete="off" spellCheck={false} />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Pickup location">
                      <TextInput name="pickup_location" type="text" value={formData.pickupLocation} onChange={updateField('pickupLocation')} placeholder="Warehouse A" autoComplete="off" />
                    </Field>

                    <Field label="Drop-off location">
                      <TextInput name="dropoff_location" type="text" value={formData.dropoffLocation} onChange={updateField('dropoffLocation')} placeholder="Storefront B" required autoComplete="off" />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Delivery type">
                      <SelectInput name="delivery_type" value={formData.deliveryType} onChange={updateField('deliveryType')}>
                        {deliveryTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>

                    <Field label="Status">
                      <SelectInput name="status" value={formData.status} onChange={updateField('status')}>
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </SelectInput>
                    </Field>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <PrimaryButton type="submit" className="flex-1">
                      {editingId ? 'Save Load' : 'Create Load'}
                    </PrimaryButton>
                    {editingId ? <SecondaryButton type="button" onClick={resetForm}>Cancel Edit</SecondaryButton> : null}
                  </div>
                </form>
              </GlassCard>

              <GlassCard className="shift-guide-card motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-primary driver-support-panel">
                <SectionHeading
                  kicker="Driver Support"
                  title="Action Center"
                  description="Immediate tasks and end-of-shift checks."
                />

                <div className="mt-5 grid gap-4 flex-1 min-h-0">
                  <SurfacePanel className="motion-card load-board-shell flex flex-col p-4 sm:p-5">
                    <div className="driver-inline-section driver-inline-section-no-divider dashboard-scroll-region dashboard-scroll-region-support dashboard-scroll-fill driver-support-panel-content flex-1 min-h-0">
                      <DriverActionCenter
                        items={actionQueue}
                        checklist={shiftGuide}
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
