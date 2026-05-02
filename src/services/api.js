import axios from 'axios';
import { toast } from '../store/useToastStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// Guard so parallel 401s only fire one toast / redirect
let sessionExpiredHandled = false;

function handleSessionExpired() {
  if (sessionExpiredHandled) return;
  sessionExpiredHandled = true;

  const role = localStorage.getItem('role');

  // Clear plain keys AND the Zustand persist key — otherwise the store
  // rehydrates with a stale token and RequireAdmin loops back into the dashboard.
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('auth-storage');

  toast.error('Session expired. Please log in again.', 2500);

  const loginPath =
    role === 'superadmin' ? '/superadmin'
    : role === 'student' ? '/student'
    : '/';

  setTimeout(() => {
    window.location.href = loginPath;
  }, 1200);
}

// ── Response interceptor: normalise errors ───────────────────────────────────
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status;
    const message =
      err.response?.data?.message ||
      err.message ||
      'Something went wrong';

    // Auto-logout on 401 (expired / missing / invalid credentials)
    if (status === 401) {
      const isLoginRequest = err.config?.url?.includes('/login');
      if (!isLoginRequest) {
        handleSessionExpired();
      }
    }

    const error = new Error(message);
    error.status = status;
    error.errors = err.response?.data?.errors || null;
    return Promise.reject(error);
  }
);

export default api;
