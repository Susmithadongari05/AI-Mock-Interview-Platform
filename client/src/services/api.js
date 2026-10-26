
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 120000,
});

// Attach the saved authentication token to requests.
API.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => Promise.reject(error),
);

// Handle expired authentication sessions.
API.interceptors.response.use(
  response => response,
  error => {
    const url = error.config?.url || '';

    const isAuthForm =
      url.includes('/auth/login') ||
      url.includes('/auth/register');

    if (
      error.response?.status === 401 &&
      !isAuthForm &&
      localStorage.getItem('token')
    ) {
      localStorage.removeItem('token');

      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  },
);

// Convert API errors into readable messages.
export const getErrorMessage = (
  error,
  fallback = 'Something went wrong.',
) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.code === 'ECONNABORTED') {
    return 'The request timed out. Please try again.';
  }

  if (error?.request && !error.response) {
    return 'Cannot reach the server. Make sure the backend is running.';
  }

  return error?.message || fallback;
};

export default API;
