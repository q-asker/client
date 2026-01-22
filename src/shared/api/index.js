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
    console.log(error.code, error.message);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    let errorToHandle = error;
    const status = error?.response?.status;
    const originalRequest = error?.config;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh
    ) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axiosInstance.post(
          "/auth/refresh",
          null,
          { withCredentials: true, skipAuthRefresh: true }
        );
        applyAuthFromResponse(refreshResponse);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        try {
          await axiosInstance.post(
            "/auth/logout",
            null,
            { withCredentials: true, skipAuthRefresh: true }
          );
        } catch (logoutError) {
          console.log("Refresh 실패 후 logout 실패 ▶", logoutError);
        }
        useAuthStore.getState().clearAuth();
        errorToHandle = refreshError;
      }
    }

    const message =
      errorToHandle?.response?.data?.message || errorToHandle?.message;
    if (message) {
      CustomToast.error(message);
    }
    console.log("Axios Error 전체 ▶", errorToHandle);
    // 에러를 JSON으로도 찍어볼 수 있습니다. (순환 참조가 있으면 주의)
    try {
      console.log("Axios Error.toJSON() ▶", errorToHandle.toJSON());
    } catch (e) {
      console.warn("error.toJSON() 출력 중 예외 발생:", e);
    }

    // error.request나 error.config 같은 속성들도 찍어보세요.
    console.log("▶ request 객체 ▶", errorToHandle.request);
    console.log("▶ config ▶", errorToHandle.config);
    console.log("▶ response ▶", errorToHandle.response);

    return Promise.reject(errorToHandle);
  }
);

export default axiosInstance;
