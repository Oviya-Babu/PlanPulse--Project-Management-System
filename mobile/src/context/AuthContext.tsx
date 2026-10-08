import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { apiClient } from '../api/client';
import { storage } from '../storage/secureStore';
import { User } from '../api/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  networkError: boolean;
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  retry: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [networkError, setNetworkError] = useState<boolean>(false);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);

  const checkSession = useCallback(async () => {
    setIsLoading(true);
    setNetworkError(false);

    try {
      const storedToken = await storage.getToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      const res = await apiClient.get<{ user: User }>('/auth/me');
      setUser(res.data.user);
      await storage.saveUser(res.data.user as unknown as Record<string, unknown>);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          await storage.clearAuth();
          setUser(null);
          setToken(null);
          setSessionExpired(true);
        } else if (!err.response) {
          // Network connection error
          setNetworkError(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email: string, password: string) => {
    setNetworkError(false);
    setSessionExpired(false);
    try {
      const res = await apiClient.post<{ user: User; token: string }>('/auth/login', {
        email,
        password,
      });

      await storage.saveToken(res.data.token);
      await storage.saveUser(res.data.user as unknown as Record<string, unknown>);
      setToken(res.data.token);
      setUser(res.data.user);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setNetworkError(true);
          throw new Error('Unable to connect. Please check your internet connection and try again.');
        }
        const message = err.response.data?.error?.message;
        throw new Error(message || 'Invalid email or password.');
      }
      throw err;
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    setNetworkError(false);
    setSessionExpired(false);
    try {
      const res = await apiClient.post<{ user: User; token: string }>('/auth/register', {
        fullName,
        email,
        password,
      });

      await storage.saveToken(res.data.token);
      await storage.saveUser(res.data.user as unknown as Record<string, unknown>);
      setToken(res.data.token);
      setUser(res.data.user);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          setNetworkError(true);
          throw new Error('Unable to connect. Please check your internet connection and try again.');
        }
        const message = err.response.data?.error?.message;
        throw new Error(message || 'Registration failed. Please try again.');
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      await storage.clearAuth();
      setUser(null);
      setToken(null);
      setSessionExpired(false);
    }
  };

  const retry = async () => {
    await checkSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        networkError,
        sessionExpired,
        login,
        register,
        logout,
        retry,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
