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
  SectionKicker,
  SelectInput,
  TextInput,
} from '../components/ui';

const roleCards = [
  {
    role: 'driver',
    title: 'Driver account',
    text: 'Use this role for packet updates, pickup confirmation, and delivery updates.',
  },
  {
    role: 'admin',
    title: 'Admin account',
    text: 'Use this role for packet logging, packet assignment, and packet removal across the full shipment board.',
  },
];

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        username,
        password,
        role,
      });

      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <PageFrame className="py-4 sm:py-6 lg:py-8">
        <div className="grid min-h-[calc(100vh-2rem)] gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="order-2 flex items-center justify-center py-8 lg:order-1 lg:py-14">
            <GlassCard className="w-full max-w-md p-6 sm:p-8">
              <SectionKicker>Create account</SectionKicker>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">Register a new user</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Create the login first, then send the person to the workspace that matches their role.
              </p>

              {error ? <Alert tone="error">{error}</Alert> : null}

              <form className="mt-6 space-y-5" onSubmit={handleRegister}>
                <Field label="Username" hint="Pick a unique handle for this operator.">
                  <TextInput
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    autoComplete="username"
                    required
                  />
                </Field>
                <Field label="Password">
                  <TextInput
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    required
                  />
                </Field>
                <Field label="Role">
                  <SelectInput value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="driver">Driver</option>
                    <option value="admin">Admin</option>
                  </SelectInput>
                </Field>

                <PrimaryButton type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create user'}
                </PrimaryButton>
              </form>

              <div className="mt-6 border-t border-white/10 pt-5 text-sm">
                <p className="text-slate-300">
                  Already registered?{' '}
                  <Link to="/" className="font-semibold text-amber-300 transition hover:text-amber-200">
                    Return to sign in
                  </Link>
                </p>
              </div>
            </GlassCard>
          </section>

          <section className="order-1 flex items-center lg:order-2">
            <div className="max-w-2xl py-8 lg:py-14">
              <SectionKicker>Packet Tracker</SectionKicker>
              <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                One board, two roles, clear ownership.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                Registration decides who can manage the queue and who can move it forward.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {roleCards.map((card) => (
                  <GlassCard key={card.role} className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300/80">{card.title}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-200">{card.text}</p>
                  </GlassCard>
                ))}
              </div>

              <GlassCard className="mt-8 p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">How the workflow stays clear</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-sm font-semibold text-slate-100">Dispatch stays organized</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">Admins can log new packets and keep the board accurate before drivers head out.</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-sm font-semibold text-slate-100">Drivers see what matters</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">The route screen focuses on status updates so progress can be recorded stop by stop.</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-sm font-semibold text-slate-100">One live shipment list</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">Both roles work from the same records, which keeps handoffs consistent from intake to delivery.</p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </section>
        </div>
      </PageFrame>
    </AppShell>
  );
}

export default Register;
