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
  SelectInput,
  TextInput,
} from '../components/ui';
import api from '../lib/api';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/auth/register', {
        username,
        password,
        role,
      });

      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <AppShell>
      <PageFrame className="py-4 sm:py-6 lg:py-8">
        <div className="grid min-h-[calc(100vh-2rem)] gap-6 lg:grid-cols-1">
          <section className="order-2 flex items-center justify-center py-8 lg:order-1 lg:py-14">
            <GlassCard className="w-full max-w-md p-6 sm:p-8">
              <SectionKicker>Create account</SectionKicker>
              
              {error ? <Alert tone="error">{error}</Alert> : null}

              <form className="mt-6 space-y-5" onSubmit={handleRegister}>
                <Field label="Username">
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

                <PrimaryButton type="submit" className="w-full">
                  Create user
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

        </div>
      </PageFrame>
    </AppShell>
  );
}

export default Register;