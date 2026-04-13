import { createContext } from "react";
import type { AuthUser } from "../types/auth";

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loginUser: (token: string, user: AuthUser) => void;
  logoutUser: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);