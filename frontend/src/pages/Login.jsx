import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Field, TextInput } from '../components/ui';
import { ThemeToggle } from '../components/theme';
import { usePageMotion } from '../components/motion';
import { SeamlessVideo } from '../components/video-device';
import api from '../lib/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const scope = usePageMotion();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      localStorage.setItem('user', JSON.stringify(response.data));
      navigate(response.data.role === 'admin' ? '/admin' : '/driver');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={scope} className="auth-split">
      <div className="auth-split-visual motion-hero">
        <SeamlessVideo />
      </div>

      <div className="auth-split-panel motion-hero">
        <div className="auth-split-top">
          <Link to="/" className="auth-split-logo">
            <img src="/routepulse-logo.png" alt="RoutePulse" className="auth-split-logo-img" />
          </Link>
          <ThemeToggle />
        </div>

        <div className="auth-split-body">
          <div className="auth-split-heading">
            <h1>Sign in</h1>
            <p>Enter your credentials to access RoutePulse.</p>
          </div>

          {error ? <Alert tone="error">{error}</Alert> : null}

          <form className="auth-split-fields" onSubmit={handleLogin}>
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
            <button type="submit" className="auth-split-continue" disabled={loading}>
              {loading ? 'Signing in…' : <>Continue <span aria-hidden="true">→</span></>}
            </button>
          </form>
        </div>

        <p className="auth-split-foot">
          New to RoutePulse? <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
