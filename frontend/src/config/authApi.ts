import api from "./axios";
import type { AuthUser } from "../types/auth";

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export async function login(data: LoginRequest) {
  const response = await api.post<LoginResponse>("/auth/login", data);
  return response.data;
}

export async function getMe(token: string) {
  const response = await api.get<AuthUser>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}