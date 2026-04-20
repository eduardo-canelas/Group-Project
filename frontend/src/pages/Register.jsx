import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, AppShell, Field, GlassCard, PageFrame, PrimaryButton, SectionHeading, SelectInput, SecondaryButton, TextInput } from '../components/ui';
import { usePageMotion } from '../components/motion';
import { SeamlessVideo } from '../components/video-device';
import api from '../lib/api';

const roles = [
  { value: 'driver', label: 'Driver' },
  { value: 'admin', label: 'Admin' },
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
              />

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

          <div className="login-video-panel order-1 surface-card motion-hero">
            <SeamlessVideo lightSrc="/register-light.mp4" darkSrc="/register-dark.mp4" />
          </div>
        </div>
      </PageFrame>
    </AppShell>
  );
}

export default Register;
