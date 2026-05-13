import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, AppShell, Field, PageFrame, PrimaryButton, SelectInput, TextInput } from '../components/ui';
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
    <AppShell className="auth-resend-shell">
      <PageFrame className="auth-resend-frame">
        <main ref={scope} className="auth-resend-grid auth-resend-grid-register">
          <div className="auth-form-side motion-hero">
            <div className="auth-form-inner">
              <p className="auth-wordmark">RoutePulse</p>

              <div className="auth-form-heading">
                <h1>Create access</h1>
                <p>Choose the workspace role for this user.</p>
              </div>

              {error ? <Alert tone="error">{error}</Alert> : null}

              <form className="auth-form-fields" onSubmit={handleRegister}>
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
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </SelectInput>
                </Field>
                <PrimaryButton type="submit" className="w-full">Create account</PrimaryButton>
              </form>

              <p className="auth-switch-link">
                Already have access? <Link to="/">Sign in</Link>
              </p>
            </div>
          </div>

          <div className="auth-resend-visual login-video-panel motion-hero">
            <SeamlessVideo lightSrc="/register-light.mp4" darkSrc="/register-dark.mp4" />
          </div>
        </main>
      </PageFrame>
    </AppShell>
  );
}

export default Register;
