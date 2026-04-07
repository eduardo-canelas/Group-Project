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
  };

  return payload;
}

function DriverDashboard() {
  const [packages, setPackages] = useState([]);
  const [formData, setFormData] = useState(createPackageForm());
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const [loadingId, setLoadingId] = useState('');
  const navigate = useNavigate();

  const fetchPackages = async () => {
    try {
      const response = await api.get('/packages');
      setPackages(response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Could not fetch packages.');
    }
  };

  useEffect(() => {
    fetchPackages();
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
      await fetchPackages();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Could not save package.');
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
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Could not update status.');
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
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Could not delete package.');
    }
  };

  const handleLogout = () => {
    clearStoredUser();
    navigate('/');
  };

  return (
    <AppShell>
      <PageFrame>
        <div className="space-y-6">
          <PageTitle
            title="Driver Dashboard"
            action={(
              <SecondaryButton type="button" onClick={handleLogout}>
                Log out
              </SecondaryButton>
            )}
          />

          {error ? <Alert tone="error">{error}</Alert> : null}

          <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <GlassCard className="p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">
                {editingId ? 'Edit shipment' : 'Add shipment'}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                {editingId ? 'Update this shipment' : 'Create a shipment for your truck'}
              </h2>

              <form id="driver-shipment-form" className="mt-6 space-y-5" onSubmit={handleSubmit}>
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Quantity">
                    <TextInput
                      type="number"
                      min="0"
                      step="1"
                      value={formData.amount}
                      onChange={updateField('amount')}
                      placeholder="Ex. 25"
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
                    {editingId ? 'Update my record' : 'Create my record'}
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
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Assignments</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Truck shipments</h2>
                </div>
                <p className="text-sm text-slate-300">{packages.length} trucks assigned to you</p>
              </div>

              {packages.length === 0 ? (
                <div className="p-6 sm:p-7">
                  <EmptyState
                    title="No truck records yet"
                    description="Create a shipment from this page or ask an admin to assign one to your username."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-slate-950/40">
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        <th className="px-6 py-4 sm:px-7">Package ID</th>
                        <th className="px-6 py-4 sm:px-7">Item</th>
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
                            <p className="mt-1 text-xs text-slate-400">Truck {pkg.truckId || '—'}</p>
                          </td>
                          <td className="px-6 py-5 align-top sm:px-7">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-slate-50">{pkg.description}</p>
                              <p className="text-xs text-slate-400">
                                Amount: {pkg.amount} · Type: {pkg.deliveryType || 'store'}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-5 align-top text-sm text-slate-300 sm:px-7">
                            <p>{pkg.pickupLocation || 'Assigned truck'}</p>
                            <p className="mt-1 text-xs text-slate-400">to {pkg.dropoffLocation || '—'}</p>
                          </td>
                          <td className="px-6 py-5 align-top sm:px-7">
                            <div className="space-y-3">
                              <StatusBadge status={pkg.status} />
                              <SelectInput
                                value={pkg.status}
                                disabled={loadingId === pkg._id}
                                onChange={(e) => handleUpdateStatus(pkg._id, e.target.value)}
                              >
                                {statusOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </SelectInput>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right align-top sm:px-7">
                            <div className="flex justify-end gap-3">
                              <SecondaryButton type="button" onClick={() => handleEdit(pkg)}>
                                Edit
                              </SecondaryButton>
                              <SecondaryButton type="button" onClick={() => handleDelete(pkg._id)}>
                                Delete
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

export default DriverDashboard;