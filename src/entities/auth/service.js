import axiosInstance from "#shared/api";
import { useAuthStore } from "./store";

const applyAuthFromResponse = (response) => {
  const accessToken = response?.data?.accessToken;
  if (accessToken) {
    useAuthStore.getState().setAuth({
      accessToken,
      user: response?.data?.user,
    });
  }
  return accessToken;
};

const refresh = async () => {
  const response = await axiosInstance.post(
    "/auth/refresh",
    null,
    { withCredentials: true, skipAuthRefresh: true, skipErrorToast: true }
  );
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
