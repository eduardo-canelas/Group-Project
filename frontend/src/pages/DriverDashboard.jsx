import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  AppShell,
  EmptyState,
  GlassCard,
  PageFrame,
  PageTitle,
  SecondaryButton,
  SelectInput,
  StatCard,
  StatusBadge,
} from '../components/ui';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'picked_up', label: 'Picked Up' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'delivered', label: 'Delivered' },
];

function DriverDashboard() {
  const [packages, setPackages] = useState([]);
  const [error, setError] = useState('');
  const [loadingId, setLoadingId] = useState('');
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

  const handleUpdateStatus = async (id, status) => {
    setError('');
    setLoadingId(id);

    try {
      await axios.put(`http://localhost:5000/api/packages/${id}`, {
        status,
      });
      fetchPackages();
    } catch {
      setError('Could not update status.');
    } finally {
      setLoadingId('');
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
            title="Route board"
            subtitle={`Welcome back${user?.username ? `, ${user.username}` : ''}. Move each shipment through pickup, transit, and final delivery as the route progresses.`}
            action={
              <SecondaryButton type="button" onClick={handleLogout}>
                Log out
              </SecondaryButton>
            }
          />

          {error ? <Alert tone="error">{error}</Alert> : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Visible today" value={totals.total} hint="Every shipment available in the route view." accent="sky" />
            <StatCard label="Ready now" value={totals.pending} hint="Still waiting to be picked up." accent="amber" />
            <StatCard label="In motion" value={totals.active} hint="Already on the truck or on route." accent="violet" />
            <StatCard label="Completed" value={totals.delivered} hint="Stops closed out as delivered." accent="emerald" />
          </div>

          <GlassCard className="overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5 sm:px-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Route queue</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Packages in motion</h2>
              </div>
              <p className="text-sm text-slate-300">{packages.length} visible shipments</p>
            </div>

            {packages.length === 0 ? (
              <div className="p-6 sm:p-7">
                <EmptyState
                  title="No shipments are visible yet"
                  description="New records will appear here as soon as dispatch adds them to the board."
                  action={
                    <SecondaryButton type="button" onClick={fetchPackages}>
                      Refresh list
                    </SecondaryButton>
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
                      <th className="px-6 py-4 sm:px-7">Weight</th>
                      <th className="px-6 py-4 sm:px-7">Status</th>
                      <th className="px-6 py-4 sm:px-7">Next step</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {packages.map((pkg) => (
                      <tr key={pkg._id} className="transition hover:bg-white/5">
                        <td className="max-w-[16rem] px-6 py-5 align-top text-sm text-slate-300 sm:px-7">
                          <span className="block truncate font-mono text-xs text-slate-400">{pkg._id}</span>
                        </td>
                        <td className="px-6 py-5 align-top">
                          <p className="text-sm font-medium text-slate-50">{pkg.description}</p>
                        </td>
                        <td className="px-6 py-5 align-top text-sm text-slate-300">{pkg.weight}</td>
                        <td className="px-6 py-5 align-top">
                          <StatusBadge status={pkg.status} />
                        </td>
                        <td className="px-6 py-5 align-top">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>
      </PageFrame>
    </AppShell>
  );
}

export default DriverDashboard;
