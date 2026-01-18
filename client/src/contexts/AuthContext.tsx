import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { trpc } from "../lib/trpc";

interface User {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "viewer";
  emailVerified: boolean;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("authToken");
  });
  const [user, setUser] = useState<User | null>(null);

  const { data, isLoading, error } = trpc.auth.me.useQuery(undefined, {
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setUser(data as User);
    } else if (error) {
      // Token is invalid or expired
      setToken(null);
      setUser(null);
      localStorage.removeItem("authToken");
    }
  }, [data, error]);

  const login = (newToken: string) => {
    localStorage.setItem("authToken", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
