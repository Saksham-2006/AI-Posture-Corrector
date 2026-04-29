import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  loadSession,
  loginUser,
  logoutUser,
  signupUser,
  type CurrentUser,
} from "./authStore";

type AuthState = {
  user: CurrentUser | null;
  ready: boolean;
  signup: (input: { email: string; name: string; password: string }) => Promise<CurrentUser>;
  login: (input: { email: string; password: string }) => Promise<CurrentUser>;
  logout: () => void;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(loadSession());
    setReady(true);
  }, []);

  const signup = useCallback(async (input: { email: string; name: string; password: string }) => {
    const u = await signupUser(input);
    setUser(u);
    return u;
  }, []);

  const login = useCallback(async (input: { email: string; password: string }) => {
    const u = await loginUser(input);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, signup, login, logout }), [user, ready, signup, login, logout]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
