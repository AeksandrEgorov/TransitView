import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "../types/auth";
import { AuthContext } from "./AuthContext";

function getStoredUser(): AuthUser | null {
  const savedUser = localStorage.getItem("user");

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser) as AuthUser;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

function getStoredToken(): string | null {
  return localStorage.getItem("token");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  function loginUser(newToken: string, newUser: AuthUser) {
    setToken(newToken);
    setUser(newUser);

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  }

  function logoutUser() {
    setToken(null);
    setUser(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      loginUser,
      logoutUser,
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}