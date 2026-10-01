import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { User } from '@shared/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: { name: string; phone: string; password: string; role?: string; language?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null, token: null, isAuthenticated: false, loading: true,
  login: async () => {}, register: async () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('kisansetu_token');
    const savedUser = localStorage.getItem('kisansetu_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try { setUser(JSON.parse(savedUser)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (phone: string, password: string) => {
    const res = await authAPI.login(phone, password);
    if (!res.data.data) {
      throw new Error(res.data.error || 'Login failed');
    }
    const { token: newToken, user: newUser } = res.data.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('kisansetu_token', newToken);
    localStorage.setItem('kisansetu_user', JSON.stringify(newUser));
  };

  const register = async (data: { name: string; phone: string; password: string; role?: string; language?: string }) => {
    const res = await authAPI.register(data as any);
    if (!res.data.data) {
      throw new Error(res.data.error || 'Registration failed');
    }
    const { token: newToken, user: newUser } = res.data.data;
    if (newToken && newUser) {
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('kisansetu_token', newToken);
      localStorage.setItem('kisansetu_user', JSON.stringify(newUser));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('kisansetu_token');
    localStorage.removeItem('kisansetu_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
