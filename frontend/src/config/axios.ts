import axios from "axios";

import { emitAuthLogout } from "../utils/authEvents";
import {
  clearStoredAuth,
  getRawStoredToken,
  isTokenExpired,
} from "../utils/authStorage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getRawStoredToken();

  if (!token) {
    return config;
  }

  if (isTokenExpired(token)) {
    clearStoredAuth();
    emitAuthLogout();
    return config;
  }

  config.headers.Authorization = `Bearer ${token}`;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredAuth();
      emitAuthLogout();
    }

    return Promise.reject(error);
  }
);

export default api;