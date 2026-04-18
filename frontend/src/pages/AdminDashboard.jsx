import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AIAssistant from '../components/ai-assistant';
import { usePageMotion } from '../components/motion';
import {
  ExceptionRadar,
  InsightMetricStrip,
  LogisticsFlowBoard,
  RouteProgressStrip,
  WatchGrid,
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
import { clearStoredUser } from '../lib/auth';
import api from '../lib/api';
import { formatStatusLabel, getDeliveryMix, getDriverLeaderboard, getStatusCounts } from '../lib/packageInsights';
import { createPackageForm, deliveryTypeOptions, mapPackageToForm, statusOptions } from '../lib/packageFields';

const progressByStatus = {
  pending: 24,
  picked_up: 44,
  in_transit: 68,
  delivered: 92,
  returned: 52,
  lost: 36,
  cancelled: 18,
};

const activeStatuses = ['pending', 'picked_up', 'in_transit'];
const exceptionStatuses = ['lost', 'returned', 'cancelled'];
const ADMIN_AI_SUGGESTIONS = [
  'Summarize network',
  'Top risks',
  'Leadership update',
];

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
    ownerUsername: formData.ownerUsername,
  };
}

function buildDriverSummaries(packages) {
  const groupedDrivers = new Map();

  packages.forEach((pkg) => {
    if (!pkg.ownerUsername) {
      return;
    }

    const key = pkg.ownerUserId || pkg.ownerUsername;
    const current = groupedDrivers.get(key) || {
      id: key,
      username: pkg.ownerUsername,
      truckIds: new Set(),
      packages: [],
    };

    if (pkg.truckId) {
      current.truckIds.add(pkg.truckId);
    }

    current.packages.push({
      id: pkg._id,
      packageId: pkg.packageId || 'Legacy record',
      description: pkg.description,
      status: pkg.status,
      truckId: pkg.truckId || '—',
    });

    groupedDrivers.set(key, current);
  });

  return Array.from(groupedDrivers.values())
    .map((driver) => ({
      ...driver,
      truckIds: Array.from(driver.truckIds).sort(),
      packages: driver.packages.sort((left, right) => left.packageId.localeCompare(right.packageId)),
    }))
    .sort((left, right) => left.username.localeCompare(right.username));
}

function buildAdminFlowLanes(drivers) {
  return drivers.slice(0, 3).map((driver) => {
    const activeCount = driver.packages.filter((pkg) => activeStatuses.includes(pkg.status)).length;
    const exceptionCount = driver.packages.filter((pkg) => exceptionStatuses.includes(pkg.status)).length;
    const deliveredCount = driver.packages.filter((pkg) => pkg.status === 'delivered').length;
    const averageProgress = Math.round(
      driver.packages.reduce((sum, pkg) => sum + (progressByStatus[pkg.status] ?? 42), 0) / Math.max(driver.packages.length, 1),
    );

    return {
      id: driver.id,
      title: driver.username,
      summary: `${activeCount} live load${activeCount === 1 ? '' : 's'} moving across ${driver.truckIds.length || 1} truck${driver.truckIds.length === 1 ? '' : 's'}.`,
      metric: `${driver.packages.length} packets`,
      truckLabel: `Truck${driver.truckIds.length === 1 ? '' : 's'} ${driver.truckIds.join(', ') || 'not assigned'}`,
      stateLabel:
        exceptionCount > 0
          ? `${exceptionCount} exception${exceptionCount === 1 ? '' : 's'} need admin review`
          : `${deliveredCount} delivered and ${Math.max(driver.packages.length - deliveredCount, 0)} still in transit`,
      startLabel: 'Admin queue',
      endLabel: exceptionCount > 0 ? 'Recovery' : 'Delivery',
      progress: averageProgress,
      emphasis: exceptionCount > 0 ? 'alert' : activeCount > 0 ? 'accent' : 'neutral',
      packets: driver.packages.slice(0, 3).map((pkg) => ({
        label: pkg.packageId,
        status: formatStatusLabel(pkg.status),
      })),
    };
  });
}

function AdminDashboard() {
  const [packages, setPackages] = useState([]);
  const [dataModelSummary, setDataModelSummary] = useState(null);
  const [formData, setFormData] = useState(createPackageForm());
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const scope = usePageMotion();
  const deferredSearch = useDeferredValue(search);

  const loadDashboardData = useCallback(async () => {
    try {
      const [packageResponse, summaryResponse] = await Promise.all([
        api.get('/packages'),
        api.get('/packages/summary'),
      ]);

      setPackages(packageResponse.data);
      setDataModelSummary(summaryResponse.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error
        || requestError.response?.data?.message
        || 'Could not load the dashboard.',
      );
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboardData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadDashboardData]);

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
      await loadDashboardData();
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.response?.data?.message || 'Could not save package.');
    }
  };

  const handleEdit = (pkg) => {
    setEditingId(pkg._id);
    setFormData(mapPackageToForm(pkg));
    document.getElementById('shipment-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDelete = async (id) => {
    setError('');

    try {
      await api.delete(`/packages/${id}`);
      if (editingId === id) {
        resetForm();
      }
      await loadDashboardData();
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.response?.data?.message || 'Could not delete package.');
    }
  };

  const handleLogout = () => {
    clearStoredUser();
    navigate('/');
  };

  const driverSummaries = useMemo(() => buildDriverSummaries(packages), [packages]);
  const registeredDrivers = dataModelSummary?.driverDirectory || [];
  const networkIntelligence = dataModelSummary?.networkIntelligence;
  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const searchScopedPackages = useMemo(() => {
    return packages.filter((pkg) => {
      return !normalizedSearch
        || [
          pkg.packageId,
          pkg.description,
          pkg.ownerUsername,
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

  const filteredDrivers = useMemo(() => {
    if (!normalizedSearch) {
      return driverSummaries;
    }

    return driverSummaries.filter((driver) => {
      const matchesDriver = driver.username.toLowerCase().includes(normalizedSearch);
      const matchesTruck = driver.truckIds.some((truckId) => truckId.toLowerCase().includes(normalizedSearch));
      const matchesPackage = driver.packages.some(
        (pkg) =>
          pkg.packageId.toLowerCase().includes(normalizedSearch) ||
          pkg.description.toLowerCase().includes(normalizedSearch),
      );

      return matchesDriver || matchesTruck || matchesPackage;
    });
  }, [driverSummaries, normalizedSearch]);

  const statusCounts = useMemo(() => getStatusCounts(searchScopedPackages), [searchScopedPackages]);
  const deliveryMix = useMemo(() => getDeliveryMix(packages), [packages]);
  const driverLeaderboard = useMemo(() => getDriverLeaderboard(packages).slice(0, 4), [packages]);
  const recentHandlingEvents = dataModelSummary?.recentHandlingEvents || [];
  const liveLoadCount = useMemo(
    () => packages.filter((pkg) => activeStatuses.includes(pkg.status)).length,
    [packages],
  );
  const exceptionLoadCount = useMemo(
    () => packages.filter((pkg) => exceptionStatuses.includes(pkg.status)).length,
    [packages],
  );
  const deliveredLoadCount = useMemo(
    () => packages.filter((pkg) => pkg.status === 'delivered').length,
    [packages],
  );
  const overviewMetrics = useMemo(
    () => [
      {
        label: 'Active loads',
        value: liveLoadCount,
        tone: 'accent',
      },
      {
        label: 'Exceptions',
        value: exceptionLoadCount,
        tone: exceptionLoadCount > 0 ? 'danger' : 'neutral',
      },
      {
        label: 'Drivers active',
        value: driverSummaries.length,
        tone: 'neutral',
      },
      {
        label: 'Delivered',
        value: deliveredLoadCount,
        tone: 'success',
      },
    ],
    [deliveredLoadCount, driverSummaries.length, exceptionLoadCount, liveLoadCount],
  );
  const driverFocusRows = networkIntelligence?.driverFocus?.length ? networkIntelligence.driverFocus : driverLeaderboard;
  const filterOptions = useMemo(
    () => [{ value: 'all', label: 'All loads', count: searchScopedPackages.length }, ...statusCounts.filter((item) => item.count > 0).map((item) => ({ value: item.status, label: item.label, count: item.count }))],
    [searchScopedPackages.length, statusCounts],
  );
  const hasActiveFilters = search.trim().length > 0 || statusFilter !== 'all';
  const activeSearchSummary = useMemo(() => {
    if (!hasActiveFilters) {
      return 'Search package IDs, drivers, trucks, routes, pickup sites, and drop-off locations.';
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
  const adminFlowLanes = useMemo(() => buildAdminFlowLanes(filteredDrivers.length ? filteredDrivers : driverSummaries), [filteredDrivers, driverSummaries]);
  const flowSummary = useMemo(
    () => [
      { label: 'Active loads', value: liveLoadCount },
      { label: 'Exceptions', value: exceptionLoadCount },
      { label: 'Drivers', value: driverSummaries.length },
    ],
    [driverSummaries.length, exceptionLoadCount, liveLoadCount],
  );

  return (
    <AppShell headerActions={<SecondaryButton type="button" onClick={handleLogout}>Log out</SecondaryButton>}>
      <PageFrame>
        <div ref={scope} className="space-y-4 sm:space-y-6">
          <div className="motion-hero">
            <PageTitle
              kicker="Admin command center"
              title="Admin workspace"
              description="Monitor network health, jump to shipment records, and keep driver operations moving from one control surface."
            />
          </div>

          {error ? <Alert tone="error">{error}</Alert> : null}

          <AIAssistant
            className="motion-section p-5 sm:p-7"
            title="AI assistant"
            description="Dispatcher Atlas helps monitor shipment risk, driver load, and network flow."
            suggestions={ADMIN_AI_SUGGESTIONS}
            perspective="admin"
          />

          <GlassCard className="hero-panel motion-hero p-5 sm:p-8">
            <div className="admin-hero-grid">
              <div className="admin-overview-pane">
                <SectionHeading title="Operations overview" />

                <InsightMetricStrip items={overviewMetrics} dense />
              </div>

              <LogisticsFlowBoard
                className="admin-transit-pane"
                title="Live shipments"
                lanes={adminFlowLanes}
                summary={flowSummary}
                emptyTitle="No active transit yet"
                emptyDescription="Assign a shipment to start visualizing how packets are distributed across the network."
              />
            </div>
          </GlassCard>

          <GlassCard className="motion-section p-5 sm:p-7">
            <SurfacePanel className="admin-search-pane motion-card flex flex-col gap-4">
              <SectionHeading
                title="Find shipments"
                description="Search once, skim the signal cards, then jump straight into the right shipment set."
                action={(
                  <div className="search-results-action">
                    <GhostChip>{filteredPackages.length} match{filteredPackages.length === 1 ? '' : 'es'}</GhostChip>
                    {hasActiveFilters ? <SecondaryButton type="button" onClick={() => { setSearch(''); setStatusFilter('all'); }}>Reset</SecondaryButton> : null}
                  </div>
                )}
              />

              <div className="search-panel-grid xl:grid-cols-[1.15fr_0.85fr]">
                <div className="search-stack">
                  <Field label="Find a shipment fast" hint="Package, driver, truck, route, location">
                    <SearchInput
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      onClear={() => setSearch('')}
                      placeholder="Search PKG-1044, truck 21, warehouse, or driver..."
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

          <div className="grid gap-5 sm:gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <GlassCard className="motion-section p-5 sm:p-7">
              <ExceptionRadar
                title="Exception queue"
                items={networkIntelligence?.exceptionBoard || []}
                emptyTitle="No urgent exceptions right now"
                emptyDescription="The current network snapshot does not show a high-priority recovery queue."
              />
            </GlassCard>

            <GlassCard className="motion-section p-5 sm:p-7">
              <SectionHeading
                kicker="Network watch"
                title="Routes and facilities to monitor"
              />

              <div className="grid gap-6">
                <WatchGrid
                  title="Route watch"
                  items={networkIntelligence?.routePressure || []}
                  metricLabel="active"
                  valueKey="activeShipments"
                />
                <WatchGrid
                  title="Facility watch"
                  items={networkIntelligence?.facilityWatch || []}
                  metricLabel="flagged"
                  valueKey="exceptions"
                />
              </div>
            </GlassCard>
          </div>

          <div className="grid gap-5 sm:gap-6 xl:grid-cols-[0.92fr_1.08fr]">
            <GlassCard className="motion-section p-5 sm:p-7">
              <SectionHeading
                kicker="Drivers"
                title="Driver workload"
              />

              {driverFocusRows.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    title="No driver activity yet"
                    description="Assign shipments to a driver to start tracking workload and follow-up needs."
                  />
                </div>
              ) : (
                <SurfacePanel className="motion-card mt-6">
                  <div className="stats-rail">
                    {driverFocusRows.map((driver) => (
                      <div key={driver.driver} className="stats-row">
                        <div>
                          <p className="text-base font-semibold text-[color:var(--text)]">{driver.driver}</p>
                          <p className="mt-1 text-sm text-[color:var(--muted)]">
                            {driver.summary || `${driver.activeShipments ?? driver.active ?? 0} active loads in motion.`}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <GhostChip>{driver.activeShipments ?? driver.active ?? 0} active</GhostChip>
                          <GhostChip>{driver.exceptionShipments ?? 0} flagged</GhostChip>
                          <GhostChip>{driver.deliveredShipments ?? driver.delivered ?? 0} delivered</GhostChip>
                        </div>
                      </div>
                    ))}
                  </div>
                </SurfacePanel>
              )}
            </GlassCard>

            <GlassCard className="motion-section p-5 sm:p-7">
              <SectionHeading
                kicker="Activity"
                title="Recent handling events"
              />

              {recentHandlingEvents.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    title="No event history yet"
                    description="Handling activity will appear here as drivers move shipments through the route."
                  />
                </div>
              ) : (
                <div className="event-list mt-5">
                  {recentHandlingEvents.map((event, index) => (
                    <div key={event.id} className="event-row">
                      <span className="event-index">{String(index + 1).padStart(2, '0')}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-[color:var(--text)]">{event.packageId}</p>
                        <p className="event-meta">
                          {event.username} moved it through {event.facilityName}
                          {event.facilityType ? ` (${event.facilityType})` : ''}
                        </p>
                      </div>
                      <GhostChip className="self-start">{event.eventType}</GhostChip>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          <div className="grid gap-5 sm:gap-6 xl:grid-cols-[0.96fr_1.04fr]">
            <GlassCard className="motion-section p-5 sm:p-7">
              <SectionHeading
                kicker="Delivery mix"
                title="Shipment volume by service type"
              />

              <SurfacePanel className="motion-card mt-6">
                <div className="stats-rail">
                  {deliveryMix.length === 0 ? (
                    <p className="text-sm text-[color:var(--muted)]">No delivery records yet.</p>
                  ) : (
                    deliveryMix.map((item) => (
                      <div key={item.type} className="stats-row">
                        <div>
                          <p className="text-sm font-semibold capitalize text-[color:var(--text)]">{item.type}</p>
                          <p className="mt-1 text-sm text-[color:var(--muted)]">Current shipment volume in this service lane.</p>
                        </div>
                        <GhostChip>{item.count} loads</GhostChip>
                      </div>
                    ))
                  )}
                </div>
              </SurfacePanel>
            </GlassCard>

            <GlassCard className="motion-section p-5 sm:p-7">
              <SectionHeading
                kicker="Shipment board"
                title="Assignments by driver"
              />

              {filteredDrivers.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    title="No driver matches"
                    description="Try a different search term or assign shipments to a driver username."
                  />
                </div>
              ) : (
                <div className="mt-6 grid gap-5">
                  {filteredDrivers.map((driver) => (
                    <SurfacePanel key={driver.id} className="motion-card">
                      <div className="grid gap-5 xl:grid-cols-[0.34fr_0.66fr]">
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="text-lg font-semibold text-[color:var(--text)]">{driver.username}</p>
                              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                                Truck{driver.truckIds.length === 1 ? '' : 's'}: {driver.truckIds.join(', ') || '—'}
                              </p>
                            </div>
                            <GhostChip>{driver.packages.length} active</GhostChip>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <div className="mini-stat">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-strong)]">Active loads</p>
                              <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--text)]">{driver.packages.length}</p>
                            </div>
                            <div className="mini-stat">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-strong)]">Truck coverage</p>
                              <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--text)]">{driver.truckIds.length || 1}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          {driver.packages.slice(0, 4).map((assignedPackage) => (
                            <div key={assignedPackage.id} className="rounded-[1.35rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[color:var(--text)]">{assignedPackage.packageId}</p>
                                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{assignedPackage.description}</p>
                                </div>
                                <StatusBadge status={assignedPackage.status} />
                              </div>
                              <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[color:var(--muted-strong)]">
                                Truck {assignedPackage.truckId}
                              </p>
                            </div>
                          ))}
                          {driver.packages.length > 4 ? (
                            <div className="rounded-[1.35rem] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                              <p className="text-sm font-semibold text-[color:var(--text)]">+{driver.packages.length - 4} more packets</p>
                              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                                Additional assignments stay hidden here so the board remains easy to scan.
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </SurfacePanel>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          <div className="grid gap-5 sm:gap-6 xl:grid-cols-[0.86fr_1.14fr]">
            <GlassCard className="motion-section p-5 sm:p-7">
              <SectionHeading
                kicker={editingId ? 'Edit shipment' : 'New shipment'}
                title={editingId ? 'Refine the current record' : 'Create a shipment assignment'}
              />

              <form id="shipment-form" className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Driver username" hint="Driver account">
                    <TextInput
                      type="text"
                      value={formData.ownerUsername}
                      onChange={updateField('ownerUsername')}
                      list="registered-driver-usernames"
                      placeholder="driver-one"
                      required
                    />
                    <datalist id="registered-driver-usernames">
                      {registeredDrivers.map((driver) => (
                        <option key={driver.id} value={driver.username} />
                      ))}
                    </datalist>
                  </Field>

                  <Field label="Package ID">
                    <TextInput
                      type="text"
                      value={formData.packageId}
                      onChange={updateField('packageId')}
                      placeholder="PKG-2048"
                      required
                    />
                  </Field>
                </div>

                <Field label="Item description">
                  <TextInput
                    type="text"
                    value={formData.description}
                    onChange={updateField('description')}
                    placeholder="Medical supplies, home goods, retail stock..."
                    required
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Quantity">
                    <TextInput type="number" min="0" step="1" value={formData.amount} onChange={updateField('amount')} required />
                  </Field>

                  <Field label="Truck ID">
                    <TextInput type="text" value={formData.truckId} onChange={updateField('truckId')} placeholder="TRK-21" required />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Pickup location">
                    <TextInput type="text" value={formData.pickupLocation} onChange={updateField('pickupLocation')} placeholder="Warehouse A" required />
                  </Field>

                  <Field label="Dropoff location">
                    <TextInput type="text" value={formData.dropoffLocation} onChange={updateField('dropoffLocation')} placeholder="Target downtown" required />
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
                    {editingId ? 'Update shipment' : 'Create shipment'}
                  </PrimaryButton>
                  {editingId ? <SecondaryButton type="button" onClick={resetForm}>Cancel edit</SecondaryButton> : null}
                </div>
              </form>
            </GlassCard>

            <GlassCard className="motion-section p-5 sm:p-7">
              <SectionHeading
                kicker="Shipment board"
                title="Filtered shipment records"
                action={<GhostChip>{filteredPackages.length} visible</GhostChip>}
              />

              {filteredPackages.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    title="No shipments found"
                    description="Create the first shipment or broaden your current search."
                    action={<PrimaryButton onClick={() => document.getElementById('shipment-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Add shipment</PrimaryButton>}
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
                            <GhostChip>{pkg.deliveryType || 'store'}</GhostChip>
                          </div>
                          <p className="text-sm leading-7 text-[color:var(--muted)]">{pkg.description}</p>
                          <RouteProgressStrip
                            pickup={pkg.pickupLocation || 'Origin'}
                            truckId={pkg.truckId || 'Truck pending'}
                            dropoff={pkg.dropoffLocation || 'Destination'}
                            status={pkg.status}
                          />
                          <div className="grid gap-2 text-sm text-[color:var(--muted)] md:grid-cols-2">
                            <p>Driver: {pkg.ownerUsername || 'Unassigned'}</p>
                            <p>Truck: {pkg.truckId || '—'}</p>
                            <p>Pickup: {pkg.pickupLocation || '—'}</p>
                            <p>Dropoff: {pkg.dropoffLocation || '—'}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <SecondaryButton type="button" onClick={() => handleEdit(pkg)}>Edit</SecondaryButton>
                          <SecondaryButton type="button" tone="danger" onClick={() => handleDelete(pkg._id)}>Remove</SecondaryButton>
                        </div>
                      </div>
                    </SurfacePanel>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </PageFrame>
    </AppShell>
  );
}

export default AdminDashboard;
