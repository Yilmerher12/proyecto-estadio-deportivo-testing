// ============================================
// API INSTANCE — Instancia Axios con interceptores de autenticación
// ============================================
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './tokenService';
import { refreshTokens } from './authService';

export const api = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─────────────────────────────────────────────
// REQUEST interceptor: inyectar access token
// ─────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─────────────────────────────────────────────
// RESPONSE interceptor: manejar 401 → refresh → retry
// ─────────────────────────────────────────────
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        await clearTokens();
        return Promise.reject(error);
      }

      try {
        const newTokens = await refreshTokens(refreshToken);
        await saveTokens({
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
        });
        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export { getAccessToken, getRefreshToken, saveTokens, clearTokens };
