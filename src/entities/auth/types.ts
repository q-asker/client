// 사용자 정보
export interface User {
  id: string;
  email?: string;
  nickname?: string;
  profileImage?: string;
}

// Zustand store 상태 + 액션
export interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAuth: (params: { accessToken?: string | null; user?: User | null }) => void;
  clearAuth: () => void;
}

// API 인증 응답 데이터
export interface AuthResponse {
  accessToken: string;
  user: User;
}
