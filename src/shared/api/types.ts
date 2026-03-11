import 'axios';

// Axios 커스텀 속성 모듈 augmentation
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    isMultipart?: boolean;
    skipAuthRefresh?: boolean;
    skipErrorToast?: boolean;
    _retry?: boolean;
  }
}

// API 응답 공통 타입
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

// API 에러 타입
export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// 인증 설정 인터페이스
export interface AuthConfig {
  getAccessToken?: () => string | null;
  clearAuth?: () => void;
  refreshAuthToken?: () => Promise<void>;
}
