import axios from 'axios';
import { getStoredUser } from './auth';

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (configuredBaseUrl && isLocalHost) {
      return configuredBaseUrl;
    }

    if (!isLocalHost) {
      return '/api';
    }
  }

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  return 'http://127.0.0.1:5050/api';
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const user = getStoredUser();

  if (user?.id) {
    config.headers['x-user-id'] = user.id;
    config.headers['x-user-username'] = user.username;
    config.headers['x-user-role'] = user.role;
  }

  return config;
});

export default api;
