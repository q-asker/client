import axiosInstance from "#shared/api";
import { useAuthStore } from "./store";

const decodeBase64Token = (token) => {
  if (typeof token !== "string" || !token) return null;
  const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded = padding
    ? normalized.padEnd(normalized.length + (4 - padding), "=")
    : normalized;
  try {
    return atob(padded);
  } catch (error) {
    return token;
  }
};

const applyAuthFromResponse = (response) => {
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

const refresh = async () => {
  const response = await axiosInstance.post("/auth/refresh", null, {
    withCredentials: true,
    skipAuthRefresh: true,
    skipErrorToast: true,
  });
  applyAuthFromResponse(response);
  return response;
};

const logout = async () => {
  try {
    await axiosInstance.post("/auth/logout", null, { withCredentials: true });
  } finally {
    useAuthStore.getState().clearAuth();
  }
};

export const authService = { refresh, logout };
