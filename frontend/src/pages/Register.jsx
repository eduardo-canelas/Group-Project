import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, AppShell, Field, GlassCard, PageFrame, PrimaryButton, SectionHeading, SelectInput, SecondaryButton, TextInput } from '../components/ui';
import { usePageMotion } from '../components/motion';
import api from '../lib/api';
import heroArt from '../assets/hero.png';

const roles = [
  { value: 'driver', label: 'Driver' },
  { value: 'admin', label: 'Admin' },
];

const onboardingSignals = [
  { label: 'Admin', value: 'Command view' },
  { label: 'Driver', value: 'Mobile flow' },
  { label: 'AI', value: 'Briefing assist' },
];

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const scope = usePageMotion();

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await api.post('/auth/register', { username, password, role });
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <AppShell>
      <PageFrame className="py-6 lg:py-10">
        <div ref={scope} className="grid gap-6 lg:min-h-[calc(100vh-8rem)] lg:grid-cols-[0.92fr_1.08fr]">
          <GlassCard className="motion-hero flex items-center p-6 sm:p-8 lg:p-10">
            <div className="w-full">
              <SectionHeading
                as="h1"
                kicker="Workspace onboarding"
                title="Create access and get moving fast."
                description="Pick a role, create the account, and step straight into the right workflow."
              />

              <div className="mt-6 auth-chip-band motion-card">
                {onboardingSignals.map((item) => (
                  <span key={item.label} className="auth-chip-band-item">
                    {item.label}: {item.value}
                  </span>
                ))}
              </div>

              {error ? <Alert tone="error">{error}</Alert> : null}

              <form className="mt-8 space-y-5" onSubmit={handleRegister}>
                <Field label="Username">
                  <TextInput
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="fleet-coordinator"
                    autoComplete="username"
                    required
                  />
                </Field>

                <Field label="Password">
                  <TextInput
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    required
                  />
                </Field>

                <Field label="Role">
                  <SelectInput value={role} onChange={(event) => setRole(event.target.value)}>
                    {roles.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>

                <PrimaryButton type="submit" className="w-full">
                  Create account
                </PrimaryButton>
              </form>

              <div className="mt-6 border-t border-[color:var(--border)] pt-6">
                <Link to="/">
                  <SecondaryButton type="button">Return to sign in</SecondaryButton>
                </Link>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="hero-panel motion-hero p-7 sm:p-9 lg:p-12">
            <div className="space-y-6">
              <SectionHeading
                kicker="What opens up"
                title="One product, three clean views."
                description="The experience stays light on words and heavy on signals, motion, and clarity."
              />

              <div className="auth-visual-grid">
                <div className="auth-visual-stage motion-card auth-visual-stage-register">
                  <div aria-hidden="true" className="auth-visual-scan" />
                  <div aria-hidden="true" className="auth-visual-node auth-visual-node-a" />
                  <div aria-hidden="true" className="auth-visual-node auth-visual-node-b" />
                  <div aria-hidden="true" className="auth-visual-node auth-visual-node-c" />
                  <div aria-hidden="true" className="auth-visual-node auth-visual-node-d" />
                  <div aria-hidden="true" className="auth-visual-link auth-visual-link-a" />
                  <div aria-hidden="true" className="auth-visual-link auth-visual-link-b" />
                  <div aria-hidden="true" className="auth-visual-link auth-visual-link-c" />
                  <img
                    src={heroArt}
                    alt=""
                    aria-hidden="true"
                    className="auth-stage-art motion-float"
                  />
                </div>

                <div className="auth-signal-stack">
                  <div className="auth-signal-card motion-card">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[color:var(--muted-strong)]">Admin view</p>
                    <p className="mt-3 text-xl font-semibold text-[color:var(--text)]">Routing, risk, AI</p>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">Built for oversight and quick recovery decisions.</p>
                  </div>
                  <div className="auth-signal-card motion-card">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[color:var(--muted-strong)]">Driver view</p>
                    <p className="mt-3 text-xl font-semibold text-[color:var(--text)]">Fast mobile actions</p>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">Status changes stay clean, quick, and tap-friendly.</p>
                  </div>
                  <div className="auth-signal-card motion-card">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[color:var(--muted-strong)]">Recruiter view</p>
                    <p className="mt-3 text-xl font-semibold text-[color:var(--text)]">Stronger product signal</p>
                    <p className="mt-2 text-sm text-[color:var(--muted)]">More visual proof, less explaining.</p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </PageFrame>
    </AppShell>
  );
}

export default Register;
