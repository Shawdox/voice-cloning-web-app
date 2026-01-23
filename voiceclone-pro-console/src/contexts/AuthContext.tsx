import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, APIError } from '../services/api';
import type { UserProfile } from '../types/api';

interface AuthContextType {
  isLoggedIn: boolean;
  token: string | null;
  user: UserProfile | null;
  points: number;
  isVip: boolean;
  vipLevel: number;
  vipExpiresAt: Date | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updatePoints: (newPoints: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const profile = await api.user.getProfile();
          setUser(profile);
        } catch (error) {
          // Token is invalid, clear it
          console.error('Failed to load user profile:', error);
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (newToken: string) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);

    // Fetch user profile
    try {
      const profile = await api.user.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to fetch profile after login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!token) return;

    try {
      const profile = await api.user.getProfile();
      setUser(profile);
    } catch (error) {
      if (error instanceof APIError && error.status === 401) {
        // Token expired, logout
        logout();
      }
      throw error;
    }
  };

  const updatePoints = (newPoints: number) => {
    if (user) {
      setUser({ ...user, points: newPoints });
    }
  };

  const isLoggedIn = !!token && !!user;
  const points = user?.points || 0;
  const isVip = user ? user.vipLevel > 0 && (!user.vipExpiresAt || new Date(user.vipExpiresAt) > new Date()) : false;
  const vipLevel = user?.vipLevel || 0;
  const vipExpiresAt = user?.vipExpiresAt ? new Date(user.vipExpiresAt) : null;

  const value: AuthContextType = {
    isLoggedIn,
    token,
    user,
    points,
    isVip,
    vipLevel,
    vipExpiresAt,
    loading,
    login,
    logout,
    refreshProfile,
    updatePoints,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
