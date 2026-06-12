'use client';

import type { AuthUser } from '@/lib/types/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type { AuthUser };

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  loginWithToken: (accessToken: string, user: AuthUser) => void;
  replaceUser: (user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

const STORAGE_TOKEN = 'allolabo_access_token';
const STORAGE_USER = 'allolabo_auth_user';

function persistAuth(token: string, user: AuthUser): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(STORAGE_TOKEN, token);
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  sessionStorage.removeItem(STORAGE_TOKEN);
  sessionStorage.removeItem(STORAGE_USER);
}

function clearPersistedAuth(): void {
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_USER);
  sessionStorage.removeItem(STORAGE_TOKEN);
  sessionStorage.removeItem(STORAGE_USER);
}

function readSession(): { token: string | null; user: AuthUser | null } {
  if (typeof localStorage === 'undefined') {
    return { token: null, user: null };
  }

  let storedToken = localStorage.getItem(STORAGE_TOKEN);
  let storedUser = localStorage.getItem(STORAGE_USER);

  // Migration : ancienne session par onglet (sessionStorage)
  if ((!storedToken || !storedUser) && typeof sessionStorage !== 'undefined') {
    storedToken = sessionStorage.getItem(STORAGE_TOKEN);
    storedUser = sessionStorage.getItem(STORAGE_USER);
    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser) as AuthUser;
        persistAuth(storedToken, user);
        return { token: storedToken, user };
      } catch {
        clearPersistedAuth();
        return { token: null, user: null };
      }
    }
  }

  if (!storedToken || !storedUser) {
    return { token: null, user: null };
  }
  try {
    return { token: storedToken, user: JSON.parse(storedUser) as AuthUser };
  } catch {
    clearPersistedAuth();
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const { token: t, user: u } = readSession();
      if (t && u) {
        setToken(t);
        setUser(u);
      }
      setHydrated(true);
    });
  }, []);

  const loginWithToken = useCallback((accessToken: string, u: AuthUser) => {
    persistAuth(accessToken, u);
    setToken(accessToken);
    setUser(u);
  }, []);

  const replaceUser = useCallback((u: AuthUser) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_USER, JSON.stringify(u));
    }
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearPersistedAuth();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      hydrated,
      loginWithToken,
      replaceUser,
      logout,
    }),
    [token, user, hydrated, loginWithToken, replaceUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé sous AuthProvider');
  }
  return ctx;
}
