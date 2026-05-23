import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler: clear session and redirect to login on unauthorized responses.
// T006: Prevents stale sessions from silently failing without user feedback.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear authentication data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Dispatch a custom event so AuthContext can react without a circular dependency
      window.dispatchEvent(new CustomEvent('auth:logout'));
      // Only redirect if not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
