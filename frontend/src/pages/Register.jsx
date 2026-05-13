import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Field, SelectInput, TextInput } from '../components/ui';
import { ThemeToggle } from '../components/theme';
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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const scope = usePageMotion();

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', { username, password, role });
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={scope} className="auth-split auth-split--register">
      <div className="auth-split-panel auth-split-panel--left motion-hero">
        <div className="auth-split-top">
          <Link to="/" className="auth-split-logo">
            <img src="/routepulse-logo.png" alt="RoutePulse" className="auth-split-logo-img" />
          </Link>
          <ThemeToggle />
        </div>

        <div className="auth-split-body">
          <div className="auth-split-heading">
            <h1>Create account</h1>
            <p>Choose a username, password, and role for this workspace.</p>
          </div>

          {error ? <Alert tone="error">{error}</Alert> : null}

          <form className="auth-split-fields" onSubmit={handleRegister}>
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
            <button type="submit" className="auth-split-continue" disabled={loading}>
              {loading ? 'Creating account…' : <>Continue <span aria-hidden="true">→</span></>}
            </button>
          </form>
        </div>

        <p className="auth-split-foot">
          Already have access? <Link to="/">Sign in</Link>
        </p>
      </div>

      <div className="auth-split-visual motion-hero">
        <SeamlessVideo lightSrc="/register-light.mp4" darkSrc="/register-dark.mp4" />
      </div>
    </div>
  );
}

export default Register;
