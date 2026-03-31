import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  AppShell,
  Field,
  GlassCard,
  PageFrame,
  PrimaryButton,
  SecondaryButton,
  SectionKicker,
  TextInput,
} from '../components/ui';

const highlights = [
  {
    title: 'Dispatch desk',
    text: 'Managers can log inbound packets, review the live board, and remove old packets when the day is done.',
  },
  {
    title: 'Route updates',
    text: 'Drivers move each packet from pickup to final drop with one status control.',
  },
  {
    title: 'Role-aware access',
    text: 'Every sign-in opens the workspace that matches the account on file.',
  },
];

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('admin');
  const navigate = useNavigate();

  const roleConfig = {
    admin: {
      pickerLabel: 'Administrator',
      pickerClass: 'border-amber-200 bg-amber-300 text-slate-950 shadow-lg shadow-amber-300/20 hover:bg-amber-300',
      cardClass: 'border-amber-300/16',
      dividerClass: 'border-amber-300/16',
      linkClass: 'text-amber-300 hover:text-amber-200',
      summary: 'Administrator mode is built for packet intake, queue review, and shipment cleanup.',
      signInTitle: 'Admin panel',
      signInBody: 'Sign in to create packet records, review shipment status, and manage the shared board.',
      submitLabel: 'Enter admin workspace',
    },
    driver: {
      pickerLabel: 'Driver',
      pickerClass: 'border-cyan-200 bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/20 hover:bg-cyan-300',
      cardClass: 'border-cyan-300/16',
      dividerClass: 'border-cyan-300/16',
      linkClass: 'text-cyan-300 hover:text-cyan-200',
      summary: 'Driver mode is focused on pickups, route progress, and final delivery updates.',
      signInTitle: 'Driver panel',
      signInBody: 'Sign in to view assigned packets, update stop progress, and mark deliveries complete.',
      submitLabel: 'Enter driver workspace',
    },
  };
  const activeRole = roleConfig[selectedRole];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password,
      });

      localStorage.setItem('user', JSON.stringify(response.data));
      navigate(response.data.role === 'admin' ? '/admin' : '/driver');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <PageFrame className="py-4 sm:py-6 lg:py-8">
        <div className="grid min-h-[calc(100vh-2rem)] gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="flex items-center">
            <div className="max-w-2xl py-8 lg:py-14">
              <SectionKicker>Packet Tracker</SectionKicker>
              <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                Built for the best delivery experience.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                Packet Tracker keeps the workflow simple: log a packet, assign the next move, and see all updates in real time.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <GlassCard className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">Intake</p>
                  <p className="mt-3 text-sm leading-6 text-slate-200">Log incoming packets with a description and weight in seconds.</p>
                </GlassCard>
                <GlassCard className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300/80">Handoff</p>
                  <p className="mt-3 text-sm leading-6 text-slate-200">Admins and drivers share the same data.</p>
                </GlassCard>
                <GlassCard className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300/80">Traceability</p>
                  <p className="mt-3 text-sm leading-6 text-slate-200">Each record stays visible from pending to delivered.</p>
                </GlassCard>
              </div>

              <GlassCard className="mt-8 p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">At a glance</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {highlights.map((item) => (
                    <div key={item.title} className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{item.text}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </section>

          <section className="flex items-center justify-center py-8 lg:py-14">
            <GlassCard className={`w-full max-w-md p-6 sm:p-8 ${activeRole.cardClass}`}>
              <div>
                <SectionKicker>Choose role</SectionKicker>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">Start in the right workspace</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">Pick the view that matches your job before signing in.</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <SecondaryButton
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`flex-1 ${selectedRole === 'admin' ? roleConfig.admin.pickerClass : ''}`}
                >
                  {roleConfig.admin.pickerLabel}
                </SecondaryButton>
                <SecondaryButton
                  type="button"
                  onClick={() => setSelectedRole('driver')}
                  className={`flex-1 ${selectedRole === 'driver' ? roleConfig.driver.pickerClass : ''}`}
                >
                  {roleConfig.driver.pickerLabel}
                </SecondaryButton>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">
                {activeRole.summary}
              </p>

              <div className={`mt-8 border-t ${activeRole.dividerClass}`} />

              <div className="pt-6">
                <div>
                  <SectionKicker>Sign in</SectionKicker>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">{activeRole.signInTitle}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{activeRole.signInBody}</p>
                </div>
              </div>

              {error ? <Alert tone="error">{error}</Alert> : null}

              <form className="mt-6 space-y-5" onSubmit={handleLogin}>
                <Field label="Username">
                  <TextInput
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    autoComplete="username"
                    required
                  />
                </Field>
                <Field label="Password">
                  <TextInput
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    required
                  />
                </Field>

                <PrimaryButton type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : activeRole.submitLabel}
                </PrimaryButton>
              </form>

              <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-sm">
                <p className="text-slate-300">Need an account?</p>
                <Link to="/register" className={`font-semibold transition ${activeRole.linkClass}`}>
                  Register here
                </Link>
              </div>
            </GlassCard>
          </section>
        </div>
      </PageFrame>
    </AppShell>
  );
}

export default Login;
