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
  const authorization =
    response?.headers?.authorization || response?.headers?.Authorization;
  const accessToken = extractAccessToken(authorization);
  if (accessToken) {
    useAuthStore.getState().setAuth({
      accessToken,
      user: response?.data?.user,
    });
  }
  return accessToken;
};

const login = async ({ email, password }) => {
  const response = await axiosInstance.post(
    "/auth/login",
    { email, password },
    { withCredentials: true }
  );
  applyAuthFromResponse(response);
  return response;
};

const refresh = async () => {
  const response = await axiosInstance.post(
    "/auth/refresh",
    null,
    { withCredentials: true, skipAuthRefresh: true }
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

export const authService = { login, refresh, logout };
