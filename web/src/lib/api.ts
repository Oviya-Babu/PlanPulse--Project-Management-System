import axios from 'axios';
import { ApiError } from '../types';

function resolveApiBaseUrl(): string {
  let url = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').trim();
  // Strip trailing slashes
  url = url.replace(/\/+$/, '');
  // Guarantee /api suffix without duplication
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
}

const API_BASE_URL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pms_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 token expiry/invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect if checking auth or on login/register page
      const isAuthRoute =
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/register');

      if (!isAuthRoute) {
        localStorage.removeItem('pms_token');
        localStorage.removeItem('pms_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Extracts a user-friendly, informative error message from an API error response.
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // If the server responded with our standard ApiError envelope
    const data = error.response?.data as ApiError | undefined;
    if (data?.error?.message) {
      if (data.error.details && data.error.details.length > 0) {
        const detailsStr = data.error.details
          .map((d) => (d.field ? `${d.field}: ${d.message}` : d.message))
          .join(', ');
        return `${data.error.message} (${detailsStr})`;
      }
      return data.error.message;
    }

    // String error response
    if (typeof error.response?.data === 'string' && error.response.data.trim()) {
      return error.response.data;
    }

    // HTTP status with no body or generic body
    if (error.response?.status) {
      const status = error.response.status;
      if (status === 502 || status === 503 || status === 504) {
        return `Backend service is temporarily unavailable (HTTP ${status}). It may be cold-starting on Render.`;
      }
      if (status === 500) {
        return 'Internal server error (500). Please check backend server logs.';
      }
      return `Request failed with status ${status}: ${error.response.statusText || 'Error'}`;
    }

    // Network / CORS / timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      return 'Request timed out. The server took too long to respond.';
    }
    if (error.message === 'Network Error') {
      return 'Network Error: Unable to reach the backend server. Please verify the backend is online and CORS allows requests from this domain.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
