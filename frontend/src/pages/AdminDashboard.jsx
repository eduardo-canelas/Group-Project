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
import { formatStatusLabel, getStatusCounts } from '../lib/packageInsights';
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
      summary: `${activeCount} live load${activeCount === 1 ? '' : 's'} across ${driver.truckIds.length || 1} truck${driver.truckIds.length === 1 ? '' : 's'}.`,
      metric: `${driver.packages.length} packets`,
      truckLabel: `Truck${driver.truckIds.length === 1 ? '' : 's'} ${driver.truckIds.join(', ') || 'not assigned'}`,
      stateLabel:
        exceptionCount > 0
          ? `${exceptionCount} exception${exceptionCount === 1 ? '' : 's'} need admin review`
          : `${deliveredCount} delivered and ${Math.max(driver.packages.length - deliveredCount, 0)} still moving`,
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

function formatTimestamp(value) {
  if (!value) {
    return 'No scan yet';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'No scan yet' : timestampFormatter.format(date);
}

function getDriverCounts(driver) {
  return {
    active: driver.packages.filter((pkg) => activeStatuses.includes(pkg.status)).length,
    exceptions: driver.packages.filter((pkg) => exceptionStatuses.includes(pkg.status)).length,
    delivered: driver.packages.filter((pkg) => pkg.status === 'delivered').length,
  };
}

function AdminAssignmentRoster({ drivers = [] }) {
  if (!drivers.length) {
    return <EmptyState title="No active assignments" />;
  }

  return (
    <div className="grid gap-3">
      {drivers.map((driver) => {
        const counts = getDriverCounts(driver);

        return (
          <SurfacePanel key={driver.id} className="motion-card">
            <div className="grid gap-6 lg:grid-cols-[14rem_1fr] xl:grid-cols-[16rem_1fr] lg:items-stretch">
              <div className="flex flex-col justify-center gap-5">
                <div>
                  <h3 className="flex items-center gap-3 text-lg font-semibold tracking-tight text-[color:var(--text)]">
                    {driver.username}
                    <span className="driver-board-inline-meta">
                      {driver.packages.length} total
                    </span>
                  </h3>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    Trucks: {driver.truckIds.join(', ') || 'Unassigned'}
                  </p>
                </div>

                <div className="flex items-center gap-5">
                  <div className="flex flex-col">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[color:var(--muted-strong)]">Active</span>
                    <span className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--text)]">{counts.active}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[color:var(--muted-strong)]">Flagged</span>
                    <span className={`mt-1 text-2xl font-semibold tracking-tight ${counts.exceptions > 0 ? 'text-[#fb7185]' : 'text-[color:var(--text)]'}`.trim()}>
                      {counts.exceptions}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-[color:var(--muted-strong)]">Delivered</span>
                    <span className="mt-1 text-2xl font-semibold tracking-tight text-[color:var(--text)]">{counts.delivered}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] items-stretch w-full">
                {driver.packages.slice(0, 6).map((assignedPackage) => (
                  <div key={assignedPackage.id} className="flex flex-col justify-between relative w-full rounded-2xl bg-[color:var(--surface)]/50 px-4 py-3 ring-1 ring-inset ring-[color:var(--border)] transition-colors hover:bg-[color:var(--surface)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold tracking-tight text-[color:var(--text)]">{assignedPackage.packageId}</p>
                        <p className="mt-1 line-clamp-1 text-sm text-[color:var(--muted)]">{assignedPackage.description}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="driver-board-package-status">{formatStatusLabel(assignedPackage.status)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-[color:var(--muted)]">
                      <span>Truck {assignedPackage.truckId}</span>
                      {activeStatuses.includes(assignedPackage.status) ? <span aria-hidden="true">•</span> : null}
                      {activeStatuses.includes(assignedPackage.status) ? (
                        <span className="driver-board-package-live">Live</span>
                      ) : null}
                    </div>
                  </div>
                ))}
                {driver.packages.length > 6 ? (
                  <div className="flex w-full items-center justify-center rounded-2xl border border-dashed border-[color:var(--border)] bg-transparent p-4 text-center">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--text)]">+{driver.packages.length - 6} loads</p>
                      <p className="mt-1 text-[0.65rem] uppercase tracking-wider text-[color:var(--muted)]">Use search to view</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </SurfacePanel>
        );
      })}
    </div>
  );
}

function AdminShipmentLedger({ packages = [], onEdit, onDelete }) {
  if (!packages.length) {
    return <EmptyState title="No network shipments found" />;
  }

  return (
    <div className="grid gap-3">
      {packages.map((pkg) => (
        <SurfacePanel key={pkg._id} className="motion-card">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
            <div className="grid gap-3 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-[color:var(--text)]">{pkg.packageId || 'Legacy record'}</p>
                <StatusBadge status={pkg.status} />
                <GhostChip>{pkg.deliveryType || 'store'}</GhostChip>
                <GhostChip>{pkg.ownerUsername || 'Unassigned'}</GhostChip>
              </div>

              <p className="text-sm leading-6 text-[color:var(--muted)]">{pkg.description}</p>

              <RouteProgressStrip
                pickup={pkg.pickupLocation || 'Origin'}
                truckId={pkg.truckId || 'Truck pending'}
                dropoff={pkg.dropoffLocation || 'Destination'}
                status={pkg.status}
              />

              <div className="grid gap-2 text-sm text-[color:var(--muted)] sm:grid-cols-2 xl:grid-cols-4">
                <p>Truck: {pkg.truckId || '—'}</p>
                <p>Quantity: {pkg.amount ?? '—'}</p>
                <p>Pickup: {pkg.pickupLocation || '—'}</p>
                <p>Last scan: {formatTimestamp(pkg.updatedAt || pkg.createdAt)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-start gap-3 xl:flex-col xl:items-stretch">
              <SecondaryButton type="button" onClick={() => onEdit(pkg)}>Edit</SecondaryButton>
              <SecondaryButton type="button" tone="danger" onClick={() => onDelete(pkg._id)}>Remove</SecondaryButton>
            </div>
          </div>
        </SurfacePanel>
      ))}
    </div>
  );
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
  const filterOptions = useMemo(
    () => [{ value: 'all', label: 'All loads', count: searchScopedPackages.length }, ...statusCounts.filter((item) => item.count > 0).map((item) => ({ value: item.status, label: item.label, count: item.count }))],
    [searchScopedPackages.length, statusCounts],
  );
  const hasActiveFilters = search.trim().length > 0 || statusFilter !== 'all';
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
    <AppShell
      headerActions={<SecondaryButton type="button" onClick={handleLogout}>Log Out</SecondaryButton>}
      headerClassName="dashboard-header"
    >
      <PageFrame className="dashboard-frame">
        <div ref={scope} className="space-y-6 sm:space-y-8">
          <div className="motion-hero grid gap-5">
            <PageTitle
              kicker="Admin Dashboard"
              title="Dispatch Control"
              action={(
                <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                  <GhostChip>{liveLoadCount} live loads</GhostChip>
                  <GhostChip>{exceptionLoadCount} exceptions</GhostChip>
                  <GhostChip>{driverSummaries.length} active drivers</GhostChip>
                </div>
              )}
            />

            <AIAssistant
              className="dashboard-ai-assistant ai-top-panel p-5 sm:p-6"
              title="Ask RoutePulse"
              suggestions={ADMIN_AI_SUGGESTIONS}
              perspective="admin"
            />
          </div>

          {error ? <Alert tone="error">{error}</Alert> : null}

          <div className="dashboard-main-grid">
            <div className="dashboard-stack">
              <GlassCard className="motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-ledger">
                <SectionHeading
                  kicker="Ledger"
                  title="All Shipments"
                  description="Searchable record of the current network."
                  action={<GhostChip>{filteredPackages.length} visible</GhostChip>}
                />

                <div className="mt-5">
                  <SurfacePanel className="motion-card">
                    <div className="grid gap-4">
                      <SearchInput
                        name="shipment_search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        onClear={() => setSearch('')}
                        placeholder="Search package, truck, location, or driver…"
                      />

                      <div className="search-results-action search-results-action-inline">
                        <GhostChip>{filteredPackages.length} match{filteredPackages.length === 1 ? '' : 'es'}</GhostChip>
                        {hasActiveFilters ? (
                          <SecondaryButton type="button" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
                            Reset
                          </SecondaryButton>
                        ) : null}
                      </div>

                      <div className="search-filter-group">
                        <p className="search-filter-label">Filter Status</p>
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
                  </SurfacePanel>
                </div>

                <div className="mt-5 dashboard-scroll-region dashboard-scroll-region-ledger dashboard-scroll-fill">
                  <AdminShipmentLedger
                    packages={filteredPackages}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              </GlassCard>

              <GlassCard className="hero-panel motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-primary">
                <SectionHeading
                  title="Driver Board"
                  description="Track drivers, loads, and open issues."
                  action={<GhostChip>{filteredDrivers.length || driverSummaries.length} assigned</GhostChip>}
                />

                <div className="mt-5 grid gap-4 dashboard-scroll-region dashboard-scroll-region-primary">
                  <InsightMetricStrip items={overviewMetrics} dense />

                  <AdminAssignmentRoster drivers={filteredDrivers.length ? filteredDrivers : driverSummaries} />
                </div>
              </GlassCard>
            </div>

            <div className="dashboard-stack">
              <GlassCard className="motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-primary">
                  <SectionHeading
                    kicker={editingId ? 'Edit Shipment' : 'New Shipment'}
                    title={editingId ? 'Update Dispatch' : 'Create Dispatch'}
                    description="Assign a load without leaving the board."
                  />

                <form id="shipment-form" className="mt-5 space-y-4 pb-4" onSubmit={handleSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Driver username">
                      <TextInput
                        name="owner_username"
                        type="text"
                        value={formData.ownerUsername}
                        onChange={updateField('ownerUsername')}
                        list="registered-driver-usernames"
                        placeholder="driver-one"
                        required
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <datalist id="registered-driver-usernames">
                        {registeredDrivers.map((driver) => (
                          <option key={driver.id} value={driver.username} />
                        ))}
                      </datalist>
                    </Field>

                    <Field label="Package ID">
                      <TextInput
                        name="package_id"
                        type="text"
                        value={formData.packageId}
                        onChange={updateField('packageId')}
                        placeholder="PKG-2048"
                        required
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </Field>
                  </div>

                  <Field label="Description">
                    <TextInput
                      name="description"
                      type="text"
                      value={formData.description}
                      onChange={updateField('description')}
                      placeholder="Medical supplies, home goods, retail stock…"
                      required
                      autoComplete="off"
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Quantity">
                      <TextInput name="amount" type="number" min="0" step="1" value={formData.amount} onChange={updateField('amount')} required />
                    </Field>

                    <Field label="Truck ID">
                      <TextInput name="truck_id" type="text" value={formData.truckId} onChange={updateField('truckId')} placeholder="TRK-21" required autoComplete="off" spellCheck={false} />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Pickup location">
                      <TextInput name="pickup_location" type="text" value={formData.pickupLocation} onChange={updateField('pickupLocation')} placeholder="Warehouse A" required autoComplete="off" />
                    </Field>

                    <Field label="Drop-off location">
                      <TextInput name="dropoff_location" type="text" value={formData.dropoffLocation} onChange={updateField('dropoffLocation')} placeholder="Target downtown" required autoComplete="off" />
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
                      {editingId ? 'Save Shipment' : 'Create Shipment'}
                    </PrimaryButton>
                    {editingId ? <SecondaryButton type="button" onClick={resetForm}>Cancel Edit</SecondaryButton> : null}
                  </div>
                </form>

              </GlassCard>

              <GlassCard className="motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-ledger">
                <div className="dashboard-scroll-region dashboard-scroll-region-flow dashboard-scroll-fill">
                  <LogisticsFlowBoard
                    className="admin-transit-pane"
                    title="Live Routes"
                    description="Current movement across active drivers."
                    lanes={adminFlowLanes}
                    summary={flowSummary}
                    emptyTitle="No active routes"
                    emptyDescription=""
                  />
                </div>
              </GlassCard>
            </div>
          </div>

          <div className="dashboard-insight-grid">
            <GlassCard className="motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-insight">
              <div className="dashboard-scroll-region dashboard-scroll-region-insight dashboard-scroll-fill">
                <ExceptionRadar
                  title="Exceptions"
                  items={networkIntelligence?.exceptionBoard || []}
                  emptyTitle="No critical exceptions"
                  emptyDescription=""
                />
              </div>
            </GlassCard>

            <GlassCard className="motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-insight">
                <div className="dashboard-scroll-region dashboard-scroll-region-insight dashboard-scroll-fill">
                <SectionHeading
                  kicker="Network Watch"
                  title="Routes & Facilities"
                  description="Fast scan of pressure points in the network."
                />

                <div className="mt-5 grid gap-5">
                  <WatchGrid
                    title="Route Watch"
                    items={networkIntelligence?.routePressure || []}
                    metricLabel="active"
                    valueKey="activeShipments"
                  />
                  <WatchGrid
                    title="Facility Watch"
                    items={networkIntelligence?.facilityWatch || []}
                    metricLabel="flagged"
                    valueKey="exceptions"
                  />
                </div>
                </div>
              </GlassCard>

              <GlassCard className="motion-section p-5 sm:p-6 flex flex-col dashboard-panel-fixed-insight">
                <SectionHeading
                  kicker="Activity"
                  title="Recent Scans"
                  action={<GhostChip>{recentHandlingEvents.length} latest</GhostChip>}
                />

                <div className="mt-5 dashboard-scroll-region dashboard-scroll-region-insight dashboard-scroll-fill">
                {recentHandlingEvents.length === 0 ? (
                  <div>
                    <EmptyState title="No recent scanner events" />
                  </div>
                ) : (
                  <div className="event-list">
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
                        <div className="flex flex-col items-end gap-2">
                          <GhostChip>{event.eventType}</GhostChip>
                          <span className="text-xs font-medium text-[color:var(--muted)]">{formatTimestamp(event.happenedAt || event.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </div>
            </GlassCard>
          </div>
        </div>
      </PageFrame>
    </AppShell>
  );
}

export default AdminDashboard;
