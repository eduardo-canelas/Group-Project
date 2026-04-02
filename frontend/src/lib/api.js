import axios from 'axios';
import { getStoredUser } from './auth';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
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
