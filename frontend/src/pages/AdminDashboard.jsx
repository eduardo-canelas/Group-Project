import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
  StatCard,
  StatusBadge,
  TextInput,
} from '../components/ui';

function AdminDashboard() {
  const [packages, setPackages] = useState([]);
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const fetchPackages = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/packages');
      setPackages(response.data);
    } catch {
      setError('Could not fetch packages.');
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleAddPackage = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('http://localhost:5000/api/packages', {
        description,
        weight,
      });
      setDescription('');
      setWeight('');
      fetchPackages();
    } catch {
      setError('Could not add package.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setError('');
    try {
      await axios.delete(`http://localhost:5000/api/packages/${id}`);
      fetchPackages();
    } catch {
      setError('Could not delete package.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const totals = {
    total: packages.length,
    pending: packages.filter((pkg) => pkg.status === 'pending').length,
    active: packages.filter((pkg) => pkg.status === 'picked_up' || pkg.status === 'in_transit').length,
    delivered: packages.filter((pkg) => pkg.status === 'delivered').length,
  };

  return (
    <AppShell>
      <PageFrame>
        <div className="space-y-6">
          <PageTitle
            title="Dispatch overview"
            subtitle={`Welcome back${user?.username ? `, ${user.username}` : ''}. Log new packages, review what is moving, and keep the shipment board current.`}
            action={
              <SecondaryButton type="button" onClick={handleLogout}>
                Log out
              </SecondaryButton>
            }
          />

          {error ? <Alert tone="error">{error}</Alert> : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="All shipments" value={totals.total} hint="Every record currently on the board." accent="amber" />
            <StatCard label="Awaiting pickup" value={totals.pending} hint="Ready to be claimed by a driver." accent="sky" />
            <StatCard label="On the road" value={totals.active} hint="Already picked up or currently in transit." accent="violet" />
            <StatCard label="Closed out" value={totals.delivered} hint="Stops that have reached delivered." accent="emerald" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
            <GlassCard className="p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">New shipment</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">Add an item to the board</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Enter the shipment details below to create a fresh package record.
              </p>

              <form id="package-form" className="mt-6 space-y-5" onSubmit={handleAddPackage}>
                <Field label="Description" hint="Use the name staff will recognize on pickup.">
                  <TextInput
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Example: Downtown document pouch"
                    required
                  />
                </Field>

                <Field label="Weight" hint="Numbers only, with decimals if needed.">
                  <TextInput
                    type="number"
                    min="0"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Example: 12.5"
                    required
                  />
                </Field>

                <PrimaryButton type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Saving shipment...' : 'Save shipment'}
                </PrimaryButton>
              </form>
            </GlassCard>

            <GlassCard className="overflow-hidden">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Live board</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Current shipments</h2>
                </div>
                <p className="text-sm text-slate-300">{packages.length} active records</p>
              </div>

              {packages.length === 0 ? (
                <div className="p-6 sm:p-7">
                  <EmptyState
                    title="The board is empty"
                    description="Add the first shipment to start the day's queue."
                    action={
                      <PrimaryButton
                        type="button"
                        onClick={() => document.getElementById('package-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                      >
                        Add first shipment
                      </PrimaryButton>
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-slate-950/40">
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                        <th className="px-6 py-4 sm:px-7">Record</th>
                        <th className="px-6 py-4 sm:px-7">Description</th>
                        <th className="px-6 py-4 sm:px-7">Status</th>
                        <th className="px-6 py-4 sm:px-7 text-right">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {packages.map((pkg) => (
                        <tr key={pkg._id} className="transition hover:bg-white/5">
                          <td className="max-w-[16rem] px-6 py-5 align-top text-sm text-slate-300 sm:px-7">
                            <span className="block truncate font-mono text-xs text-slate-400">{pkg._id}</span>
                          </td>
                          <td className="px-6 py-5 align-top sm:px-7">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-slate-50">{pkg.description}</p>
                              <p className="text-xs text-slate-400">Weight: {pkg.weight}</p>
                            </div>
                          </td>
                          <td className="px-6 py-5 align-top sm:px-7">
                            <StatusBadge status={pkg.status} />
                          </td>
                          <td className="px-6 py-5 text-right align-top sm:px-7">
                            <SecondaryButton type="button" onClick={() => handleDelete(pkg._id)}>
                              Remove
                            </SecondaryButton>
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
