'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiClient } from '../lib/api';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'TECNICO';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Restore session on mount
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');
      if (storedUser && token) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Failed to parse user session', err);
      ApiClient.clearTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  // Protect administrative routes
  useEffect(() => {
    if (loading) return;

    // Public paths that do not require login:
    // - /login
    // - /equipamento/[uuid] (the public QR code page)
    const isPublicPath = 
      pathname === '/login' || 
      pathname === '/' || 
      pathname === '/equipamento' ||
      pathname === '/estabelecimento';

    if (!user && !isPublicPath) {
      router.push('/login');
    }
  }, [user, pathname, loading, router]);

  const login = async (email: string, senha: string) => {
    setLoading(true);
    try {
      const data = await ApiClient.post('/auth/login', { email, senha });
      ApiClient.setTokens(data.accessToken, data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      if (data.user.perfil === 'ADMIN') {
        router.push('/dashboard');
      } else {
        router.push('/equipamentos');
      }
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    ApiClient.clearTokens();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
