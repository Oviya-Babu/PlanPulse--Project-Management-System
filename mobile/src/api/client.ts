import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from '../storage/secureStore';

function resolveMobileApiUrl(): string {
  let url = (
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    (Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000')
  ).trim();

  url = url.replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
}

export const API_BASE_URL = resolveMobileApiUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.clearAuth();
    }
    return Promise.reject(error);
  }
);
