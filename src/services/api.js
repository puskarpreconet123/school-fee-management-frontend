import axios from 'axios';

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

// ── Response interceptor: normalise errors ───────────────────────────────────
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status;
    const message =
      err.response?.data?.message ||
      err.message ||
      'Something went wrong';

    // Auto-logout on 401
    if (status === 401) {
      const isLoginRequest = err.config.url.includes('/login');
      if (!isLoginRequest) {
        const role = localStorage.getItem('role');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = role === 'superadmin' ? '/superadmin' : '/';
      }
    }

    const error = new Error(message);
    error.status = status;
    error.errors = err.response?.data?.errors || null;
    return Promise.reject(error);
  }
);

export default api;
