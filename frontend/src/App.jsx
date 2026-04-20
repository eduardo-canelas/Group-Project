import React, { useEffect } from 'react';
//Load react router
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
//Load pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
//Load auth helper
import { getStoredUser } from './lib/auth';
import { ThemeProvider } from './components/theme';

function PublicOnly({ children }) {
  const user = getStoredUser();

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (user?.role === 'driver') {
    return <Navigate to="/driver" replace />;
  }

  return children;
}

function RequireRole({ role, children }) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/driver'} replace />;
  }

  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route
            path="/"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnly>
                <Register />
              </PublicOnly>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole role="admin">
                <AdminDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/driver"
            element={
              <RequireRole role="driver">
                <DriverDashboard />
              </RequireRole>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
