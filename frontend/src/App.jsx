import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import { getStoredUser } from './lib/auth';

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

function App() {
  return (
    <Router>
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
  );
}

export default App;
