import CustomToast from '#shared/toast';
import axios, { AxiosError } from 'axios';
import type { AuthConfig } from './types';
import './types';

const apiBaseURL = import.meta.env.VITE_BASE_URL;

let getAccessToken: () => string | null = () => null;
let clearAuth: () => void = () => {};
let refreshAuthToken: () => Promise<void> = async () => {}; // 💡 토큰 재발급 로직 주입을 위한 변수 추가

// 💡 동시 refresh 방지: 첫 번째 401만 실제 refresh를 수행하고, 나머지는 대기
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

const onRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: (token: string | null) => void) => {
  refreshSubscribers.push(cb);
};

// 퀴즈 생성 페이지(비로그인 허용)에서는 로그인 리디렉션을 하지 않는다
const SKIP_REDIRECT_PATHS = ['/', '/ko', '/en'];

const clearAuthAndRedirect = (errorMessage?: string): void => {
  clearAuth();
  const currentPath = window.location.pathname;
  const shouldSkip = SKIP_REDIRECT_PATHS.includes(currentPath);
  if (shouldSkip) {
    // 퀴즈 생성 페이지: 리디렉션 없이 토스트만 표시
    if (errorMessage) CustomToast.error(errorMessage);
  } else {
    // 그 외 페이지: 로그인 페이지로 즉시 이동 (토스트는 로그인 페이지에서 표시)
    window.location.href = '/login?reason=session-expired';
  }
};

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

      if (originalRequest?._retry) {
        // refresh 후 재요청에서도 401 → 로그아웃
        const message =
          (error?.response?.data as { message?: string })?.message ||
          '알 수 없는 오류가 발생했습니다.';
        clearAuthAndRedirect(message);
        return new Promise(() => {});
      }

      originalRequest!._retry = true;

      // 이미 다른 요청이 refresh 중이면, 완료될 때까지 대기 후 재요청
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken) => {
            if (newToken) {
              originalRequest!.headers.Authorization = `Bearer ${newToken}`;
              resolve(axiosInstance(originalRequest!));
            } else {
              // refresh 실패 시 never-settling promise로 중복 토스트 방지
              resolve(new Promise(() => {}));
            }
          });
        });
      }

      // 첫 번째 401 요청만 실제 refresh 수행
      isRefreshing = true;
      try {
        await refreshAuthToken();
        const newAccessToken = getAccessToken();
        onRefreshed(newAccessToken);
        originalRequest!.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest!);
      } catch (refreshError) {
        onRefreshed(null);
        const message =
          (error?.response?.data as { message?: string })?.message ||
          '알 수 없는 오류가 발생했습니다.';
        clearAuthAndRedirect(message);
        return new Promise(() => {});
      } finally {
        isRefreshing = false;
      }
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
