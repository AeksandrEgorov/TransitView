// This file has auth storage helpers.

import type { AuthUser } from "../types/auth";

const TOKEN_KEY = "token";
const USER_KEY = "user";

interface StoredAuth {
  token: string;
  user: AuthUser;
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const normalizedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    const jsonPayload = decodeURIComponent(
      atob(normalizedBase64)
        .split("")
        .map((char) => {
          return `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`;
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null) {
  if (!token) {
    return true;
  }

  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
}

export function getTokenExpirationDelay(token: string | null) {
  if (!token) {
    return 0;
  }

  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return 0;
  }

  return Math.max(payload.exp * 1000 - Date.now(), 0);
}

export function getStoredAuth(): StoredAuth | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const savedUser = localStorage.getItem(USER_KEY);

  if (!token || !savedUser || isTokenExpired(token)) {
    clearStoredAuth();
    return null;
  }

  try {
    const user = JSON.parse(savedUser) as AuthUser;

    return {
      token,
      user,
    };
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function saveStoredAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getRawStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}