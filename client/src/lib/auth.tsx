import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface Director {
  id: string;
  auth_user_id: string;
  email: string;
  name: string;
  organization_name?: string;
  role: "admin" | "director";
  status: "pending" | "active" | "disabled";
  phone?: string;
}

interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  director: Director | null;
  token: string | null;
  loading: boolean;
  signup: (data: { email: string; password: string; name: string; organizationName?: string; phone?: string }) => Promise<void>;
  bootstrapAdmin: (data: { email: string; password: string; name: string; organizationName?: string; phone?: string }) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = typeof window !== "undefined" && window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [director, setDirector] = useState<Director | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check auth on mount (token stored in memory only — no localStorage)
  useEffect(() => {
    // No persisted token — fresh start each load
    setLoading(false);
  }, []);

  const signup = async (data: { email: string; password: string; name: string; organizationName?: string; phone?: string }) => {
    const resp = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error || "Signup failed");
    setUser(result.user);
    setDirector(result.director);
    setToken(result.accessToken);
  };

  const bootstrapAdmin = async (data: { email: string; password: string; name: string; organizationName?: string; phone?: string }) => {
    const resp = await fetch(`${API_BASE}/api/auth/bootstrap-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error || "Admin setup failed");
    setUser(result.user);
    setDirector(result.director);
    setToken(result.accessToken);
  };

  const login = async (email: string, password: string) => {
    const resp = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await resp.json();
    if (!resp.ok) throw new Error(result.error || "Login failed");
    setUser(result.user);
    setDirector(result.director);
    setToken(result.accessToken);
  };

  const logout = () => {
    setUser(null);
    setDirector(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{
      user, director, token, loading,
      signup, bootstrapAdmin, login, logout,
      isAuthenticated: !!user && !!token,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
