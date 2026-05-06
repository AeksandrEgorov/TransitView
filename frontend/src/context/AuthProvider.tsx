import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import type { AuthUser } from "../types/auth";
import { AuthContext } from "./AuthContext";
import { AUTH_LOGOUT_EVENT } from "../utils/authEvents";
import {
  clearStoredAuth,
  getStoredAuth,
  getTokenExpirationDelay,
  isTokenExpired,
  saveStoredAuth,
} from "../utils/authStorage";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    const storedAuth = getStoredAuth();

    return {
      user: storedAuth?.user ?? null,
      token: storedAuth?.token ?? null,
    };
  });

  const user = auth.user;
  const token = auth.token;

  const logoutUser = useCallback(() => {
    setAuth({
      user: null,
      token: null,
    });

    clearStoredAuth();
  }, []);

  const loginUser = useCallback(
    (newToken: string, newUser: AuthUser) => {
      if (isTokenExpired(newToken)) {
        clearStoredAuth();
        return;
      }

      setAuth({
        user: newUser,
        token: newToken,
      });

      saveStoredAuth(newToken, newUser);
    },
    []
  );

  useEffect(() => {
    function handleForcedLogout() {
      logoutUser();
    }

    window.addEventListener(AUTH_LOGOUT_EVENT, handleForcedLogout);

    return () => {
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleForcedLogout);
    };
  }, [logoutUser]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const delay = getTokenExpirationDelay(token);

    const logoutTimer = window.setTimeout(() => {
      logoutUser();
    }, delay);

    return () => {
      window.clearTimeout(logoutTimer);
    };
  }, [token, logoutUser]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token && !isTokenExpired(token),
      loginUser,
      logoutUser,
    }),
    [user, token, loginUser, logoutUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}