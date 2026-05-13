import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SeamlessVideo } from '../components/video-device';
import { ThemeToggle, useTheme } from '../components/theme';
import api from '../lib/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/login', { username, password });
      localStorage.setItem('user', JSON.stringify(response.data));
      navigate(response.data.role === 'admin' ? '/admin' : '/driver');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Login failed. Check your credentials.');
    }
  };

  return (
    <div className="lp-root">
      <div className="lp-media">
        <SeamlessVideo />
        <div className="lp-media-brand">
          <img src="/routepulse-logo.png" alt="RoutePulse" className="lp-media-logo" />
        </div>
      </div>

      <div className="lp-panel">
        <div className="lp-panel-inner">
          <header className="lp-panel-header">
            <img src="/routepulse-mark.png" alt="" className="lp-mark" aria-hidden="true" />
            <span className="lp-mark-label">RoutePulse</span>
          </header>

          <main className="lp-body">
            <div className="lp-heading-block">
              <h1 className="lp-heading">Sign in</h1>
              <p className="lp-subtext">Enter your credentials to access RoutePulse.</p>
            </div>

            {error ? (
              <div className="lp-error" role="alert">{error}</div>
            ) : null}

            <form className="lp-form" onSubmit={handleLogin}>
              <div className="lp-field">
                <label className="lp-label" htmlFor="lp-username">Username</label>
                <input
                  id="lp-username"
                  className="lp-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="dispatcher-main"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="lp-field">
                <label className="lp-label" htmlFor="lp-password">Password</label>
                <input
                  id="lp-password"
                  className="lp-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
              <button type="submit" className="lp-submit">
                Continue
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                  <path d="M2.5 7.5h10M9 4l3.5 3.5L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </main>

          <footer className="lp-panel-footer">
            <span className="lp-footer-text">New to RoutePulse?</span>
            <Link to="/register" className="lp-footer-link">Create account</Link>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default Login;
