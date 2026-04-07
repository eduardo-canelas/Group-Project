import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Alert,
  AppShell,
  Field,
  GlassCard,
  PageFrame,
  PrimaryButton,
  SectionKicker,
  TextInput,
} from '../components/ui';
import api from '../lib/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });

      localStorage.setItem('user', JSON.stringify(response.data));
      navigate(response.data.role === 'admin' ? '/admin' : '/driver');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <AppShell>
      <PageFrame className="py-4 sm:py-6 lg:py-8">
        <div className="grid min-h-[calc(100vh-2rem)] gap-6 lg:grid-cols-1">
          <section className="flex items-center justify-center py-8 lg:py-14">
            <GlassCard className={`w-full max-w-md p-6 sm:p-8`}>
              <div className="pt-6">
                <div>
                  <h1 className="mt-3 text-3xl font-bold">Packet Tracker</h1>
                  <SectionKicker>Sign in</SectionKicker>
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

                <PrimaryButton type="submit" className="w-full">
                  Enter Workspace
                </PrimaryButton>
              </form>

              <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5 text-sm">
                <p className="text-slate-300">Need an account?</p>
                <Link to="/register" className={`font-semibold transition text-amber-300 hover:text-amber-200`}>
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