import type { AxiosResponse } from 'axios';
import axiosInstance from '#shared/api';
import { useAuthStore } from './store';
import type { AuthResponse } from './types';

const decodeBase64Token = (token: unknown): string | null => {
  if (typeof token !== 'string' || !token) return null;
  const normalized = token.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const padded = padding ? normalized.padEnd(normalized.length + (4 - padding), '=') : normalized;
  try {
    return atob(padded);
  } catch {
    return token;
  }
};

const applyAuthFromResponse = (response: AxiosResponse<AuthResponse>): string | null => {
  const rawAccessToken = response?.data?.accessToken;
  const accessToken = decodeBase64Token(rawAccessToken);
  if (accessToken) {
    useAuthStore.getState().setAuth({
      accessToken,
      user: response?.data?.user,
    });
  }
  return accessToken;
};

// 동시 호출 방지: React Strict Mode 등으로 인한 중복 요청을 싱글톤 Promise로 방어
let refreshPromise: Promise<AxiosResponse<AuthResponse>> | null = null;

const refresh = (): Promise<AxiosResponse<AuthResponse>> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = axiosInstance
    .post<AuthResponse>('/auth/refresh', null, {
      withCredentials: true,
      skipAuthRefresh: true,
      skipErrorToast: true,
    })
    .then((response) => {
      applyAuthFromResponse(response);
      return response;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

const logout = async (): Promise<void> => {
  try {
    await axiosInstance.post('/auth/logout', null, { withCredentials: true });
  } finally {
    useAuthStore.getState().clearAuth();
  }
};

export const authService = { refresh, logout };
