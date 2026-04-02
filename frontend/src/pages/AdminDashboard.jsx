import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  AppShell,
  EmptyState,
  Field,
  GlassCard,
  PageFrame,
  PageTitle,
  PrimaryButton,
  SecondaryButton,
  SelectInput,
  StatCard,
  StatusBadge,
  TextInput,
} from '../components/ui';
import { clearStoredUser, getStoredUser } from '../lib/auth';
import api from '../lib/api';
import {
  createPackageForm,
  deliveryTypeOptions,
  mapPackageToForm,
  statusOptions,
} from '../lib/packageFields';

function buildPayload(formData) {
  const payload = {
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

  if (formData.weight !== '') {
    payload.weight = formData.weight;
  }

  return payload;
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

const entityCopy = {
  users: {
    label: 'Users',
    description: 'Authenticated operators with role-based access.',
  },
  packages: {
    label: 'Packages',
    description: 'Tracked shipment records currently on the board.',
  },
  facilities: {
    label: 'Facilities',
    description: 'Pickup, destination, and transit locations in the network.',
  },
  routes: {
    label: 'Routes',
    description: 'Origin-to-destination paths assigned to package movement.',
  },
  handlingEvents: {
    label: 'Tracking Records',
    description: 'Operational history showing package movement, facility touchpoints, and user actions.',
  },
};

function formatEventType(eventType) {
  const labels = {
    assigned: 'assignment update',
    received: 'receipt scan',
    loaded: 'load scan',
    unloaded: 'delivery or unload scan',
    inTransit: 'in-transit update',
  };

  return labels[eventType] || eventType;
}

function formatStatus(status) {
  if (!status) {
    return 'Unknown';
  }

  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function AdminDashboard() {
  const [packages, setPackages] = useState([]);
  const [dataModelSummary, setDataModelSummary] = useState(null);
  const [formData, setFormData] = useState(createPackageForm());
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = getStoredUser();

  const fetchPackages = async () => {
    try {
      const response = await api.get('/packages');
      setPackages(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Could not fetch packages.');
    }
  };

  const fetchDataModelSummary = async () => {
    try {
      const response = await api.get('/packages/summary');
      setDataModelSummary(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Could not fetch the data model summary.');
    }
  };

  const loadDashboardData = async () => {
    await Promise.all([fetchPackages(), fetchDataModelSummary()]);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const updateField = (field) => (e) => {
    setFormData((current) => ({
      ...current,
      [field]: e.target.value,
    }));
  };

  const resetForm = () => {
    setEditingId('');
    setFormData(createPackageForm());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Could not save package.');
    } finally {
      setLoading(false);
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
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Could not delete package.');
    }
  };

  const handleLogout = () => {
    clearStoredUser();
    navigate('/');
  };

  const totals = {
    total: packages.length,
    pending: packages.filter((pkg) => pkg.status === 'pending').length,
    active: packages.filter((pkg) => pkg.status === 'picked_up' || pkg.status === 'in_transit').length,
    delivered: packages.filter((pkg) => pkg.status === 'delivered').length,
  };
  const driverSummaries = buildDriverSummaries(packages);

  return (
    <AppShell>
      <PageFrame>
        <div className="space-y-6">
          <PageTitle
            title="Dispatch overview"
            subtitle={`Welcome back${user?.username ? `, ${user.username}` : ''}. Create, update, assign, and remove any shipment record across the full delivery board.`}
            action={(
              <SecondaryButton type="button" onClick={handleLogout}>
                Log out
              </SecondaryButton>
            )}
          />

          {error ? <Alert tone="error">{error}</Alert> : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="All shipments" value={totals.total} hint="Every record currently on the board." accent="amber" />
            <StatCard label="Awaiting pickup" value={totals.pending} hint="Ready to be claimed or loaded." accent="sky" />
            <StatCard label="On the road" value={totals.active} hint="Already picked up or in transit." accent="violet" />
            <StatCard label="Delivered" value={totals.delivered} hint="Stops that have been closed out." accent="emerald" />
          </div>

          <GlassCard className="p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Data model</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Operational data overview</h2>
              </div>
            </div>

            {dataModelSummary ? (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {Object.entries(dataModelSummary.entities).map(([entityName, count]) => (
                    <div key={entityName} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        {entityCopy[entityName]?.label || entityName}
                      </p>
                      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">{count}</p>
                      <p className="mt-2 text-sm text-slate-300">
                        {entityCopy[entityName]?.description || 'Active records stored for the shipment workflow.'}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">Relationship map</p>
                    <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">Package movement oversight</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      This view gives administrators a clear record of how shipments move across the facility network. Each
                      update captures where a package was processed, who recorded the action, and the status at that moment,
                      making oversight, exception handling, and audit review more reliable.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Recent activity</p>
                        <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Latest tracking updates</h3>
                      </div>
                      <p className="text-sm text-slate-300">{dataModelSummary.recentHandlingEvents.length} recent records</p>
                    </div>

                    <div className="mt-4 space-y-3">
                      {dataModelSummary.recentHandlingEvents.map((event) => (
                        <div key={event.id} className="rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-50">
                                {event.packageId} at {event.facilityName}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {event.username} recorded a {formatEventType(event.eventType)}. Current status: {formatStatus(event.statusSnapshot)}.
                              </p>
                            </div>
                            <p className="shrink-0 text-xs text-slate-400">
                              {new Date(event.happenedAt).toLocaleString()}
                            </p>
                          </div>
                          {event.notes ? <p className="mt-2 text-sm leading-6 text-slate-300">Audit note: {event.notes}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-300">
                The summary will populate after the first package lifecycle event is saved.
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Driver roster</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Active drivers and truck assignments</h2>
              </div>
              <p className="text-sm text-slate-300">{driverSummaries.length} active drivers</p>
            </div>

            {driverSummaries.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  title="No active drivers yet"
                  description="Assign at least one shipment to a driver username and the roster will appear here."
                />
              </div>
            ) : (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {driverSummaries.map((driver) => (
                  <div key={driver.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-50">{driver.username}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Truck{driver.truckIds.length === 1 ? '' : 's'}: {driver.truckIds.join(', ') || '—'}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                        {driver.packages.length} package{driver.packages.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {driver.packages.map((assignedPackage) => (
                        <div
                          key={assignedPackage.id}
                          className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-50">
                              {assignedPackage.packageId} · {assignedPackage.description}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">Truck {assignedPackage.truckId}</p>
                          </div>
                          <StatusBadge status={assignedPackage.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <GlassCard className="p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">
                {editingId ? 'Edit shipment' : 'New shipment'}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                {editingId ? 'Update the current record' : 'Add a shipment to a driver truck'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Use the driver username to control who owns the record. Drivers will only see and manage records assigned to them.
              </p>

              <form id="shipment-form" className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <Field label="Driver username" hint="This controls ownership for the driver-only view.">
                  <TextInput
                    type="text"
                    value={formData.ownerUsername}
                    onChange={updateField('ownerUsername')}
                    placeholder="Example: driver1"
                    required
                  />
                </Field>

                <Field label="Package ID" hint="Use the business package identifier from the project write-up.">
                  <TextInput
                    type="text"
                    value={formData.packageId}
                    onChange={updateField('packageId')}
                    placeholder="Example: 1122"
                    required
                  />
                </Field>

                <Field label="Item description" hint="What the driver should recognize on pickup.">
                  <TextInput
                    type="text"
                    value={formData.description}
                    onChange={updateField('description')}
                    placeholder="Example: Red solo cups"
                    required
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Amount" hint="Quantity in the load.">
                    <TextInput
                      type="number"
                      min="0"
                      step="1"
                      value={formData.amount}
                      onChange={updateField('amount')}
                      placeholder="150"
                      required
                    />
                  </Field>

                  <Field label="Truck ID" hint="Which truck currently owns the record.">
                    <TextInput
                      type="text"
                      value={formData.truckId}
                      onChange={updateField('truckId')}
                      placeholder="254"
                      required
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Pickup location">
                    <TextInput
                      type="text"
                      value={formData.pickupLocation}
                      onChange={updateField('pickupLocation')}
                      placeholder="Amazon House"
                      required
                    />
                  </Field>

                  <Field label="Drop off location">
                    <TextInput
                      type="text"
                      value={formData.dropoffLocation}
                      onChange={updateField('dropoffLocation')}
                      placeholder="Target"
                      required
                    />
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
                  <PrimaryButton type="submit" className="flex-1" disabled={loading}>
                    {loading ? 'Saving shipment...' : editingId ? 'Update shipment' : 'Create shipment'}
                  </PrimaryButton>
                  {editingId ? (
                    <SecondaryButton type="button" onClick={resetForm}>
                      Cancel edit
                    </SecondaryButton>
                  ) : null}
                </div>
              </form>
            </GlassCard>

            <GlassCard className="overflow-hidden">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Live board</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">All shipment records</h2>
                </div>
                <p className="text-sm text-slate-300">{packages.length} records</p>
              </div>

              {packages.length === 0 ? (
                <div className="p-6 sm:p-7">
                  <EmptyState
                    title="The shipment board is empty"
                    description="Create the first record and assign it to a driver to start the demonstration flow."
                    action={(
                      <PrimaryButton
                        type="button"
                        onClick={() => document.getElementById('shipment-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      >
                        Add first shipment
                      </PrimaryButton>
                    )}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-slate-950/40">
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        <th className="px-6 py-4 sm:px-7">Package</th>
                        <th className="px-6 py-4 sm:px-7">Item</th>
                        <th className="px-6 py-4 sm:px-7">Driver</th>
                        <th className="px-6 py-4 sm:px-7">Route</th>
                        <th className="px-6 py-4 sm:px-7">Status</th>
                        <th className="px-6 py-4 text-right sm:px-7">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {packages.map((pkg) => (
                        <tr key={pkg._id} className="transition hover:bg-white/5">
                          <td className="px-6 py-5 align-top sm:px-7">
                            <p className="text-sm font-medium text-slate-50">{pkg.packageId || 'Legacy record'}</p>
                            <p className="mt-1 font-mono text-xs text-slate-400">{pkg._id}</p>
                          </td>
                          <td className="px-6 py-5 align-top sm:px-7">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-slate-50">{pkg.description}</p>
                              <p className="text-xs text-slate-400">
                                Amount: {pkg.amount ?? pkg.weight ?? '—'} · Type: {pkg.deliveryType || 'store'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-5 align-top text-sm text-slate-300 sm:px-7">
                            <p>{pkg.ownerUsername || 'Unassigned'}</p>
                            <p className="mt-1 text-xs text-slate-400">Truck {pkg.truckId || '—'}</p>
                          </td>
                          <td className="px-6 py-5 align-top text-sm text-slate-300 sm:px-7">
                            <p>{pkg.pickupLocation || '—'}</p>
                            <p className="mt-1 text-xs text-slate-400">to {pkg.dropoffLocation || '—'}</p>
                          </td>
                          <td className="px-6 py-5 align-top sm:px-7">
                            <StatusBadge status={pkg.status} />
                          </td>
                          <td className="px-6 py-5 text-right align-top sm:px-7">
                            <div className="flex justify-end gap-3">
                              <SecondaryButton type="button" onClick={() => handleEdit(pkg)}>
                                Edit
                              </SecondaryButton>
                              <SecondaryButton type="button" onClick={() => handleDelete(pkg._id)}>
                                Remove
                              </SecondaryButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
