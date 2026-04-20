import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, AppShell, Field, GlassCard, PageFrame, PrimaryButton, SecondaryButton, SectionHeading, TextInput } from '../components/ui';
import { usePageMotion } from '../components/motion';
import { SeamlessVideo } from '../components/video-device';
import api from '../lib/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const scope = usePageMotion();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', { username, password });
      localStorage.setItem('user', JSON.stringify(response.data));
      navigate(response.data.role === 'admin' ? '/admin' : '/driver');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <AppShell>
      <PageFrame className="py-6 lg:py-10">
        <div ref={scope} className="grid gap-6 lg:min-h-[calc(100vh-8rem)] lg:grid-cols-[1.22fr_0.78fr]">
          <div className="login-video-panel order-1 surface-card motion-hero">
            <SeamlessVideo />
          </div>

          <GlassCard className="order-2 motion-hero flex items-center p-6 sm:p-8 lg:p-10">
            <div className="w-full">
              <div className="mb-6">
                <SectionHeading
                  as="h1"
                  kicker="Secure entry"
                  title="Enter RoutePulse"
                />
              </div>

              {error ? <Alert tone="error">{error}</Alert> : null}

              <form className="mt-7 space-y-5" onSubmit={handleLogin}>
                <Field label="Username">
                  <TextInput
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="dispatcher-main"
                    autoComplete="username"
                    required
                  />
                </Field>
                <Field label="Password">
                  <TextInput
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    autoComplete="current-password"
                    required
                  />
                </Field>
                <PrimaryButton type="submit" className="w-full">Enter workspace</PrimaryButton>
              </form>

              <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-[color:var(--border)] pt-6">
                <Link to="/register">
                  <SecondaryButton type="button">Create account</SecondaryButton>
                </Link>
              </div>
            </div>
          </GlassCard>

        </div>
      </PageFrame>
    </AppShell>
  );
}

export default Login;
