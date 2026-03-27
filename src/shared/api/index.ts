import CustomToast from '#shared/toast';
import axios, { AxiosError } from 'axios';
import type { AuthConfig } from './types';
import './types';

const apiBaseURL = import.meta.env.VITE_BASE_URL;

let getAccessToken: () => string | null = () => null;
let clearAuth: () => void = () => {};
let refreshAuthToken: () => Promise<void> = async () => {}; // 💡 토큰 재발급 로직 주입을 위한 변수 추가

// App.jsx나 최상위 index.js에서 설정할 때 authService.refresh도 같이 넘겨줍니다.
export const configureAuth = ({
  getAccessToken: getToken,
  clearAuth: clear,
  refreshAuthToken: refresh,
}: AuthConfig) => {
  if (typeof getToken === 'function') getAccessToken = getToken;
  if (typeof clear === 'function') clearAuth = clear;
  if (typeof refresh === 'function') refreshAuthToken = refresh;
};

const axiosInstance = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
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
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error: AxiosError) => {
    const message =
      (error?.response?.data as { message?: string })?.message || '알 수 없는 오류가 발생했습니다.';
    CustomToast.error(message);
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    const status = error?.response?.status;
    const { skipAuthRefresh, skipErrorToast } = originalRequest || {};

    if (status === 401) {
      if (skipAuthRefresh) {
        return Promise.reject(error);
      }

      // 💡 핵심 추가 방어선: 애초에 요청에 토큰이 없었다면 리프레시를 시도하지 않습니다.
      // 비회원으로 접근했는데 401이 뜬 것은 백엔드가 비회원 접근 자체를 막은 것입니다.
      const hasAuthHeader = !!originalRequest?.headers['Authorization'];
      if (!hasAuthHeader) {
        return Promise.reject(error);
      }

      if (!originalRequest?._retry) {
        originalRequest!._retry = true;
        try {
          await refreshAuthToken();
          const newAccessToken = getAccessToken();
          originalRequest!.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest!);
        } catch (refreshError) {
          const message =
            (error?.response?.data as { message?: string })?.message ||
            '알 수 없는 오류가 발생했습니다.';
          CustomToast.error(message);
          clearAuth();
          // never-settling promise: 호출부의 .then()/.catch() 모두 실행되지 않아 중복 토스트 방지
          return new Promise(() => {});
        }
      }

      // refresh 후 재요청에서도 401 → 로그아웃
      const message =
        (error?.response?.data as { message?: string })?.message ||
        '알 수 없는 오류가 발생했습니다.';
      CustomToast.error(message);
      clearAuth();
      // never-settling promise: 호출부의 .then()/.catch() 모두 실행되지 않아 중복 토스트 방지
      return new Promise(() => {});
    }

    if (!skipErrorToast) {
      const message =
        (error?.response?.data as { message?: string })?.message ||
        '알 수 없는 오류가 발생했습니다.';
      CustomToast.error(message);
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
