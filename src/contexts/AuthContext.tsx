"use client";
import {
  createContext,
  useContext,
  useSyncExternalStore,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener("ledger-auth", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("ledger-auth", callback);
  };
};
const getToken = () => localStorage.getItem("token");
const getEmail = () => localStorage.getItem("userEmail");
const serverSnapshot = () => null;
const readySnapshot = () => true;
const notReady = () => false;
interface AuthState {
  token: string | null;
  user: { email: string } | null;
  isAuthenticated: boolean;
  ready: boolean;
  login: (token: string, email: string) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const token = useSyncExternalStore(subscribe, getToken, serverSnapshot);
  const email = useSyncExternalStore(subscribe, getEmail, serverSnapshot);
  const ready = useSyncExternalStore(subscribe, readySnapshot, notReady);
  const router = useRouter();
  const login = useCallback((newToken: string, newEmail: string) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("userEmail", newEmail);
    window.dispatchEvent(new Event("ledger-auth"));
  }, []);
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    window.dispatchEvent(new Event("ledger-auth"));
    router.push("/login");
  }, [router]);
  return (
    <AuthContext.Provider
      value={{
        token,
        user: email ? { email } : null,
        isAuthenticated: !!token,
        ready,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
