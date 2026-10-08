import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getApiErrorMessage } from '../lib/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pms_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('pms_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('pms_token');
    localStorage.removeItem('pms_user');
    setUser(null);
    setToken(null);
  }, []);

  // Verify session on mount
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('pms_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.get<{ user: User }>('/auth/me');
        setUser(res.data.user);
        localStorage.setItem('pms_user', JSON.stringify(res.data.user));
      } catch {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [clearAuth]);

  // Listen for unauthorized 401 events from Axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuth();
      setSessionExpired(true);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [clearAuth]);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post<{ user: User; token: string }>('/auth/login', {
        email,
        password,
      });

      localStorage.setItem('pms_token', res.data.token);
      localStorage.setItem('pms_user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      setSessionExpired(false);
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    try {
      const res = await api.post<{ user: User; token: string }>('/auth/register', {
        fullName,
        email,
        password,
      });

      localStorage.setItem('pms_token', res.data.token);
      localStorage.setItem('pms_user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
      setSessionExpired(false);
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout network errors, still clear local session
    } finally {
      clearAuth();
      setSessionExpired(false);
    }
  };

  const clearSessionExpired = () => {
    setSessionExpired(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        sessionExpired,
        login,
        register,
        logout,
        clearSessionExpired,
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
