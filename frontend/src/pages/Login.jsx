import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, AppShell, Field, PageFrame, PrimaryButton, TextInput } from '../components/ui';
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
    <AppShell className="auth-resend-shell">
      <PageFrame className="auth-resend-frame">
        <main ref={scope} className="auth-resend-grid auth-resend-grid-login">
          <div className="auth-resend-visual login-video-panel motion-hero">
            <SeamlessVideo />
          </div>

          <div className="auth-form-side motion-hero">
            <div className="auth-form-inner">
              <p className="auth-wordmark">RoutePulse</p>

              <div className="auth-form-heading">
                <h1>Sign in</h1>
                <p>Admin and driver workspace.</p>
              </div>

              {error ? <Alert tone="error">{error}</Alert> : null}

              <form className="auth-form-fields" onSubmit={handleLogin}>
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

              <p className="auth-switch-link">
                No account? <Link to="/register">Create one</Link>
              </p>
            </div>
          </div>
        </main>
      </PageFrame>
    </AppShell>
  );
}

export default Login;
