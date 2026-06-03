import axios from 'axios';
import { useAuthStore } from '../zustand/authStore.js';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Routes that should NEVER trigger the refresh/retry logic
const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh on 401
let refreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Skip retry logic for auth routes and already-retried requests
    const isAuthRoute = AUTH_ROUTES.some((r) => original.url?.includes(r));
    if (isAuthRoute || original._retry) {
      return Promise.reject(error);
    }
    if (error.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      refreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        // Clear state without calling the API (avoid infinite loop)
        useAuthStore.getState().clearAuth();        
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;