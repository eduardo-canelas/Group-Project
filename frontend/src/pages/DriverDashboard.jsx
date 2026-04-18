import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AIAssistant from '../components/ai-assistant';
import { usePageMotion } from '../components/motion';
import {
  CapabilityNarrative,
  CustodyTimeline,
  InsightMetricStrip,
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
  getDriverMomentum,
  getPriorityPackages,
  getStatusCounts,
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

function DriverDashboard() {
  const [packages, setPackages] = useState([]);
  const [formData, setFormData] = useState(createPackageForm());
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const [loadingId, setLoadingId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const scope = usePageMotion();
  const deferredSearch = useDeferredValue(search);
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
    fetchPackages();
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

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const searchScopedPackages = useMemo(() => {
    return packages.filter((pkg) => {
      return !normalizedSearch
        || [
          pkg.packageId,
          pkg.description,
          pkg.truckId,
          pkg.pickupLocation,
          pkg.dropoffLocation,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [packages, normalizedSearch]);

  const filteredPackages = useMemo(
    () => searchScopedPackages.filter((pkg) => statusFilter === 'all' || pkg.status === statusFilter),
    [searchScopedPackages, statusFilter],
  );

  const statusCounts = useMemo(() => getStatusCounts(searchScopedPackages), [searchScopedPackages]);
  const priorityPackages = useMemo(() => getPriorityPackages(packages), [packages]);
  const actionQueue = useMemo(() => getDriverActionQueue(packages), [packages]);
  const momentumCards = useMemo(() => getDriverMomentum(packages), [packages]);
  const activePackages = packages.filter((pkg) => ['pending', 'picked_up', 'in_transit'].includes(pkg.status));
  const deliveredCount = packages.filter((pkg) => pkg.status === 'delivered').length;
  const shiftGuide = useMemo(
    () => [
      {
        title: 'Update stale loads',
        detail: `${actionQueue.length || 0} load${actionQueue.length === 1 ? '' : 's'} in the queue. Update oldest first.`,
      },
      {
        title: 'Close exceptions',
        detail: `${priorityPackages.length} load${priorityPackages.length === 1 ? '' : 's'} in pending, returned, lost, or cancelled — resolve before shift end.`,
      },
      {
        title: 'Keep locations current',
        detail: `Pickup, dropoff, truck, and status should be up to date before handoff.`,
      },
    ],
    [actionQueue.length, priorityPackages.length],
  );
  const filterOptions = useMemo(
    () => [{ value: 'all', label: 'All loads', count: searchScopedPackages.length }, ...statusCounts.filter((item) => item.count > 0).map((item) => ({ value: item.status, label: item.label, count: item.count }))],
    [searchScopedPackages.length, statusCounts],
  );
  const hasActiveFilters = search.trim().length > 0 || statusFilter !== 'all';
  const activeSearchSummary = useMemo(() => {
    if (!hasActiveFilters) {
      return 'Search package IDs, trucks, pickup points, and drop-off stops.';
    }

    const parts = [];
    if (search.trim()) {
      parts.push(`Query: "${search.trim()}"`);
    }
    if (statusFilter !== 'all') {
      parts.push(`Status: ${formatStatusLabel(statusFilter)}`);
    }
    return parts.join(' • ');
  }, [hasActiveFilters, search, statusFilter]);
  const flowLanes = useMemo(() => buildDriverFlowLanes(filteredPackages.length ? filteredPackages : packages), [filteredPackages, packages]);
  const flowSummary = useMemo(
    () => [
      { label: 'Assigned', value: packages.length },
      { label: 'Attention', value: priorityPackages.length },
      { label: 'Delivered', value: deliveredCount },
    ],
    [packages.length, priorityPackages.length, deliveredCount],
  );

  return (
    <AppShell headerActions={<SecondaryButton type="button" onClick={handleLogout}>Log out</SecondaryButton>}>
      <PageFrame>
        <div ref={scope} className="space-y-4 sm:space-y-6">
          <div className="motion-hero">
            <PageTitle
              kicker="Driver mobile workspace"
              title="Driver workspace"
              description="Find the next load fast, update status with less friction, and keep the route board readable on mobile."
            />
          </div>

          {error ? <Alert tone="error">{error}</Alert> : null}

          <AIAssistant
            className="motion-section p-5 sm:p-7"
            title="AI assistant"
            description="Dispatcher Atlas helps with live loads, attention points, and shift handoffs."
            suggestions={DRIVER_AI_SUGGESTIONS}
            perspective="driver"
          />

          <GlassCard className="hero-panel motion-hero p-5 sm:p-8">
            <div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
              <div className="driver-overview-pane">
                <GhostChip className="shift-status-pill motion-chip">
                  <span className="shift-status-pill-dot" aria-hidden="true" />
                  <span>{currentUser?.username || 'driver'} live shift</span>
                </GhostChip>
                <SectionHeading title="Your active loads at a glance." />

                <InsightMetricStrip
                  className="driver-overview-metrics"
                  dense
                  items={
                    momentumCards.length
                      ? momentumCards
                      : [
                        { label: 'Assigned', value: packages.length, tone: 'accent' },
                        { label: 'Active', value: activePackages.length, tone: 'neutral' },
                        { label: 'Delivered', value: deliveredCount, tone: 'success' },
                    ]
                  }
                />
              </div>

              <LogisticsFlowBoard
                title="Active loads"
                lanes={flowLanes}
                summary={flowSummary}
                emptyTitle="No loads yet"
                emptyDescription="Create a load to see it here."
              />
            </div>
          </GlassCard>

          <GlassCard className="motion-section p-5 sm:p-7">
            <SurfacePanel className="motion-card flex flex-col gap-4">
              <SectionHeading
                title="Find loads"
                description="Search once, use quick status chips, and keep the route board cleaner on smaller screens."
                action={(
                  <div className="search-results-action">
                    <GhostChip>{filteredPackages.length} match{filteredPackages.length === 1 ? '' : 'es'}</GhostChip>
                    {hasActiveFilters ? <SecondaryButton type="button" onClick={() => { setSearch(''); setStatusFilter('all'); }}>Reset</SecondaryButton> : null}
                  </div>
                )}
              />

              <div className="search-panel-grid xl:grid-cols-[1.15fr_0.85fr]">
                <div className="search-stack">
                  <Field label="Find a load fast" hint="Package, truck, pickup, drop-off">
                    <SearchInput
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      onClear={() => setSearch('')}
                      placeholder="Search PKG-1002, truck 7, or warehouse..."
                    />
                  </Field>

                  <div className="search-helper-row">
                    <p className="search-helper-copy">{activeSearchSummary}</p>
                  </div>

                  <div className="search-filter-group">
                    <p className="search-filter-label">Filter by status</p>
                    <div className="search-filter-pills">
                    {filterOptions.map((option) => (
                      <FilterPill
                        key={option.value}
                        active={statusFilter === option.value}
                        onClick={() => setStatusFilter(option.value)}
                      >
                        {option.label}
                        <span className="filter-pill-count">{option.count}</span>
                      </FilterPill>
                    ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {statusCounts.slice(0, 4).map((item) => (
                    <button
                      key={item.status}
                      type="button"
                      className={`mini-stat mini-stat-button ${statusFilter === item.status ? 'is-active' : ''}`.trim()}
                      onClick={() => setStatusFilter((current) => (current === item.status ? 'all' : item.status))}
                      aria-pressed={statusFilter === item.status}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[color:var(--muted-strong)]">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--text)]">{item.count}</p>
                    </button>
                  ))}
                </div>
              </div>
            </SurfacePanel>
          </GlassCard>

          <div className="grid gap-5 sm:gap-6 xl:grid-cols-[1.02fr_0.98fr]">
            <GlassCard className="motion-section p-5 sm:p-7">
              <CustodyTimeline
                title="Action Queue"
                description="Loads that need a status update."
                items={actionQueue}
                compact
              />
            </GlassCard>

            <CapabilityNarrative
              title="Quick tips"
              description="Keep your loads moving efficiently."
              items={[
                'Use filters to find a specific load fast.',
                'Tap a status pill to update without opening the form.',
                'Use the AI assistant to summarize your shift or handoff.',
              ]}
              eyebrow="Tips"
            />
          </div>

          <div className="grid gap-5 sm:gap-6 xl:grid-cols-[0.86fr_1.14fr]">
            <GlassCard className="motion-section p-5 sm:p-7">
              <SectionHeading
                kicker={editingId ? 'Edit' : 'New'}
                title={editingId ? 'Update Load' : 'Create Load'}
              />

              <form id="driver-shipment-form" className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <Field label="Package ID">
                  <TextInput type="text" value={formData.packageId} onChange={updateField('packageId')} placeholder="PKG-3021" required />
                </Field>

                <Field label="Item description">
                  <TextInput type="text" value={formData.description} onChange={updateField('description')} placeholder="Retail order, refill pallet, return shipment..." required />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Quantity">
                    <TextInput type="number" min="0" step="1" value={formData.amount} onChange={updateField('amount')} required />
                  </Field>

                  <Field label="Truck ID">
                    <TextInput type="text" value={formData.truckId} onChange={updateField('truckId')} placeholder="TRK-09" required />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Pickup location">
                    <TextInput type="text" value={formData.pickupLocation} onChange={updateField('pickupLocation')} placeholder="Warehouse A" />
                  </Field>

                  <Field label="Dropoff location">
                    <TextInput type="text" value={formData.dropoffLocation} onChange={updateField('dropoffLocation')} placeholder="Storefront B" required />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Delivery type">
                    <SelectInput value={formData.deliveryType} onChange={updateField('deliveryType')}>
                      {deliveryTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>

                  <Field label="Status">
                    <SelectInput value={formData.status} onChange={updateField('status')}>
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
                    {editingId ? 'Update load' : 'Create load'}
                  </PrimaryButton>
                  {editingId ? <SecondaryButton type="button" onClick={resetForm}>Cancel edit</SecondaryButton> : null}
                </div>
              </form>
            </GlassCard>

            <GlassCard className="motion-section p-5 sm:p-7">
              <SectionHeading
                kicker="Assignments"
                title="Route Board"
                action={<GhostChip>{filteredPackages.length} results</GhostChip>}
              />

              {filteredPackages.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    title="No matching loads"
                    description="Broaden the search or create a shipment from the form."
                  />
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {filteredPackages.map((pkg) => (
                    <SurfacePanel key={pkg._id} className="motion-card">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-xl font-semibold text-[color:var(--text)]">{pkg.packageId || 'Legacy record'}</p>
                            <StatusBadge status={pkg.status} />
                            <GhostChip>{pkg.truckId || 'no truck'}</GhostChip>
                          </div>
                          <p className="text-sm leading-7 text-[color:var(--muted)]">{pkg.description}</p>
                          <RouteProgressStrip
                            pickup={pkg.pickupLocation || 'Pickup'}
                            truckId={pkg.truckId || 'Truck pending'}
                            dropoff={pkg.dropoffLocation || 'Drop-off'}
                            status={pkg.status}
                          />
                          <div className="grid gap-2 text-sm text-[color:var(--muted)] md:grid-cols-2">
                            <p>Amount: {pkg.amount ?? pkg.weight ?? '—'}</p>
                            <p>Type: {pkg.deliveryType || 'store'}</p>
                            <p>Pickup: {pkg.pickupLocation || 'Assigned truck'}</p>
                            <p>Dropoff: {pkg.dropoffLocation || '—'}</p>
                          </div>

                          {getSuggestedStatuses(pkg.status).length ? (
                            <div className="flex flex-wrap gap-2">
                              {getSuggestedStatuses(pkg.status).map((nextStatus) => (
                                <FilterPill
                                  key={`${pkg._id}-${nextStatus}`}
                                  className="text-[0.68rem]"
                                  onClick={() => handleUpdateStatus(pkg._id, nextStatus)}
                                  active={false}
                                  disabled={loadingId === pkg._id}
                                >
                                  Mark {formatStatusLabel(nextStatus)}
                                </FilterPill>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex min-w-[13rem] flex-col gap-3">
                          <SelectInput
                            value={pkg.status}
                            disabled={loadingId === pkg._id}
                            onChange={(event) => handleUpdateStatus(pkg._id, event.target.value)}
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </SelectInput>

                          <div className="flex flex-wrap gap-3">
                            <SecondaryButton type="button" onClick={() => handleEdit(pkg)}>Edit</SecondaryButton>
                            <SecondaryButton type="button" tone="danger" onClick={() => handleDelete(pkg._id)}>Delete</SecondaryButton>
                          </div>

                          <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                            Last update: {new Date(pkg.updatedAt || pkg.createdAt || Date.now()).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </SurfacePanel>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          <div className="grid gap-5 sm:gap-6 xl:grid-cols-[0.88fr_1.12fr]">
            <GlassCard className="motion-section p-5 sm:p-7">
              <SectionHeading
                kicker="Attention"
                title="Needs Action"
              />

              {priorityPackages.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    title="No urgent loads"
                    description="All shipments are on track."
                  />
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {priorityPackages.map((pkg) => (
                    <SurfacePanel key={pkg._id} className="motion-card">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-lg font-semibold text-[color:var(--text)]">{pkg.packageId}</p>
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
                        <div className="grid gap-2 text-sm text-[color:var(--muted)] sm:grid-cols-2">
                          <p>Type: {pkg.deliveryType || 'store'}</p>
                          <p>Last scan: {new Date(pkg.updatedAt || pkg.createdAt || Date.now()).toLocaleString()}</p>
                        </div>
                      </div>
                    </SurfacePanel>
                  ))}
                </div>
              )}
            </GlassCard>

            <GlassCard className="shift-guide-card motion-section p-5 sm:p-7">
              <SectionHeading
                kicker="Shift handoff"
                title="End-of-Shift Checklist"
              />

              <div className="shift-guide-list">
                {shiftGuide.map((item, index) => (
                  <div key={item.title} className="shift-guide-item motion-card">
                    <span className="shift-guide-step">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="font-semibold text-[color:var(--text)]">{item.title}</p>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </PageFrame>
    </AppShell>
  );
}

export default DriverDashboard;
