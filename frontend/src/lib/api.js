import axios from 'axios';
import { getStoredUser } from './auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5050/api',
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
