"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CurrentUser } from "@/types/domain";
import { getRefreshToken, setTokens, clearTokens } from "@/lib/auth/token-storage";
import { refresh, authResponseToUser } from "@/features/auth/api/auth-api";

type SessionContextValue = {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (accessToken: string, refreshToken: string, user: CurrentUser) => void;
  clearSession: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setSession = useCallback(
    (accessToken: string, refreshToken: string, u: CurrentUser) => {
      setTokens(accessToken, refreshToken);
      setUser(u);
    },
    []
  );

  const clearSession = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  useEffect(() => {
    const rt = getRefreshToken();
    if (!rt) {
      setIsLoading(false);
      return;
    }
    refresh(rt)
      .then((res) => {
        setTokens(res.accessToken, res.refreshToken);
        setUser(authResponseToUser(res));
      })
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      setSession,
      clearSession,
    }),
    [user, isLoading, setSession, clearSession]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

export function canAccessPanel(role: string): boolean {
  return role === "ADMIN" || role === "TEACHER";
}
