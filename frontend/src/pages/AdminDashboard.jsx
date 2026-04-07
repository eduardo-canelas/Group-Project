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
  StatusBadge,
  TextInput,
} from '../components/ui';
import { clearStoredUser } from '../lib/auth';
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

function AdminDashboard() {
  const [packages, setPackages] = useState([]);
  const [dataModelSummary, setDataModelSummary] = useState(null);
  const [formData, setFormData] = useState(createPackageForm());
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

  const driverSummaries = buildDriverSummaries(packages);
  const registeredDrivers = dataModelSummary?.driverDirectory || [];

  return (
    <AppShell>
      <PageFrame>
        <div className="space-y-6">
          <PageTitle
            title="Admin Dashboard"
            action={(
              <SecondaryButton type="button" onClick={handleLogout}>
                Log out
              </SecondaryButton>
            )}
          />

          {error ? <Alert tone="error">{error}</Alert> : null}

          <GlassCard className="p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Driver assignments</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Drivers with trucks</h2>
              </div>
              <p className="text-sm text-slate-300">{driverSummaries.length} drivers</p>
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

          <GlassCard className="p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Registered drivers</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Driver accounts ready for assignment</h2>
              </div>
              <p className="text-sm text-slate-300">{registeredDrivers.length} drivers</p>
            </div>

            {registeredDrivers.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  title="No driver accounts yet"
                  description="Create driver accounts from the Register page. They will appear here for quick assignment."
                />
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap gap-2">
                {registeredDrivers.map((driver) => (
                  <span
                    key={driver.id}
                    className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-200"
                  >
                    {driver.username}
                  </span>
                ))}
              </div>
            )}
          </GlassCard>

          <div className="grid gap-6 xl:grid-cols-1">
            <GlassCard className="p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">
                {editingId ? 'Edit shipment' : 'New shipment'}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                {editingId ? 'Update the current record' : 'Add a shipment to a driver truck'}
              </h2>

              <form id="shipment-form" className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field
                    label="Driver username"
                  >
                    <TextInput
                      type="text"
                      value={formData.ownerUsername}
                      onChange={updateField('ownerUsername')}
                      list="registered-driver-usernames"
                      placeholder="Ex. driver1"
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
                      placeholder="Ex. 1122"
                      required
                    />
                  </Field>

                  <Field label="Item name">
                    <TextInput
                      type="text"
                      value={formData.description}
                      onChange={updateField('description')}
                      placeholder="Ex. Red solo cups"
                      required
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Quality">
                    <TextInput
                      type="number"
                      min="0"
                      step="1"
                      value={formData.amount}
                      onChange={updateField('amount')}
                      placeholder="Ex. 150"
                      required
                    />
                  </Field>

                  <Field label="Truck ID">
                    <TextInput
                      type="text"
                      value={formData.truckId}
                      onChange={updateField('truckId')}
                      placeholder="Ex. 254"
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
                      placeholder="Ex. Amazon Warehouse"
                      required
                    />
                  </Field>

                  <Field label="Drop off location">
                    <TextInput
                      type="text"
                      value={formData.dropoffLocation}
                      onChange={updateField('dropoffLocation')}
                      placeholder="Ex. Target"
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
                  <PrimaryButton type="submit" className="flex-1">
                    {editingId ? 'Update shipment' : 'Create shipment'}
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
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Shipment board</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">All shipment</h2>
                </div>
                <p className="text-sm text-slate-300">{packages.length} shipments</p>
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
                        <th className="px-6 py-4 sm:px-7">Package ID</th>
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