"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import AuthService from "@/services/auth/auth.service";
import { getStoredToken, setStoredToken } from "@/api/token";

import type { AuthUser } from "@/features/auth/types/auth.types";

const USER_KEY = "erp_auth_user";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;

  login(
    username: string,
    password: string,
  ): Promise<void>;

  logout(): void;

  hasPermission(code: string): boolean;
}

const AuthContext = createContext<
  AuthContextValue | undefined
>(undefined);

export default function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const stored =
        window.localStorage.getItem(USER_KEY);

      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Ignore corrupted storage.
    } finally {
      setLoading(false);
    }
  }, []);

  async function login(
    username: string,
    password: string,
  ) {
    const result = await AuthService.login(
      username,
      password,
    );

    setStoredToken(result.accessToken);

    try {
      window.localStorage.setItem(
        USER_KEY,
        JSON.stringify(result.user),
      );
    } catch {
      // Ignore storage failures.
    }

    setUser(result.user);
  }

  function logout() {
    setStoredToken(null);

    try {
      window.localStorage.removeItem(USER_KEY);
    } catch {
      // Ignore storage failures.
    }

    setUser(null);
  }

  function hasPermission(code: string) {
    return Boolean(
      user?.permissions.includes(code),
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider.",
    );
  }

  return context;
}
