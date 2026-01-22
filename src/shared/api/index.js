import CustomToast from "#shared/toast";
import axios from "axios";
import { getAccessToken, useAuthStore } from "../auth/store";
const apiBaseURL = import.meta.env.VITE_BASE_URL;

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

const axiosInstance = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers = config.headers ?? {};
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    if (config.isMultipart) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => {
    CustomToast.error(error.message);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    let errorToHandle = error;
    const status = error?.response?.status;
    const { skipAuthRefresh, skipErrorToast } = error?.config || {};

    if (status === 401) {
      if (skipAuthRefresh) {
        return Promise.reject(errorToHandle);
      }
      useAuthStore.getState().clearAuth();
      window.location.assign("/login");
      CustomToast.error("로그인이 필요합니다.");
      return Promise.reject(errorToHandle);
    }

    if (!skipErrorToast) {
      const message =
        errorToHandle?.response?.data?.message || errorToHandle?.message;
      if (message) {
        CustomToast.error(message);
      } else {
        CustomToast.error("알 수 없는 오류가 발생했습니다.");
      }
    }

    return Promise.reject(errorToHandle);
  }
);

export default axiosInstance;
