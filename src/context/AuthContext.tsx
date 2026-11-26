import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  ApiError,
  authApi,
  getStoredToken,
  setStoredToken,
} from '../services/api';
import type { AuthUser } from '../types/finance';

interface AuthContextValue {
  user: AuthUser | null;
  isCheckingAuth: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(() =>
    Boolean(getStoredToken())
  );

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setIsCheckingAuth(false);
      return;
    }

    let cancelled = false;
    authApi
      .me()
      .then((res) => {
        if (!cancelled) {
          setUser(res.user);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            setStoredToken(null);
            setUser(null);
          } else {
            setStoredToken(null);
            setUser(null);
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsCheckingAuth(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setStoredToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }) => {
      const res = await authApi.register(payload);
      setStoredToken(res.token);
      setUser(res.user);
    },
    []
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isCheckingAuth,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
