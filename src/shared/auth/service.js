import axiosInstance from "../api";
import { useAuthStore } from "./store";

const extractAccessToken = (authorization) => {
  if (!authorization || typeof authorization !== "string") {
    return null;
  }
  const [type, token] = authorization.split(" ");
  if (token && type.toLowerCase() === "bearer") {
    return token;
  }
  return authorization;
};

const applyAuthFromResponse = (response) => {

  const accessToken = response?.data?.accessToken 
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

export const authService = {  refresh, logout };
